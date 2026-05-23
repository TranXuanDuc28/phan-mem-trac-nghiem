import os
import sys

# Ensure backend can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.parser import extract_slide_content
    from backend.database import SessionLocal, Base, engine
    from backend.models import Slide
except ImportError:
    from parser import extract_slide_content
    from database import SessionLocal, Base, engine
    from models import Slide

def test_parser_and_db():
    print("Testing parser...")
    pptx_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "CHUONG 1.pptx")
    
    if not os.path.exists(pptx_path):
        print(f"Error: CHUONG 1.pptx not found at {pptx_path}")
        return
        
    try:
        content = extract_slide_content(pptx_path)
        print(f"Extraction successful! Extracted {len(content)} slides.")
        preview_text = content[0]['content'][:200].encode('ascii', 'replace').decode('ascii')
        print(f"Slide 1 preview (ASCII safe): {preview_text}...")
        
        # Test Database Insertion
        print("Testing DB connection...")
        Base.metadata.create_all(bind=engine)
        
        db = SessionLocal()
        # Delete if exists to keep clean
        db.query(Slide).filter(Slide.filename == "CHUONG 1.pptx").delete()
        db.commit()
        
        # Add new slide
        db_slide = Slide(
            filename="CHUONG 1.pptx",
            file_path=pptx_path,
            content_text=content
        )
        db.add(db_slide)
        db.commit()
        db.refresh(db_slide)
        
        print(f"DB Insertion successful! Slide ID: {db_slide.id}, Uploaded at: {db_slide.uploaded_at}")
        
        # Verify read
        read_slide = db.query(Slide).filter(Slide.id == db_slide.id).first()
        print(f"DB Read successful! Filename: {read_slide.filename}, Number of slides stored: {len(read_slide.content_text)}")
        
        db.close()
        print("Backend Parser and Database verification completed successfully!")
    except Exception as e:
        print(f"Error during verification: {e}")

if __name__ == "__main__":
    test_parser_and_db()
