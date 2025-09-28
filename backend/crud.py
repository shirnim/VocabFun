from sqlalchemy.orm import Session
from . import models, schemas, security


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, tier=user.tier)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_words(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Word).filter(models.Word.owner_id == user_id).offset(skip).limit(limit).all()


def create_user_word(db: Session, word: schemas.WordCreate, user_id: int):
    db_word = models.Word(**word.dict(), owner_id=user_id)
    db.add(db_word)
    db.commit()
    db.refresh(db_word)
    return db_word


def get_progress(db: Session, user_id: int):
    return db.query(models.Progress).filter(models.Progress.owner_id == user_id).all()


def create_user_progress(db: Session, progress: schemas.ProgressCreate, user_id: int):
    # Check if a progress entry for this date already exists
    db_progress = (
        db.query(models.Progress)
        .filter(
            models.Progress.owner_id == user_id,
            models.Progress.date == progress.date
        )
        .first()
    )

    if db_progress:
        # If it exists, update it
        db_progress.words_learned += progress.words_learned
        # A simple average for the quiz score, could be more complex
        db_progress.quiz_score = (db_progress.quiz_score + progress.quiz_score) / 2
    else:
        # If it doesn't exist, create a new one
        db_progress = models.Progress(**progress.dict(), owner_id=user_id)
        db.add(db_progress)

    db.commit()
    db.refresh(db_progress)
    return db_progress
