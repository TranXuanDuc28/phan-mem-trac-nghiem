import os
import json
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
Bạn là một chuyên gia giáo dục và xây dựng đề thi trắc nghiệm học thuật. 
Hãy đọc tài liệu bài giảng (slide) dưới đây và tạo ra một bộ câu hỏi trắc nghiệm (gồm {num_questions} câu) với độ khó là "{difficulty}" bằng ngôn ngữ "{language}".

Nhiệm vụ của bạn:
1. Tạo đúng {num_questions} câu hỏi trắc nghiệm chất lượng cao, bao quát các kiến thức chính trong tài liệu.
2. Mỗi câu hỏi chỉ được lấy thông tin từ các trang slide đã cho. Không tự bịa thông tin nằm ngoài slide.
3. Mỗi câu hỏi phải có chính xác 4 lựa chọn (options).
4. **QUY TẮC THIẾT KẾ ĐÁP ÁN GÂY NHIỄU (BẮT BUỘC)**:
   - Cả 4 đáp án (A, B, C, D) phải có cấu trúc ngữ pháp tương đồng, độ dài xấp xỉ nhau và cùng bàn về một khía cạnh ngữ cảnh/thuật ngữ.
   - 3 đáp án sai (distractors) phải là các phương án gây nhiễu **cực kỳ thuyết phục và có tính logic**. Hãy sử dụng các khái niệm liên quan, các sai lầm phổ biến của học sinh, hoặc thông tin nhiễu từ các slide khác để tạo nhiễu.
   - Tuyệt đối không tạo các phương án sai ngớ ngẩn, không liên quan, quá ngắn/quá dài, hoặc quá lệch context khiến người học dễ dàng dùng phương pháp loại trừ để tìm ra đáp án đúng.
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
