import os
from pptx import Presentation
from pypdf import PdfReader

def extract_pptx_text(file_path: str):
    """
    Extracts text slide-by-slide from a PPTX file, including text boxes, tables, and speaker notes.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    prs = Presentation(file_path)
    slide_contents = []
    
    for idx, slide in enumerate(prs.slides):
        slide_text = []
        
        # 1. Extract text from standard shapes (text frames)
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    text_run = "".join(run.text for run in paragraph.runs if run.text)
                    if text_run.strip():
                        slide_text.append(text_run.strip())
            
            # 2. Extract text from tables if present
            if shape.has_table:
                table_text = []
                for row in shape.table.rows:
                    row_cells = []
                    for cell in row.cells:
                        if cell.text.strip():
                            row_cells.append(cell.text.strip())
                    if row_cells:
                        table_text.append(" | ".join(row_cells))
                if table_text:
                    slide_text.append("\n".join(table_text))
        
        # 3. Extract speaker notes (helps ground AI questions with lecture details)
        if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
            notes = slide.notes_slide.notes_text_frame.text.strip()
            if notes:
                slide_text.append(f"\n[Ghi chú slide: {notes}]")
                
        # Join texts and save slide representation
        combined_text = "\n".join(slide_text).strip()
        slide_contents.append({
            "slide_num": idx + 1,
            "content": combined_text
        })
        
    return slide_contents

def extract_pdf_text(file_path: str):
    """
    Extracts text page-by-page from a PDF file.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    reader = PdfReader(file_path)
    slide_contents = []
    
    for idx, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        slide_contents.append({
            "slide_num": idx + 1,
            "content": text.strip()
        })
        
    return slide_contents

def extract_slide_content(file_path: str):
    """
    Wrapper function to automatically detect file type and extract slide content.
    """
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pptx":
        return extract_pptx_text(file_path)
    elif ext == ".pdf":
        return extract_pdf_text(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}. Only .pptx and .pdf are supported.")
