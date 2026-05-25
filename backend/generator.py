import os
import json
import re
import google.generativeai as genai
import pydantic
from typing import List, Dict, Optional

class QuizQuestion(pydantic.BaseModel):
    question: str = pydantic.Field(description="Nội dung câu hỏi trắc nghiệm khách quan dựa trên slide.")
    options: List[str] = pydantic.Field(description="Danh sách gồm chính xác 4 đáp án lựa chọn (A, B, C, D hoặc nội dung cụ thể).")
    correct_answer: str = pydantic.Field(description="Đáp án đúng (phải trùng khớp hoàn toàn với một trong các phần tử trong options).")
    explanation: str = pydantic.Field(description="Giải thích chi tiết tại sao đáp án này đúng và các đáp án khác sai dựa trên nội dung slide.")
    source_slide: int = pydantic.Field(description="Số trang slide gốc (bắt đầu từ 1) chứa thông tin cho câu hỏi này.")

class QuizOutput(pydantic.BaseModel):
    questions: List[QuizQuestion]

def generate_quiz_from_slides(
    slide_contents: List[Dict],
    api_key: str,
    num_questions: int = 10,
    difficulty: str = "Trung bình",
    language: str = "Tiếng Việt"
) -> List[Dict]:
    """
    Calls the Gemini API to generate multiple-choice questions from slide content.
    """
    if not api_key:
        raise ValueError("API Key is missing.")

    # Configure Gemini API key for this request
    genai.configure(api_key=api_key)

    # Format slides for the prompt
    slides_text_repr = ""
    for slide in slide_contents:
        slides_text_repr += f"\n--- Trang Slide {slide['slide_num']} ---\n"
        slides_text_repr += f"{slide['content']}\n"

    # Build prompt
    prompt = f"""
Bạn là một chuyên gia giáo dục và xây dựng đề thi trắc nghiệm học thuật cấp quốc gia. 
Hãy đọc tài liệu bài giảng (slide) dưới đây và tạo ra một bộ câu hỏi trắc nghiệm (gồm {num_questions} câu) với độ khó là "{difficulty}" bằng ngôn ngữ "{language}".

Nhiệm vụ của bạn:
1. Tạo đúng {num_questions} câu hỏi trắc nghiệm chất lượng cao, bao quát các kiến thức chính trong tài liệu.
2. Mỗi câu hỏi chỉ được lấy thông tin từ các trang slide đã cho. Không tự bịa thông tin nằm ngoài slide.
3. Mỗi câu hỏi phải có chính xác 4 lựa chọn (options).
4. **QUY TẮC THIẾT KẾ ĐÁP ÁN GÂY NHIỄU (BẮT BUỘC & CỰC KỲ KHẮT KHE)**:
   - Cả 4 đáp án (A, B, C, D) phải có cấu trúc ngữ pháp tương đồng, độ dài xấp xỉ nhau, cùng sử dụng giọng văn học thuật, trung lập, trang trọng.
   - 3 đáp án sai (distractors) phải là các phương án gây nhiễu **cực kỳ thuyết phục, nghe rất có lý và có tính logic cao**. Hãy sử dụng các khái niệm thực tế có liên quan, các sự kiện lịch sử/khoa học có thật ở giai đoạn khác, hoặc các sai lầm phổ biến mà người học dễ mắc phải để làm đáp án gây nhiễu.
   - **Tác phong học thuật chuyên nghiệp**: Tuyệt đối không tạo các phương án sai ngớ ngẩn, phản khoa học, quá lệch ngữ cảnh, hoặc viết ngược lại đáp án đúng một cách ngô nghê để làm đáp án sai (Ví dụ: KHÔNG được dùng các cụm từ gây nhiễu quá rõ ràng như "Đánh dấu sự thất bại hoàn toàn...", "Thể hiện sự phân vân, thiếu quyết đoán...", "Chờ đợi từ bên ngoài...", "Không có ý nghĩa gì..."). 
   - Tất cả các phương án gây nhiễu phải được trình bày như một nhận định/quan điểm học thuật nghiêm túc, khiến người học phải suy nghĩ kỹ và hiểu sâu kiến thức mới chọn được, chứ không thể loại trừ ngay lập tức bằng cảm quan thông thường.
5. Xác định đúng đáp án đúng (correct_answer) và phải trùng khớp chính xác với một trong các lựa chọn.
6. Cung cấp lời giải thích (explanation) chi tiết và khoa học giải thích rõ vì sao đáp án đó đúng và vì sao các đáp án khác sai.
7. Xác định chính xác số trang slide (source_slide) chứa nội dung kiến thức của câu hỏi này.

Dưới đây là nội dung tài liệu bài giảng (slide):
{slides_text_repr}
"""

    # Use gemini-2.5-flash which is fast, lightweight, and supports JSON schemas
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=QuizOutput,
                temperature=0.3
            )
        )
        
        # Parse the result
        result_json = json.loads(response.text)
        return result_json.get("questions", [])
    except Exception as e:
        # Fallback error handling
        print(f"Error calling Gemini API: {e}")
        raise RuntimeError(f"Lỗi khi gọi Gemini API để tạo câu hỏi: {str(e)}")

class ParsedQuizQuestion(pydantic.BaseModel):
    question: str = pydantic.Field(description="Nội dung câu hỏi trắc nghiệm.")
    options: List[str] = pydantic.Field(description="Danh sách gồm chính xác 4 đáp án lựa chọn (A, B, C, D).")
    correct_answer: str = pydantic.Field(description="Đáp án đúng (phải trùng khớp hoàn toàn với một trong các phần tử trong options).")
    explanation: str = pydantic.Field(description="Giải thích chi tiết tại sao đáp án này đúng.")

class ParsedQuizOutput(pydantic.BaseModel):
    questions: List[ParsedQuizQuestion]

def parse_docx_quiz_with_ai(raw_text: str, api_key: str) -> List[Dict]:
    """
    Uses Gemini AI to parse a messy DOCX text with <correct> markers and structure it into a clean list of questions.
    """
    if not api_key:
        raise ValueError("API Key is missing for AI parsing.")

    genai.configure(api_key=api_key)

    prompt = f"""
Bạn là một chuyên gia xử lý dữ liệu và xây dựng đề thi trắc nghiệm từ văn bản thô.
Dưới đây là nội dung thô trích xuất từ một tài liệu Word (.docx). Trong tài liệu này, các đáp án đúng được đánh dấu bằng thẻ `<correct>...</correct>` (hoặc có thể một phần đáp án nằm trong thẻ đó).

Nhiệm vụ của bạn:
1. Đọc và phân tích toàn bộ văn bản thô bên dưới để nhận diện tất cả các câu hỏi trắc nghiệm.
2. Với mỗi câu hỏi:
   - Trích xuất tiêu đề câu hỏi sạch (bỏ các tiền tố số thứ tự lộn xộn nếu có, chỉ giữ lại nội dung câu hỏi chính xác).
   - Trích xuất đúng 4 đáp án lựa chọn (options). Nếu tài liệu gốc viết dính liền, viết không cách dòng hoặc thiếu các ký hiệu A, B, C, D, hãy tự động phân tách và chuẩn hóa chúng thành 4 tùy chọn sạch sẽ.
   - Xác định đáp án đúng (correct_answer) dựa trên sự hiện diện của thẻ `<correct>` trong tài liệu thô. Đáp án đúng bắt buộc phải trùng khớp hoàn toàn với một trong 4 phần tử trong danh sách `options`.
   - Viết lời giải thích ngắn gọn, xúc tích về lý do chọn đáp án này.
3. Trả về kết quả khớp hoàn toàn với định dạng JSON được cấu hình theo schema ParsedQuizOutput.

Dưới đây là nội dung tài liệu thô:
{raw_text}
"""
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=ParsedQuizOutput,
                temperature=0.1
            )
        )
        result_json = json.loads(response.text)
        
        # Map to our standard schema structure
        questions = []
        for q in result_json.get("questions", []):
            questions.append({
                "question": q.get("question", ""),
                "options": q.get("options", []),
                "correct_answer": q.get("correct_answer", ""),
                "explanation": q.get("explanation", "Được nhập tự động qua AI từ file Word."),
                "source_slide": 1
            })
        return questions
    except Exception as e:
        print(f"Error calling Gemini API for DOCX parsing: {e}")
        raise RuntimeError(f"Lỗi khi gọi Gemini API để phân tích cú pháp đề thi: {str(e)}")

def chunk_paragraphs(paragraphs: List[str], chunk_size: int = 15) -> List[str]:
    chunks = []
    current_chunk = []
    potential_questions = 0
    
    for p in paragraphs:
        p_clean = p.strip()
        if not p_clean:
            continue
        is_boundary = (
            re.match(r'^(?:[Cc]âu|CÂU)\s*\d+', p_clean, re.IGNORECASE) is not None or
            re.match(r'^\d+[\.:]', p_clean) is not None or
            p_clean.endswith('?') or
            p_clean.endswith(':')
        )
        
        if (is_boundary and potential_questions >= chunk_size) or len(current_chunk) >= 80:
            if current_chunk:
                chunks.append("\n".join(current_chunk))
            current_chunk = [p_clean]
            potential_questions = 1 if is_boundary else 0
        else:
            current_chunk.append(p_clean)
            if is_boundary:
                potential_questions += 1
                
    if current_chunk:
        chunks.append("\n".join(current_chunk))
    return chunks

def parse_large_docx_quiz_with_ai(raw_text: str, api_key: str) -> List[Dict]:
    """
    Splits the raw text into manageable chunks, parses each chunk using Gemini,
    and returns the combined list of parsed quiz questions.
    """
    paragraphs = raw_text.split("\n")
    chunks = chunk_paragraphs(paragraphs, chunk_size=15)
    
    all_questions = []
    for idx, chunk_text in enumerate(chunks):
        print(f"Parsing chunk {idx+1}/{len(chunks)} using Gemini AI...")
        try:
            chunk_questions = parse_docx_quiz_with_ai(chunk_text, api_key)
            all_questions.extend(chunk_questions)
        except Exception as e:
            print(f"Error parsing chunk {idx+1}: {e}")
            if not all_questions:
                raise e
                
    return all_questions
