import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearCurrentQuiz, saveAttempt } from './store/quizSlice';
import ApiKeyConfig from './components/ApiKeyConfig';
import FileUploader from './components/FileUploader';
import QuizLibrary from './components/QuizLibrary';
import QuizTaker from './components/QuizTaker';
import QuizResults from './components/QuizResults';
import QuizHistory from './components/QuizHistory';
import { Sparkles, BrainCircuit, RefreshCw } from 'lucide-react';

export default function App() {
  const dispatch = useDispatch();
  const { currentQuiz, apiKey } = useSelector((state) => state.quiz);
  
  const [activeAttempt, setActiveAttempt] = useState(null); // stores active attempt details for results view

  // Handle quiz finished
  const handleQuizFinished = (attemptData) => {
    dispatch(saveAttempt(attemptData))
      .unwrap()
      .then((savedData) => {
        setActiveAttempt(savedData);
      })
      .catch((err) => {
        console.error("Lỗi khi lưu kết quả bài thi:", err);
      });
  };

  // Reset to dashboard
  const handleRestart = () => {
    setActiveAttempt(null);
    dispatch(clearCurrentQuiz());
  };

  // Switch to quiz taker directly from history retake
  const handleQuizSelected = (quiz) => {
    setActiveAttempt(null);
  };

  return (
    <div className="min-h-screen d-flex flex-column position-relative overflow-hidden font-sans">
      {/* Background Neon Glow Effects */}
      <div className="position-absolute top-0 start-0 w-50 h-50 rounded-circle bg-indigo-900/10 blur-[120px] pointer-events-none" style={{ transform: 'translate(-10%, -10%)', filter: 'blur(120px)' }}></div>
      <div className="position-absolute bottom-0 end-0 w-50 h-50 rounded-circle bg-violet-900/10 blur-[120px] pointer-events-none" style={{ transform: 'translate(10%, 10%)', filter: 'blur(120px)' }}></div>

      {/* Header navbar */}
      <header className="border-bottom border-slate-900 bg-slate-950/80 sticky-top px-3 py-3" style={{ backdropFilter: 'blur(12px)', zIndex: 1040 }}>
        <div className="container-fluid max-w-7xl d-flex align-items-center justify-content-between p-0">
          <div className="d-flex align-items-center gap-3 cursor-pointer" onClick={handleRestart}>
            <div className="p-2 rounded-3 text-white shadow bg-gradient-header">
              <BrainCircuit size={24} />
            </div>
            <div>
              <span className="fw-extrabold fs-5 tracking-tight gradient-logo">
                SlideQuiz AI
              </span>
              <p className="m-0 text-slate-400 uppercase tracking-wider font-semibold" style={{ fontSize: '10px' }}>Sinh trắc nghiệm từ bài giảng</p>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-3 small fw-bold">
            {apiKey ? (
              <span className="d-flex align-items-center gap-2 text-emerald-400 bg-emerald-500/5 px-3 py-1 rounded-pill border border-emerald-500/10">
                <span className="d-inline-block rounded-circle bg-emerald-400 animate-pulse" style={{ width: '6px', height: '6px' }}></span>
                Gemini API Connected
              </span>
            ) : (
              <span className="d-flex align-items-center gap-2 text-amber-500 bg-amber-500/5 px-3 py-1 rounded-pill border border-amber-500/10">
                <span className="d-inline-block rounded-circle bg-amber-500" style={{ width: '6px', height: '6px' }}></span>
                Vui lòng cấu hình API Key
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow-1 container max-w-7xl py-4 py-md-5 px-3 position-relative" style={{ zIndex: 10 }}>
        {currentQuiz && !activeAttempt ? (
          // View 1: Quiz Taking Session
          <div className="py-2 animate-fade-in">
            <QuizTaker 
              quiz={currentQuiz} 
              onFinished={handleQuizFinished}
              onCancel={handleRestart}
            />
          </div>
        ) : currentQuiz && activeAttempt ? (
          // View 2: Quiz Results Review
          <div className="py-2 animate-fade-in">
            <QuizResults 
              attempt={activeAttempt} 
              quiz={currentQuiz} 
              onRestart={handleRestart}
            />
          </div>
        ) : (
          // View 3: Dashboard (Default)
          <div className="animate-fade-in">
            {/* Top Heading */}
            <div className="mb-4 mb-md-5">
              <h1 className="fw-black text-slate-100 d-flex align-items-center gap-2">
                <Sparkles size={28} className="text-indigo-400" />
                Học tập thông minh cùng AI
              </h1>
              <p className="text-slate-400 mt-1 max-w-2xl leading-relaxed small">
                Tự động hóa việc tạo đề trắc nghiệm ôn tập. Chỉ cần tải lên file slide bài giảng của bạn (.pptx hoặc .pdf), AI sẽ biên soạn các câu hỏi trắc nghiệm chất lượng kèm giải thích và chỉ định slide đối chiếu để bạn tự ôn luyện.
              </p>
            </div>

            <div className="row g-4">
              {/* Left columns (Forms and inputs) */}
              <div className="col-lg-8">
                <ApiKeyConfig />
                <FileUploader onQuizSelected={handleQuizSelected} />
                <QuizLibrary onQuizSelected={handleQuizSelected} />
              </div>
              
              {/* Right column (History) */}
              <div className="col-lg-4">
                <QuizHistory onQuizSelected={handleQuizSelected} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-top border-slate-900 bg-slate-950/40 text-center py-4 text-slate-500" style={{ fontSize: '12px' }}>
        <p className="m-0">© 2026 SlideQuiz AI - Nền tảng ôn thi trắc nghiệm thông minh từ Slide bài học.</p>
      </footer>
    </div>
  );
}
