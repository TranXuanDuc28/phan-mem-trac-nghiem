import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setApiKey } from '../store/quizSlice';
import { Key, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

export default function ApiKeyConfig() {
  const dispatch = useDispatch();
  const storedKey = useSelector((state) => state.quiz.apiKey);
  const [keyInput, setKeyInput] = useState(storedKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    dispatch(setApiKey(keyInput.trim()));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="card glass-panel p-4 mb-4">
      <div className="d-flex align-items-center gap-3 mb-3">
        <div className="p-2 rounded-3 bg-indigo-500/10 text-indigo-400">
          <Key size={20} />
        </div>
        <div>
          <h3 className="font-semibold fs-5 text-slate-100 m-0">Cấu hình Gemini API Key</h3>
          <p className="m-0 text-slate-400 small">Yêu cầu API key để sinh câu hỏi trắc nghiệm tự động</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="d-flex flex-column gap-3">
        <div className="position-relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Nhập Gemini API Key của bạn..."
            className="form-control pe-5 py-2.5"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent text-slate-500 hover:text-slate-300 pe-3"
            style={{ outline: 'none' }}
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2 small text-amber-500">
            <AlertCircle size={14} className="shrink-0" />
            <span>Key của bạn sẽ chỉ được lưu cục bộ trên trình duyệt.</span>
          </div>

          <button
            type="submit"
            className={`btn d-flex align-items-center gap-2 ${
              saved ? 'btn-success' : 'btn-primary'
            }`}
          >
            {saved ? (
              <>
                <Check size={16} /> Đã lưu
              </>
            ) : (
              'Lưu Key'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
