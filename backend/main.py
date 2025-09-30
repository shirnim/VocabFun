
import os
import sys
import random
import requests
from datetime import date, datetime
from typing import List

# Add project root to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import Depends, FastAPI, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from transformers import T5Tokenizer, T5ForConditionalGeneration

from backend import crud, models, schemas, security
from backend.database import SessionLocal, engine

# --- Environment Variables & Configuration ---

# Check for SECRET_KEY
if not security.SECRET_KEY:
    raise ValueError("Missing SECRET_KEY environment variable. Cannot start application.")

# Unsplash Access Key
UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY")
if not UNSPLASH_ACCESS_KEY:
    print("Warning: UNSPLASH_ACCESS_KEY environment variable not set. Image generation will use fallback.")

# Frontend URL for CORS
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# Fallback images directory
FALLBACK_IMAGE_DIR = "backend/static/images"
os.makedirs(FALLBACK_IMAGE_DIR, exist_ok=True) # Ensure directory exists

# --- Database Setup ---
models.Base.metadata.create_all(bind=engine)

# --- FastAPI App Initialization ---
app = FastAPI()

# --- Static Files ---
# This will serve images from `backend/static/images` under the path `/static/images`
app.mount("/static", StaticFiles(directory="backend/static"), name="static")


# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependencies ---
def get_db():
    """Dependency to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- AI Model Setup ---
# Using a smaller, more efficient model for sentence generation
tokenizer = T5Tokenizer.from_pretrained("google/flan-t5-small")
sentence_model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-small")


# --- API Endpoints ---

# region Authentication
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=username)
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(security.get_current_active_user)):
    return current_user

# endregion

# region Core Features
@app.post("/generate_sentence")
def generate_sentence(
    word: str,
    current_user: schemas.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.tier == "free":
        today = date.today()
        start_of_day = datetime.combine(today, datetime.min.time())
        end_of_day = datetime.combine(today, datetime.max.time())
        words_today = (
            db.query(models.Word)
            .filter(
                models.Word.owner_id == current_user.id,
                models.Word.timestamp >= start_of_day,
                models.Word.timestamp < end_of_day,
            )
            .count()
        )
        if words_today >= 10:  # Increased free tier limit
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You have reached your daily limit of 10 words for the free tier."
            )

    # Generate sentence
    input_text = f"A simple, kid-friendly sentence using the word '{word}':"
    input_ids = tokenizer(input_text, return_tensors="pt").input_ids
    outputs = sentence_model.generate(input_ids, max_length=40, num_beams=5, early_stopping=True)
    sentence = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Store the generated word for the user
    crud.create_user_word(db, word=schemas.WordCreate(word=word, sentence=sentence), user_id=current_user.id)

    return {"sentence": sentence}

@app.post("/generate_quiz")
def generate_quiz(
    word: str,
    sentence: str,
    current_user: schemas.User = Depends(security.get_current_active_user)
):
    quiz_question = sentence.replace(word, "______")
    options = [word]
    try:
        response = requests.get("https://random-word-api.herokuapp.com/word?number=3")
        response.raise_for_status()
        distractors = response.json()
        if word in distractors:
            distractors.remove(word)
        options.extend(distractors[:2])  # Ensure only 2 distractors are added
    except requests.exceptions.RequestException as e:
        print(f"Error fetching random words: {e}. Using fallback.")
        distractors = ["sun", "moon", "star", "sky", "cloud"]
        distractors.remove(word) if word in distractors else None
        options.extend(random.sample(distractors, 2))

    random.shuffle(options)
    return {"question": quiz_question, "options": options, "answer": word}

@app.post("/generate_image")
def generate_image(
    word: str,
    current_user: schemas.User = Depends(security.get_current_active_user)
):
    image_url = f"/static/images/fallback_{word.lower()}.png"

    if UNSPLASH_ACCESS_KEY:
        try:
            response = requests.get(
                "https://api.unsplash.com/search/photos",
                params={"query": f"cartoon {word}", "per_page": 1, "orientation": "squarish"},
                headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}
            )
            response.raise_for_status()
            data = response.json()
            if data["results"]:
                image_url = data["results"][0]["urls"]["small"]
        except requests.exceptions.RequestException as e:
            print(f"Error fetching image from Unsplash: {e}. Using fallback.")
            # Fallback is already set

    # If the Unsplash call fails or is not configured, we might not have a specific fallback file.
    # You could create a generic one or check for its existence.
    fallback_path = os.path.join(FALLBACK_IMAGE_DIR, f"fallback_{word.lower()}.png")
    if not os.path.exists(fallback_path):
         # In a real app, you might have generic fallbacks like 'fallback_noun.png'
        print(f"No specific fallback image found for {word}. A generic one could be used.")

    return {"image_url": image_url}
#endregion


# region User Progress
@app.get("/progress/", response_model=List[schemas.Progress])
def get_my_progress(
    current_user: schemas.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.get_progress(db=db, user_id=current_user.id)

@app.post("/progress/", response_model=schemas.Progress)
def create_or_update_progress(
    progress: schemas.ProgressCreate,
    current_user: schemas.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.create_user_progress(db=db, progress=progress, user_id=current_user.id)

#endregion
