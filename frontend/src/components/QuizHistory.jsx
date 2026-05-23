import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAttempts, fetchQuizzes, setCurrentQuiz } from '../store/quizSlice';
import { History, Calendar, CheckCircle2, Clock, Play, BookOpen } from 'lucide-react';

export default function QuizHistory({ onQuizSelected, onViewAttempt }) {
  const dispatch = useDispatch();
  const { attempts, quizzes, loading } = useSelector((state) => state.quiz);

  useEffect(() => {
    dispatch(fetchAttempts());
    dispatch(fetchQuizzes());
  }, [dispatch]);

  const getQuizTitle = (quizId) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    return quiz ? quiz.title : 'Đề trắc nghiệm đã bị xóa';
  };

  const getQuizDifficulty = (quizId) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    return quiz ? quiz.difficulty : '';
  };

  const handleRetake = (quizId) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (quiz) {
      dispatch(setCurrentQuiz(quiz));
      onQuizSelected(quiz);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading && attempts.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        Đang tải lịch sử...
      </div>
    );
  }

  return (
    <div className="card glass-panel p-4">
      <div className="d-flex align-items-center gap-3 mb-3">
        <div className="p-2 rounded-3 bg-indigo-500/10 text-indigo-400">
          <History size={20} />
        </div>
        <div>
          <h3 className="font-semibold fs-5 text-slate-100 m-0">Lịch sử luyện tập</h3>
          <p className="m-0 text-slate-400 small">Thống kê kết quả luyện tập của bạn</p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="text-center py-5 text-slate-500 text-sm italic">
          Chưa làm bài trắc nghiệm nào. Hãy tải lên slide để bắt đầu luyện tập!
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table m-0">
            <thead>
              <tr>
                <th>Đề trắc nghiệm</th>
                <th className="text-center">Điểm số</th>
                <th className="text-center">Ngày làm</th>
                <th className="text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => {
                const quizTitle = getQuizTitle(attempt.quiz_id);
                const quizDiff = getQuizDifficulty(attempt.quiz_id);
                const scorePercent = Math.round((attempt.score / attempt.total_questions) * 100);

                return (
                  <tr key={attempt.id}>
                    <td className="text-slate-200" style={{ maxWidth: '180px' }}>
                      <div className="text-line-clamp-1 font-medium" title={quizTitle}>
                        {quizTitle}
                      </div>
                      <span className="small text-slate-500" style={{ fontSize: '10px' }}>
                        Thời gian: {formatTime(attempt.time_spent)}
                      </span>
                    </td>
                    <td className="text-center text-slate-200">
                      <div className="d-flex align-items-center justify-content-center gap-1.5">
                        <CheckCircle2 size={14} className={scorePercent >= 80 ? 'text-emerald-400' : scorePercent >= 50 ? 'text-amber-500' : 'text-rose-500'} />
                        <span className="fw-semibold">{attempt.score}/{attempt.total_questions}</span>
                      </div>
                      <div className="text-slate-500" style={{ fontSize: '10px' }}>({scorePercent}%)</div>
                    </td>
                    <td className="text-center text-slate-400" style={{ fontSize: '12px' }}>
                      <div className="d-flex align-items-center justify-content-center gap-1">
                        <Calendar size={12} className="text-slate-500" />
                        <span>{formatDate(attempt.completed_at).split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="text-end">
                      {quizTitle !== 'Đề trắc nghiệm đã bị xóa' && (
                        <div className="d-flex justify-content-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => onViewAttempt && onViewAttempt(attempt)}
                            className="btn btn-outline-info py-1 px-2.5 d-inline-flex align-items-center gap-1"
                            style={{ fontSize: '11px', borderColor: 'rgba(13, 202, 240, 0.4)', color: '#0dcaf0' }}
                          >
                            <BookOpen size={10} /> Xem lại
                          </button>
                          <button
                            onClick={() => handleRetake(attempt.quiz_id)}
                            className="btn btn-outline-primary py-1 px-2.5 d-inline-flex align-items-center gap-1"
                            style={{ fontSize: '11px' }}
                          >
                            <Play size={10} /> Làm lại
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
