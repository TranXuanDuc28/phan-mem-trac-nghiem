import React, { useState, useEffect } from 'react';
import { Timer, ArrowLeft, ArrowRight, CheckCircle, HelpCircle } from 'lucide-react';

export default function QuizTaker({ quiz, onFinished, onCancel }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // Stores key-value: { originalQuestionIndex: selectedOptionString }
  const [checkedQuestions, setCheckedQuestions] = useState({}); // Stores key-value: { originalQuestionIndex: boolean }
  const [timeSpent, setTimeSpent] = useState(0); // in seconds

  // Shuffle questions on mount and preserve their original indices
  const [shuffledQuestions] = useState(() => {
    const arr = quiz.questions.map((q, idx) => ({ ...q, originalIdx: idx }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const currentQuestion = shuffledQuestions[currentIdx];

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSelectOption = (option) => {
    const originalIdx = currentQuestion.originalIdx;
    if (checkedQuestions[originalIdx]) return; // Lock options once checked
    setAnswers((prev) => ({
      ...prev,
      [originalIdx]: option
    }));
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const handleNext = () => {
    if (currentIdx < shuffledQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleSubmit = () => {
    // Calculate score using the original quiz questions structure
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correct_answer) {
        score++;
      }
    });

    onFinished({
      quiz_id: quiz.id,
      score,
      total_questions: quiz.questions.length,
      time_spent: timeSpent,
      answers // mapped as { "originalIdx": "User Option" }
    });
  };

  const progressPercent = ((currentIdx + 1) / shuffledQuestions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto card glass-panel p-4 p-md-5">
      {/* Quiz Header info */}
      <div className="d-flex align-items-center justify-content-between border-bottom border-slate-800 pb-3 mb-4">
        <div>
          <span className="bg-indigo-500/10 text-indigo-400 small fw-bold px-3 py-1 rounded-pill uppercase tracking-wider" style={{ fontSize: '11px' }}>
            {quiz.difficulty}
          </span>
          <h2 className="fw-bold text-slate-100 mt-2 text-line-clamp-1 h4">{quiz.title}</h2>
        </div>
        <div className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-3 bg-slate-900 text-slate-300 font-mono small border border-slate-800">
          <Timer size={16} className="text-indigo-400" />
          <span>{formatTime(timeSpent)}</span>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="mb-4">
        <div className="d-flex justify-content-between small text-slate-400 mb-2 fw-semibold" style={{ fontSize: '12px' }}>
          <span>Câu {currentIdx + 1} của {shuffledQuestions.length}</span>
          <span>{Math.round(progressPercent)}% Hoàn thành</span>
        </div>
        <div className="w-100 bg-slate-950 h-2 rounded-pill overflow-hidden border border-slate-900" style={{ height: '8px' }}>
          <div 
            className="progress-bar-custom"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="mb-4">
        <div className="d-flex gap-3 mb-3">
          <div className="p-1 rounded text-indigo-400 mt-1">
            <HelpCircle size={20} />
          </div>
          <h3 className="fw-medium text-slate-200 leading-relaxed h5">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Options list */}
        <div className="d-flex flex-column gap-3 mt-4 ps-md-4">
          {currentQuestion.options.map((option, idx) => {
            const originalIdx = currentQuestion.originalIdx;
            const isSelected = answers[originalIdx] === option;
            const isChecked = checkedQuestions[originalIdx];
            const isCorrect = option === currentQuestion.correct_answer;
            const letter = String.fromCharCode(65 + idx); // A, B, C, D

            let btnClass = "";
            if (isChecked) {
              if (isCorrect) {
                btnClass = "correct";
              } else if (isSelected) {
                btnClass = "incorrect";
              } else {
                btnClass = "disabled-fade";
              }
            } else if (isSelected) {
              btnClass = "selected";
            }

            return (
              <button
                key={idx}
                disabled={isChecked}
                onClick={() => handleSelectOption(option)}
                className={`option-button d-flex align-items-center ${btnClass}`}
              >
                <span className="option-letter">
                  {letter}
                </span>
                <span className="flex-grow-1 text-wrap">{option}</span>
                {isChecked && isCorrect && <span className="ms-auto text-success small fw-bold">✓ ĐÚNG</span>}
                {isChecked && isSelected && !isCorrect && <span className="ms-auto text-danger small fw-bold">✗ SAI</span>}
              </button>
            );
          })}
        </div>

        {/* Check Answer Button */}
        {!checkedQuestions[currentQuestion.originalIdx] && answers[currentQuestion.originalIdx] && (
          <div className="ps-md-4 mt-3">
            <button
              onClick={() => setCheckedQuestions((prev) => ({ ...prev, [currentQuestion.originalIdx]: true }))}
              className="btn btn-warning w-100 py-2.5 fw-bold animate-fade-in shadow-sm"
              style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000' }}
            >
              🔍 Kiểm tra đáp án
            </button>
          </div>
        )}

        {/* Detailed Explanation */}
        {checkedQuestions[currentQuestion.originalIdx] && (
          <div className="ps-md-4 mt-4">
            <div className="p-4 rounded-3 bg-slate-950 border border-slate-800 animate-fade-in">
              <h4 className="fw-semibold text-indigo-400 mb-2 h6" style={{ fontSize: '14px' }}>💡 Giải thích chi tiết:</h4>
              <p className="text-slate-300 mb-2 small leading-relaxed" style={{ fontSize: '13px' }}>
                {currentQuestion.explanation}
              </p>
              {currentQuestion.source_slide && (
                <div className="text-slate-500 small" style={{ fontSize: '11px' }}>
                  Nguồn kiến thức: Slide trang {currentQuestion.source_slide}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="d-flex align-items-center justify-content-between border-top border-slate-800 pt-4 mt-4">
        <button
          onClick={onCancel}
          className="btn btn-link text-decoration-none text-slate-400 hover:text-slate-200 uppercase tracking-wider small p-0"
          style={{ fontSize: '11px' }}
        >
          Thoát bài làm
        </button>

        <div className="d-flex gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="btn btn-outline-secondary d-flex align-items-center gap-1.5"
            style={{ opacity: currentIdx === 0 ? 0.4 : 1 }}
          >
            <ArrowLeft size={16} /> <span className="d-none d-sm-inline">Câu trước</span>
          </button>

          {currentIdx === shuffledQuestions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < shuffledQuestions.length}
              className="btn btn-success d-flex align-items-center gap-1.5"
              style={{ opacity: Object.keys(answers).length < shuffledQuestions.length ? 0.5 : 1 }}
            >
              <CheckCircle size={16} /> Nộp bài
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="btn btn-primary d-flex align-items-center gap-1.5"
            >
              <span className="d-none d-sm-inline">Câu tiếp</span> <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
      
      {/* Warning if not all questions answered */}
      {currentIdx === shuffledQuestions.length - 1 && Object.keys(answers).length < shuffledQuestions.length && (
        <p className="text-end small text-amber-500 mt-2 fw-medium" style={{ fontSize: '12px' }}>
          * Bạn phải trả lời tất cả các câu hỏi để có thể nộp bài (Còn thiếu {shuffledQuestions.length - Object.keys(answers).length} câu).
        </p>
      )}
    </div>
  );
}
