
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from . import crud, models, schemas
from .database import SessionLocal, engine

import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer
from diffusers import StableDiffusionPipeline
import random
import os

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS
origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models
# It's recommended to load these models once at startup
sentence_model = T5ForConditionalGeneration.from_pretrained("t5-small")
sentence_tokenizer = T5Tokenizer.from_pretrained("t5-small")

# Check if a GPU is available and if not, use a CPU
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load the Stable Diffusion model
image_pipe = StableDiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5", torch_dtype=torch.float16 if device == "cuda" else torch.float32)
image_pipe = image_pipe.to(device)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/generate_sentence", response_model=schemas.Sentence)
def generate_sentence(word: schemas.Word, db: Session = Depends(get_db)):
    input_text = f"generate a sentence with the word: {word.word}"
    input_ids = sentence_tokenizer.encode(input_text, return_tensors="pt").to(device)
    outputs = sentence_model.generate(input_ids, max_length=50, num_beams=4, early_stopping=True)
    sentence = sentence_tokenizer.decode(outputs[0], skip_special_tokens=True)
    return {"sentence": sentence}

@app.post("/generate_quiz", response_model=schemas.Quiz)
def generate_quiz(word: schemas.Word, db: Session = Depends(get_db)):
    # Simple quiz generation: the word and two distractors
    distractors = ["apple", "house", "car", "tree", "sun"]
    random.shuffle(distractors)
    options = [word.word] + distractors[:2]
    random.shuffle(options)
    return {"options": options, "answer": word.word}

@app.post("/generate_image", response_model=schemas.Image)
def generate_image(word: schemas.Word, db: Session = Depends(get_db)):
    # Image generation
    prompt = f"a simple, cartoonish image of {word.word} for a child to learn vocabulary"
    image = image_pipe(prompt).images[0]

    # Create a directory for images if it doesn't exist
    if not os.path.exists("generated_images"):
        os.makedirs("generated_images")

    # Save the image
    image_path = f"generated_images/{word.word}.png"
    image.save(image_path)

    return {"image_url": f"/images/{word.word}.png"}

@app.get("/images/{image_name}")
async def get_image(image_name: str):
    return FileResponse(f"generated_images/{image_name}")

@app.get("/progress/{user_id}", response_model=schemas.Progress)
def get_progress(user_id: int, db: Session = Depends(get_db)):
    # Placeholder for progress tracking
    return {"words_learned": 5, "average_score": 0.8}
