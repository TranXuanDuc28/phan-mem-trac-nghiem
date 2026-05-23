import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQuizzes, setCurrentQuiz } from '../store/quizSlice';
import { BookOpen, User, Play, Award, Calendar } from 'lucide-react';

export default function QuizLibrary({ onQuizSelected }) {
  const dispatch = useDispatch();
  const { quizzes, loading } = useSelector((state) => state.quiz);

  useEffect(() => {
    dispatch(fetchQuizzes());
  }, [dispatch]);

  const handleStartQuiz = (quiz) => {
    dispatch(setCurrentQuiz(quiz));
    onQuizSelected(quiz);
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading && quizzes.length === 0) {
    return (
      <div className="text-center py-4 text-slate-400">
        Đang tải kho đề trắc nghiệm...
      </div>
    );
  }

  return (
    <div className="card glass-panel p-4 mb-4">
      <div className="d-flex align-items-center gap-3 mb-3">
        <div className="p-2 rounded-3 bg-indigo-500/10 text-indigo-400">
          <BookOpen size={20} />
        </div>
        <div>
          <h3 className="font-semibold fs-5 text-slate-100 m-0">Kho đề trắc nghiệm chia sẻ</h3>
          <p className="m-0 text-slate-400 small">Chọn bất kỳ đề trắc nghiệm nào dưới đây để ôn tập</p>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-5 text-slate-500 text-sm italic">
          Chưa có đề trắc nghiệm nào được tạo. Hãy là người đầu tiên tải lên slide và tạo đề trắc nghiệm!
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table m-0">
            <thead>
              <tr>
                <th>Tên đề trắc nghiệm</th>
                <th>Người tạo</th>
                <th className="text-center">Số câu</th>
                <th className="text-center">Độ khó</th>
                <th className="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz.id}>
                  <td className="text-slate-200" style={{ maxWidth: '240px' }}>
                    <div className="text-line-clamp-1 font-medium" title={quiz.title}>
                      {quiz.title}
                    </div>
                    <span className="small text-slate-500 d-flex align-items-center gap-1" style={{ fontSize: '10px' }}>
                      <Calendar size={10} /> Ngày tạo: {formatDate(quiz.created_at)}
                    </span>
                  </td>
                  <td className="text-slate-300" style={{ fontSize: '13px' }}>
                    <div className="d-flex align-items-center gap-1">
                      <User size={12} className="text-slate-500" />
                      <span>{quiz.creator || 'Ẩn danh'}</span>
                    </div>
                  </td>
                  <td className="text-center text-slate-200 font-semibold" style={{ fontSize: '13px' }}>
                    {quiz.num_questions}
                  </td>
                  <td className="text-center">
                    <span 
                      className={`badge rounded-pill ${
                        quiz.difficulty === 'Dễ' 
                          ? 'bg-success/10 text-success' 
                          : quiz.difficulty === 'Khó' 
                          ? 'bg-danger/10 text-danger' 
                          : 'bg-warning/10 text-warning'
                      }`}
                      style={{ fontSize: '11px', padding: '0.35em 0.65em' }}
                    >
                      {quiz.difficulty}
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      className="btn btn-primary btn-sm py-1 px-2.5 d-inline-flex align-items-center gap-1"
                      style={{ fontSize: '11px' }}
                    >
                      <Play size={10} /> Vào thi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
