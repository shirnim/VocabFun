from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_words(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Word).offset(skip).limit(limit).all()


def create_user_word(db: Session, word: schemas.WordCreate, user_id: int):
    db_word = models.Word(**word.dict(), owner_id=user_id)
    db.add(db_word)
    db.commit()
    db.refresh(db_word)
    return db_word


def get_progress(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Progress)
        .filter(models.Progress.owner_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_user_progress(db: Session, progress: schemas.ProgressCreate, user_id: int):
    db_progress = models.Progress(**progress.dict(), owner_id=user_id)
    db.add(db_progress)
    db.commit()
    db.refresh(db_progress)
    return db_progress
