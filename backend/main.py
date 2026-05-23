import os
import shutil
from typing import List, Dict, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from sqlalchemy import text
try:
    from backend.database import engine, get_db, Base
    from backend.models import Slide, Quiz, QuizAttempt
    from backend.parser import extract_slide_content
    from backend.generator import generate_quiz_from_slides
except ImportError:
    from database import engine, get_db, Base
    from models import Slide, Quiz, QuizAttempt
    from parser import extract_slide_content
    from generator import generate_quiz_from_slides

# Initialize DB tables (creates tables if they don't exist)
Base.metadata.create_all(bind=engine)

# Migration to add creator column if not exists
try:
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE slides ADD COLUMN creator VARCHAR(100)"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE quizzes ADD COLUMN creator VARCHAR(100)"))
        except Exception:
            pass
except Exception as e:
    print(f"Migration error: {e}")

app = FastAPI(title="AI Slide Quiz Generator API")

# Configure CORS
# Allow local React (Vite defaults to http://localhost:5173) and any origins for production/Vercel
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins != ["*"] else ["*"],
    allow_credentials=True if allowed_origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Pydantic schemas for requests/responses
class SlideResponse(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    content_text: List[Dict]
    creator: Optional[str] = "Ẩn danh"

    class Config:
        from_attributes = True

class QuizGenerateRequest(BaseModel):
    slide_id: int
    num_questions: int = 10
    difficulty: str = "Trung bình"
    language: str = "Tiếng Việt"
    creator: Optional[str] = "Ẩn danh"

class QuizResponse(BaseModel):
    id: int
    slide_id: int
    title: str
    difficulty: str
    num_questions: int
    questions: List[Dict]
    created_at: datetime
    creator: Optional[str] = "Ẩn danh"

    class Config:
        from_attributes = True

class AttemptCreateRequest(BaseModel):
    quiz_id: int
    score: int
    total_questions: int
    time_spent: int
    answers: Dict[str, str]

class AttemptResponse(BaseModel):
    id: int
    quiz_id: int
    score: int
    total_questions: int
    time_spent: int
    answers: Dict[str, str]
    completed_at: datetime

    class Config:
        from_attributes = True

@app.get("/")
def read_root():
    return {"message": "AI Slide Quiz Generator API is running!"}

# --- Slide Endpoints ---

@app.get("/api/slides", response_model=List[SlideResponse])
def get_slides(db: Session = Depends(get_db)):
    slides = db.query(Slide).order_by(Slide.uploaded_at.desc()).all()
    return slides

@app.post("/api/upload", response_model=SlideResponse)
def upload_slide(
    file: UploadFile = File(...),
    creator: str = Form("Ẩn danh"),
    db: Session = Depends(get_db)
):
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pptx", ".pdf"]:
        raise HTTPException(status_code=400, detail="Only .pptx and .pdf files are supported.")
    
    # Save file to upload directory
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Extract content slide-by-slide
        extracted_content = extract_slide_content(file_path)
        
        # Save to DB
        db_slide = Slide(
            filename=file.filename,
            file_path=file_path,
            content_text=extracted_content,
            creator=creator
        )
        db.add(db_slide)
        db.commit()
        db.refresh(db_slide)
        
        return db_slide
    except Exception as e:
        # Clean up file if error occurs
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý file: {str(e)}")

# --- Quiz Endpoints ---

@app.get("/api/quizzes", response_model=List[QuizResponse])
def get_quizzes(db: Session = Depends(get_db)):
    return db.query(Quiz).order_by(Quiz.created_at.desc()).all()

@app.get("/api/quizzes/{quiz_id}", response_model=QuizResponse)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài trắc nghiệm.")
    return quiz

@app.post("/api/generate", response_model=QuizResponse)
def generate_quiz(
    request: QuizGenerateRequest,
    x_gemini_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    # 1. Fetch slide content
    slide = db.query(Slide).filter(Slide.id == request.slide_id).first()
    if not slide:
        raise HTTPException(status_code=404, detail="Không tìm thấy slide được chọn.")
        
    # 2. Get API key (Header first, then environment variable)
    api_key = x_gemini_api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=400, 
            detail="Vui lòng cung cấp Gemini API Key (nhập trong phần cấu hình hoặc cấu hình trên server)."
        )
        
    # 3. Call AI Generator
    try:
        questions = generate_quiz_from_slides(
            slide_contents=slide.content_text,
            api_key=api_key,
            num_questions=request.num_questions,
            difficulty=request.difficulty
        )
        
        # 4. Save Quiz to database
        title = f"Trắc nghiệm: {os.path.splitext(slide.filename)[0]} ({request.difficulty})"
        db_quiz = Quiz(
            slide_id=slide.id,
            title=title,
            difficulty=request.difficulty,
            num_questions=len(questions),
            questions=questions,
            creator=request.creator or slide.creator or "Ẩn danh"
        )
        db.add(db_quiz)
        db.commit()
        db.refresh(db_quiz)
        
        return db_quiz
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Quiz Attempt Endpoints ---

@app.get("/api/attempts", response_model=List[AttemptResponse])
def get_attempts(db: Session = Depends(get_db)):
    return db.query(QuizAttempt).order_by(QuizAttempt.completed_at.desc()).all()

@app.post("/api/attempts", response_model=AttemptResponse)
def create_attempt(request: AttemptCreateRequest, db: Session = Depends(get_db)):
    # Verify quiz exists
    quiz = db.query(Quiz).filter(Quiz.id == request.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài trắc nghiệm tương ứng.")
        
    # Create attempt
    db_attempt = QuizAttempt(
        quiz_id=request.quiz_id,
        score=request.score,
        total_questions=request.total_questions,
        time_spent=request.time_spent,
        answers=request.answers
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    
    return db_attempt

# Run local development server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
