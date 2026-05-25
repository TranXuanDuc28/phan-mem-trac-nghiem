import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSlides, uploadSlide, generateQuiz, fetchQuizzes, importQuizDocx } from '../store/quizSlice';
import { Upload, FileText, Settings2, Sparkles, BookOpen, AlertTriangle, Loader2 } from 'lucide-react';

export default function FileUploader({ onQuizSelected }) {
  const dispatch = useDispatch();
  const { slides, loading, generating, error, apiKey, quizzes } = useSelector((state) => state.quiz);
  
  const [selectedSlideId, setSelectedSlideId] = useState('');
  const [numQuestions, setNumQuestions] = useState(20);
  const [difficulty, setDifficulty] = useState('Trung bình');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [creator, setCreator] = useState(localStorage.getItem('slide_creator_name') || 'Ẩn danh');
  const [subject, setSubject] = useState(localStorage.getItem('slide_subject_name') || 'Chủ nghĩa xã hội khoa học');
  const [customSubject, setCustomSubject] = useState('');
  
  // Custom range selection states
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [startSlide, setStartSlide] = useState(1);
  const [endSlide, setEndSlide] = useState(1);

  const selectedSlide = slides.find((s) => s.id.toString() === selectedSlideId);
  const maxSlides = selectedSlide ? selectedSlide.content_text.length : 1;

  useEffect(() => {
    dispatch(fetchSlides());
    dispatch(fetchQuizzes());
  }, [dispatch]);

  // Set default selected slide if available and reset range boundaries
  useEffect(() => {
    if (slides.length > 0 && !selectedSlideId) {
      setSelectedSlideId(slides[0].id.toString());
    }
  }, [slides, selectedSlideId]);

  useEffect(() => {
    if (selectedSlide) {
      setStartSlide(1);
      setEndSlide(selectedSlide.content_text.length);
    }
  }, [selectedSlideId, slides]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setUploadError(null);
    const file = e.dataTransfer.files[0];
    validateAndUpload(file);
  };

  const handleFileSelect = (e) => {
    setUploadError(null);
    const file = e.target.files[0];
    validateAndUpload(file);
  };

  const validateAndUpload = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'pptx' && ext !== 'pdf' && ext !== 'docx') {
      setUploadError('Chỉ chấp nhận file PowerPoint (.pptx), PDF (.pdf) hoặc Word (.docx)');
      return;
    }
    
    const activeSubject = subject === 'Khác' ? (customSubject.trim() || 'Khác') : subject;
    
    if (ext === 'docx') {
      dispatch(importQuizDocx({ file, creator, subject: activeSubject }))
        .unwrap()
        .then((newQuiz) => {
          onQuizSelected(newQuiz);
        })
        .catch((err) => {
          setUploadError(err);
        });
    } else {
      dispatch(uploadSlide({ file, creator, subject: activeSubject }))
        .unwrap()
        .then((newSlide) => {
          setSelectedSlideId(newSlide.id.toString());
        })
        .catch((err) => {
          setUploadError(err);
        });
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!selectedSlideId) return;
    
    const payload = {
      slideId: parseInt(selectedSlideId),
      numQuestions,
      difficulty,
      creator
    };

    if (useCustomRange) {
      payload.start_slide = startSlide;
      payload.end_slide = endSlide;
    }

    dispatch(generateQuiz(payload))
    .unwrap()
    .then((quiz) => {
      onQuizSelected(quiz);
    });
  };

  return (
    <div className="row g-4 mb-4">
      {/* Slide Upload Panel */}
      <div className="col-md-6">
        <div className="card glass-panel p-4 h-100 d-flex flex-column justify-content-between">
          <div>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="p-2 rounded-3 bg-emerald-500/10 text-emerald-400">
                <Upload size={20} />
              </div>
              <div>
                <h3 className="font-semibold fs-5 text-slate-100 m-0">Tải lên tài liệu</h3>
                <p className="text-slate-400 small m-0">Tải file bài giảng (PPTX/PDF) hoặc đề Word (DOCX)</p>
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-sm-6">
                <label className="d-block small text-slate-400 mb-2 uppercase tracking-wider font-semibold" style={{ fontSize: '11px' }}>
                  Tên người tạo / Tác giả
                </label>
                <input
                  type="text"
                  value={creator}
                  onChange={(e) => {
                    setCreator(e.target.value);
                    localStorage.setItem('slide_creator_name', e.target.value);
                  }}
                  placeholder="Nhập tên của bạn..."
                  className="form-control py-2"
                  style={{ fontSize: '13px' }}
                  disabled={loading || generating}
                />
              </div>

              <div className="col-sm-6">
                <label className="d-block small text-slate-400 mb-2 uppercase tracking-wider font-semibold" style={{ fontSize: '11px' }}>
                  Danh mục Môn học
                </label>
                <select
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    localStorage.setItem('slide_subject_name', e.target.value);
                  }}
                  className="form-select py-2"
                  style={{ fontSize: '13px' }}
                  disabled={loading || generating}
                >
                  <option value="Chủ nghĩa xã hội khoa học">Chủ nghĩa xã hội khoa học</option>
                  <option value="Triết học Mác - Lênin">Triết học Mác - Lênin</option>
                  <option value="Kinh tế chính trị Mác - Lênin">Kinh tế chính trị Mác - Lênin</option>
                  <option value="Lịch sử Đảng Cộng sản Việt Nam">Lịch sử Đảng Cộng sản Việt Nam</option>
                  <option value="Tư tưởng Hồ Chí Minh">Tư tưởng Hồ Chí Minh</option>
                  <option value="Khác">Môn học khác (Tự nhập)</option>
                </select>
              </div>
            </div>

            {subject === 'Khác' && (
              <div className="mb-3 animate-fade-in">
                <label className="d-block small text-slate-400 mb-2 uppercase tracking-wider font-semibold" style={{ fontSize: '11px' }}>
                  Nhập tên môn học khác
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Ví dụ: Toán cao cấp, Anh văn,..."
                  className="form-control py-2"
                  style={{ fontSize: '13px' }}
                  disabled={loading || generating}
                />
              </div>
            )}

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-3 p-4 p-md-5 text-center transition-all position-relative ${
                isDragOver 
                  ? 'border-indigo-500 bg-indigo-500/5' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/20'
              }`}
            >
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".pptx, .pdf, .docx"
                className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
                disabled={loading || generating}
              />
              {loading ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-3 gap-2">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                  <p className="text-sm text-slate-300 m-0">Đang đọc tài liệu và lưu dữ liệu...</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  <div className="mx-auto w-12 h-12 rounded-circle bg-slate-900 d-flex align-items-center justify-content-center text-slate-400">
                    <Upload size={24} />
                  </div>
                  <div className="text-sm">
                    <span className="text-indigo-400 font-semibold">Click để chọn</span> hoặc kéo thả file vào đây
                  </div>
                  <p className="text-slate-500 small m-0" style={{ fontSize: '12px' }}>Hỗ trợ .pptx, .pdf (sinh bằng AI) hoặc .docx (nhập trực tiếp)</p>
                </div>
              )}
            </div>
            
            {(uploadError || error) && (
              <div className="mt-3 p-2.5 rounded-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 d-flex align-items-start gap-2" style={{ fontSize: '12px' }}>
                <AlertTriangle className="shrink-0 mt-0.5" size={14} />
                <span>{uploadError || error}</span>
              </div>
            )}
          </div>

          {/* Slides List dropdown / preview */}
          <div className="mt-4">
            <label className="d-block small text-slate-400 mb-2 uppercase tracking-wider font-semibold" style={{ fontSize: '11px' }}>
              Tài liệu bài giảng đã tải lên ({slides.length})
            </label>
            {slides.length === 0 ? (
              <div className="text-sm text-slate-500 py-2 italic">Chưa có tài liệu nào. Vui lòng tải lên!</div>
            ) : (
              <select
                value={selectedSlideId}
                onChange={(e) => setSelectedSlideId(e.target.value)}
                className="form-select py-2.5"
                disabled={loading || generating}
              >
                {slides.map((slide) => (
                  <option key={slide.id} value={slide.id}>
                    {slide.filename} ({slide.subject || 'Chủ nghĩa xã hội khoa học'} - {slide.content_text.length} trang)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Generation Parameters */}
      <div className="col-md-6">
        <div className="card glass-panel p-4 h-100 d-flex flex-column justify-content-between">
          <div>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="p-2 rounded-3 bg-indigo-500/10 text-indigo-400">
                <Settings2 size={20} />
              </div>
              <div>
                <h3 className="font-semibold fs-5 text-slate-100 m-0">Thiết lập Quiz AI</h3>
                <p className="text-slate-400 small m-0">Tùy chỉnh số lượng câu hỏi và độ khó</p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="d-flex flex-column gap-3">
              <div>
                <label className="d-block small text-slate-400 mb-2 uppercase tracking-wider font-semibold" style={{ fontSize: '11px' }}>
                  Số lượng câu hỏi
                </label>
                <div className="row g-2">
                  {[20, 30, 40, 50, 0].map((num) => (
                    <div className="col" key={num}>
                      <button
                        type="button"
                        onClick={() => setNumQuestions(num)}
                        className={`w-100 py-2 btn text-nowrap ${
                          numQuestions === num ? 'btn-primary' : 'btn-outline-secondary'
                        }`}
                        disabled={generating}
                        style={{ fontSize: '13px', paddingLeft: '2px', paddingRight: '2px' }}
                      >
                        {num === 0 ? 'Tự động' : num}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="d-block small text-slate-400 mb-2 uppercase tracking-wider font-semibold" style={{ fontSize: '11px' }}>
                  Mức độ khó
                </label>
                <div className="row g-2">
                  {['Dễ', 'Trung bình', 'Khó'].map((diff) => (
                    <div className="col-4" key={diff}>
                      <button
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`w-100 py-2 btn ${
                          difficulty === diff ? 'btn-primary' : 'btn-outline-secondary'
                        }`}
                        disabled={generating}
                      >
                        {diff}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="d-block small text-slate-400 mb-2 uppercase tracking-wider font-semibold" style={{ fontSize: '11px' }}>
                  Phạm vi Slide học tập
                </label>
                <div className="d-flex align-items-center gap-4 mb-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="rangeType"
                      id="allSlidesRadio"
                      checked={!useCustomRange}
                      onChange={() => setUseCustomRange(false)}
                      disabled={generating}
                    />
                    <label className="form-check-label text-slate-300 small cursor-pointer" htmlFor="allSlidesRadio">
                      Tất cả slide ({maxSlides} trang)
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="rangeType"
                      id="customRangeRadio"
                      checked={useCustomRange}
                      onChange={() => setUseCustomRange(true)}
                      disabled={generating}
                    />
                    <label className="form-check-label text-slate-300 small cursor-pointer" htmlFor="customRangeRadio">
                      Chọn khoảng Slide
                    </label>
                  </div>
                </div>

                {useCustomRange && (
                  <div className="row g-2 align-items-center mt-2 p-3 rounded bg-slate-950/40 border border-slate-900 animate-fade-in">
                    <div className="col-5">
                      <div className="d-flex align-items-center gap-2">
                        <span className="small text-slate-400 shrink-0" style={{ fontSize: '12px' }}>Từ trang:</span>
                        <input
                          type="number"
                          min="1"
                          max={maxSlides}
                          value={startSlide}
                          onChange={(e) => setStartSlide(Math.max(1, Math.min(maxSlides, parseInt(e.target.value) || 1)))}
                          className="form-control text-center py-1.5"
                          style={{ fontSize: '13px' }}
                          disabled={generating}
                        />
                      </div>
                    </div>
                    <div className="col-2 text-center text-slate-500">—</div>
                    <div className="col-5">
                      <div className="d-flex align-items-center gap-2">
                        <span className="small text-slate-400 shrink-0" style={{ fontSize: '12px' }}>Đến trang:</span>
                        <input
                          type="number"
                          min="1"
                          max={maxSlides}
                          value={endSlide}
                          onChange={(e) => setEndSlide(Math.max(1, Math.min(maxSlides, parseInt(e.target.value) || 1)))}
                          className="form-control text-center py-1.5"
                          style={{ fontSize: '13px' }}
                          disabled={generating}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className="mt-4">
            {!apiKey && (
              <div className="mb-3 p-2.5 rounded-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 d-flex align-items-start gap-2" style={{ fontSize: '12px' }}>
                <AlertTriangle className="shrink-0 mt-0.5" size={14} />
                <span>Hãy cấu hình Gemini API Key trước để tạo câu hỏi trắc nghiệm bằng AI.</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || !selectedSlideId || !apiKey}
              className={`btn btn-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2 ${
                generating || !selectedSlideId || !apiKey ? 'opacity-50' : ''
              }`}
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  AI đang sinh bộ câu hỏi...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Tạo câu hỏi trắc nghiệm AI
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
