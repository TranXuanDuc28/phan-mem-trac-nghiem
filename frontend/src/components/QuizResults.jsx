import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { CheckCircle2, XCircle, Clock, Award, BookOpen, ChevronRight, X, AlertCircle } from 'lucide-react';

export default function QuizResults({ attempt, quiz, onRestart }) {
  const { slides } = useSelector((state) => state.quiz);
  const [activeSlideRef, setActiveSlideRef] = useState(null); // stores slide number to show in drawer

  const { score, total_questions, time_spent, answers } = attempt;
  const percentage = Math.round((score / total_questions) * 100);

  // Find the associated slide to pull reference texts
  const associatedSlide = slides.find((s) => s.id === quiz.slide_id);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getSlideText = (slideNum) => {
    if (!associatedSlide) return 'Không tìm thấy dữ liệu slide liên quan.';
    const slidePage = associatedSlide.content_text.find((c) => c.slide_num === slideNum);
    return slidePage ? slidePage.content : 'Nội dung slide trống hoặc không có thông tin.';
  };

  return (
    <div className="max-w-4xl mx-auto position-relative">
      {/* Drawer for Slide Reference */}
      {activeSlideRef && (
        <div className="slide-drawer-backdrop z-50 d-flex justify-content-end animate-fade-in">
          <div className="slide-drawer-content d-flex flex-column justify-content-between shadow-2xl animate-slide-in">
            <div>
              <div className="d-flex align-items-center justify-content-between border-bottom border-slate-800 pb-3 mb-4">
                <div className="d-flex align-items-center gap-2">
                  <BookOpen className="text-indigo-400" size={20} />
                  <h3 className="fw-bold fs-5 text-slate-100 m-0">Slide tham chiếu số {activeSlideRef}</h3>
                </div>
                <button
                  onClick={() => setActiveSlideRef(null)}
                  className="btn btn-outline-secondary p-1"
                  style={{ borderRadius: '0.375rem' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="small text-slate-400 mb-2 font-mono uppercase tracking-wider" style={{ fontSize: '11px' }}>
                Nguồn: {associatedSlide?.filename}
              </div>
              <div className="bg-slate-950/80 rounded-3 p-4 border border-slate-800/80 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap" style={{ minHeight: '300px' }}>
                {getSlideText(activeSlideRef)}
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-top border-slate-800 text-xs text-slate-500 d-flex align-items-center gap-2">
              <AlertCircle size={14} className="text-indigo-500 shrink-0" />
              <span>Nội dung trên là văn bản trích xuất trực tiếp từ file slide bài học gốc.</span>
            </div>
          </div>
          {/* Backdrop click closer */}
          <div className="flex-grow-1" onClick={() => setActiveSlideRef(null)}></div>
        </div>
      )}

      {/* Main Results card */}
      <div className="card glass-panel p-4 p-md-5 mb-4 text-center">
        <div className="d-inline-flex p-4 rounded-circle bg-indigo-500/10 text-indigo-400 mb-3 mx-auto">
          <Award size={48} />
        </div>
        <h2 className="text-2xl fw-bold text-slate-100 mb-1 h3">Kết quả bài làm của bạn</h2>
        <p className="small text-slate-400 mb-4">{quiz.title}</p>

        <div className="row g-3 max-w-md mx-auto mb-4">
          <div className="col-4">
            <div className="bg-slate-950/40 border border-slate-800/50 rounded-3 p-3">
              <div className="h4 fw-black text-indigo-400 m-0">{percentage}%</div>
              <div className="small text-slate-500 fw-semibold uppercase tracking-wider mt-1" style={{ fontSize: '10px' }}>Độ chính xác</div>
            </div>
          </div>
          <div className="col-4">
            <div className="bg-slate-950/40 border border-slate-800/50 rounded-3 p-3">
              <div className="h4 fw-black text-emerald-400 m-0">{score}/{total_questions}</div>
              <div className="small text-slate-500 fw-semibold uppercase tracking-wider mt-1" style={{ fontSize: '10px' }}>Đúng</div>
            </div>
          </div>
          <div className="col-4">
            <div className="bg-slate-950/40 border border-slate-800/50 rounded-3 p-3">
              <div className="h4 fw-black text-amber-500 d-flex align-items-center justify-content-center gap-1 m-0">
                <Clock size={16} />
                <span>{formatTime(time_spent)}</span>
              </div>
              <div className="small text-slate-500 fw-semibold uppercase tracking-wider mt-1" style={{ fontSize: '10px' }}>Thời gian</div>
            </div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="btn btn-primary px-4 py-2.5"
        >
          Làm bài kiểm tra khác
        </button>
      </div>

      {/* Detailed Review Section */}
      <h3 className="fw-bold text-slate-200 mb-3 ps-1 h5">Xem lại câu hỏi chi tiết</h3>
      <div className="d-flex flex-column gap-3">
        {quiz.questions.map((q, idx) => {
          const userAnswer = answers[idx.toString()] || answers[idx];
          const isCorrect = userAnswer === q.correct_answer;

          return (
            <div key={idx} className={`card glass-panel p-4 border-start border-4 ${isCorrect ? 'border-success' : 'border-danger'}`}>
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div className="d-flex gap-3">
                  <div className="mt-1">
                    {isCorrect ? (
                      <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
                    ) : (
                      <XCircle className="text-rose-400 shrink-0" size={18} />
                    )}
                  </div>
                  <div>
                    <h4 className="fw-medium text-slate-200 small leading-relaxed m-0 h6">{q.question}</h4>
                    
                    {/* User's choice and correct choice */}
                    <div className="mt-2 d-flex flex-column gap-1 small" style={{ fontSize: '12px' }}>
                      <div className="text-slate-400">
                        Đáp án bạn chọn: <span className={isCorrect ? 'text-emerald-400 fw-medium' : 'text-rose-400 fw-medium'}>{userAnswer || '(Không trả lời)'}</span>
                      </div>
                      {!isCorrect && (
                        <div className="text-slate-400">
                          Đáp án đúng: <span className="text-emerald-400 fw-medium">{q.correct_answer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanation & References */}
              <div className="mt-3 pt-3 border-top border-slate-800/60 bg-slate-950/20 rounded-3 p-3 small text-slate-400" style={{ fontSize: '13px' }}>
                <div className="fw-semibold text-slate-300 mb-1">Lời giải thích chi tiết:</div>
                <p className="leading-relaxed m-0">{q.explanation}</p>
                
                <div className="mt-2.5 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <span className="small text-slate-500 bg-slate-900 border border-slate-800/80 px-2 py-1 rounded" style={{ fontSize: '10px' }}>
                    Slide tham chiếu: Slide {q.source_slide}
                  </span>
                  <button
                    onClick={() => setActiveSlideRef(q.source_slide)}
                    className="btn btn-link text-decoration-none text-indigo-400 hover:text-indigo-300 small p-0 fw-medium d-flex align-items-center gap-1"
                    style={{ fontSize: '12px' }}
                  >
                    <BookOpen size={12} /> Xem slide tham chiếu <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
