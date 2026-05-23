from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class Slide(Base):
    __tablename__ = "slides"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    creator = Column(String(100), nullable=True, default="Ẩn danh")
    # content_text stores slide content as a list of dicts: [{"slide_num": 1, "content": "Slide content text"}]
    content_text = Column(JSON, nullable=False)

    # Relationships
    quizzes = relationship("Quiz", back_populates="slide", cascade="all, delete-orphan")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    slide_id = Column(Integer, ForeignKey("slides.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    difficulty = Column(String(50), nullable=False)
    num_questions = Column(Integer, nullable=False)
    creator = Column(String(100), nullable=True, default="Ẩn danh")
    # questions stores the generated list of questions as JSON
    # [{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "...", "explanation": "...", "source_slide": 1}]
    questions = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    slide = relationship("Slide", back_populates="quizzes")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    time_spent = Column(Integer, nullable=False) # In seconds
    # answers stores mapping of question index to user's selected option: {"0": "Option A", "1": "Option B"}
    answers = Column(JSON, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    quiz = relationship("Quiz", back_populates="attempts")
