
from pydantic import BaseModel
from typing import List, Optional

class Word(BaseModel):
    word: str

class Sentence(BaseModel):
    sentence: str

class Quiz(BaseModel):
    options: List[str]
    answer: str

class Image(BaseModel):
    image_url: str

class Progress(BaseModel):
    words_learned: int
    average_score: float

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        orm_mode = True
