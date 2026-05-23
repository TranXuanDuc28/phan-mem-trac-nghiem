import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSlides, uploadSlide, generateQuiz, fetchQuizzes } from '../store/quizSlice';
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

  useEffect(() => {
    dispatch(fetchSlides());
    dispatch(fetchQuizzes());
  }, [dispatch]);

  // Set default selected slide if available
  useEffect(() => {
    if (slides.length > 0 && !selectedSlideId) {
      setSelectedSlideId(slides[0].id.toString());
    }
  }, [slides, selectedSlideId]);

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
    if (ext !== 'pptx' && ext !== 'pdf') {
      setUploadError('Chỉ chấp nhận file PowerPoint (.pptx) và PDF (.pdf)');
      return;
    }
    dispatch(uploadSlide({ file, creator }))
      .unwrap()
      .then((newSlide) => {
        setSelectedSlideId(newSlide.id.toString());
      })
      .catch((err) => {
        setUploadError(err);
      });
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!selectedSlideId) return;
    dispatch(generateQuiz({
      slideId: parseInt(selectedSlideId),
      numQuestions,
      difficulty,
      creator
    }))
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
                <h3 className="font-semibold fs-5 text-slate-100 m-0">Tải lên tài liệu slide</h3>
                <p className="text-slate-400 small m-0">Tải lên file bài giảng PPTX hoặc PDF mới</p>
              </div>
            </div>

            <div className="mb-3">
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
                accept=".pptx, .pdf"
                className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
                disabled={loading || generating}
              />
              {loading ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-3 gap-2">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                  <p className="text-sm text-slate-300 m-0">Đang đọc slide và trích xuất dữ liệu...</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  <div className="mx-auto w-12 h-12 rounded-circle bg-slate-900 d-flex align-items-center justify-content-center text-slate-400">
                    <Upload size={24} />
                  </div>
                  <div className="text-sm">
                    <span className="text-indigo-400 font-semibold">Click để chọn</span> hoặc kéo thả file vào đây
                  </div>
                  <p className="text-slate-500 small m-0" style={{ fontSize: '12px' }}>Hỗ trợ định dạng .pptx và .pdf</p>
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
                    {slide.filename} ({slide.content_text.length} trang)
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
                  {[20, 30, 40, 50].map((num) => (
                    <div className="col-3" key={num}>
                      <button
                        type="button"
                        onClick={() => setNumQuestions(num)}
                        className={`w-100 py-2 btn ${
                          numQuestions === num ? 'btn-primary' : 'btn-outline-secondary'
                        }`}
                        disabled={generating}
                      >
                        {num}
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
