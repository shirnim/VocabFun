from sqlalchemy import create_engine, Column, Integer, String, Date, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker


Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    tier = Column(String, default="free")  # "free" or "paid"

    words = relationship("Word", back_populates="owner")
    progress = relationship("Progress", back_populates="owner")

class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, index=True)
    timestamp = Column(Date)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="words")

class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    words_learned = Column(Integer)
    quiz_score = Column(Float)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="progress")
