
from sqlalchemy.orm import Session

from . import models, schemas

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    fake_hashed_password = user.password + "notreallyhashed"
    db_user = models.User(email=user.email, hashed_password=fake_hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_words(db: Session, user_id: int):
    return db.query(models.Word).filter(models.Word.user_id == user_id).all()

def create_user_word(db: Session, word: schemas.Word, user_id: int):
    db_word = models.Word(**word.dict(), user_id=user_id)
    db.add(db_word)
    db.commit()
    db.refresh(db_word)
    return db_word

def get_progress(db: Session, user_id: int):
    return db.query(models.Progress).filter(models.Progress.user_id == user_id).first()

def create_or_update_progress(db: Session, user_id: int, progress: schemas.Progress):
    db_progress = get_progress(db, user_id)
    if db_progress:
        db_progress.words_learned = progress.words_learned
        db_progress.average_score = progress.average_score
    else:
        db_progress = models.Progress(**progress.dict(), user_id=user_id)
        db.add(db_progress)
    db.commit()
    db.refresh(db_progress)
    return db_progress
