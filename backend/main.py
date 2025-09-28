
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta

from . import crud, models, schemas
from .database import SessionLocal, engine

import torch
from transformers import T5Tokenizer, T5ForConditionalGeneration
from diffusers import StableDiffusionPipeline
from PIL import Image
import random
import os
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm


# --- Database Setup ---
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allows frontend to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- AI Model Setup ---
# Sentence Generation
tokenizer = T5Tokenizer.from_pretrained("t5-small")
sentence_model = T5ForConditionalGeneration.from_pretrained("t5-small")

# Image Generation
# Note: This is a placeholder for a real Stable Diffusion model.
# For a real application, you would load a model like "runwayml/stable-diffusion-v1-5"
# and have the appropriate hardware (GPU).
# For this example, we'll simulate image generation.
def generate_cartoon_image(prompt: str):
    """
    Simulates generating a cartoon image.
    In a real app, you'd use a library like `diffusers` and a pre-trained model.
    """
    # Create a dummy image
    img = Image.new('RGB', (256, 256), color = '#%06x' % random.randint(0, 0xFFFFFF))
    # You could draw some text on it
    # from PIL import ImageDraw
    # d = ImageDraw.Draw(img)
    # d.text((10,10), prompt, fill=(255,255,0))
    # Save it to a file
    if not os.path.exists("frontend/public/images"):
        os.makedirs("frontend/public/images")

    image_path = f"frontend/public/images/{prompt.replace(' ', '_')}.png"
    img.save(image_path)
    return f"/images/{prompt.replace(' ', '_')}.png"

# --- Authentication ---
SECRET_KEY = "your-secret-key"  # In a real app, use environment variables
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user


# --- API Endpoints ---
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user

@app.post("/generate_sentence")
def generate_sentence(word: str, current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.tier == "free":
        # Check daily word limit
        today = date.today()
        start_of_day = today
        end_of_day = today + timedelta(days=1)
        words_today = (
            db.query(models.Word)
            .filter(
                models.Word.owner_id == current_user.id,
                models.Word.timestamp >= start_of_day,
                models.Word.timestamp < end_of_day,
            )
            .count()
        )
        if words_today >= 5:
            raise HTTPException(status_code=403, detail="Free tier daily limit reached")

    # Generate sentence
    input_text = f"A kid-friendly sentence with the word {word}:"
    input_ids = tokenizer(input_text, return_tensors="pt").input_ids
    outputs = sentence_model.generate(input_ids, max_length=32, num_beams=4, early_stopping=True)
    sentence = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return {"sentence": sentence}

@app.post("/generate_quiz")
def generate_quiz(word: str, sentence: str):
    # Create a fill-in-the-blank quiz
    quiz_question = sentence.replace(word, "______")
    options = [word]
    # Add two random distractor words (this could be improved)
    distractors = ["apple", "house", "car", "dog", "school"]
    distractors.remove(word) if word in distractors else None
    options.extend(random.sample(distractors, 2))
    random.shuffle(options)
    return {"question": quiz_question, "options": options, "answer": word}

@app.post("/generate_image")
def generate_image(word: str):
    image_url = generate_cartoon_image(f"cartoon illustration of {word}")
    return {"image_url": image_url}

@app.get("/progress/{user_id}", response_model=List[schemas.Progress])
def get_progress(user_id: int, current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.id != user_id and current_user.tier != "paid":
         raise HTTPException(status_code=403, detail="Not authorized to view this progress")
    return crud.get_progress(db=db, user_id=user_id)


@app.post("/progress/", response_model=schemas.Progress)
def create_progress(progress: schemas.ProgressCreate, current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.create_user_progress(db=db, progress=progress, user_id=current_user.id)
