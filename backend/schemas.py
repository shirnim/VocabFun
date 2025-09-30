from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class WordBase(BaseModel):
    word: str
    sentence: str

class WordCreate(WordBase):
    pass

class Word(WordBase):
    id: int
    owner_id: int
    timestamp: datetime

    class Config:
        orm_mode = True

class ProgressBase(BaseModel):
    date: datetime
    words_learned: int
    quiz_score: float

class ProgressCreate(ProgressBase):
    pass

class Progress(ProgressBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    tier: str

class User(UserBase):
    id: int
    tier: str
    words: List[Word] = []
    progress: List[Progress] = []

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
