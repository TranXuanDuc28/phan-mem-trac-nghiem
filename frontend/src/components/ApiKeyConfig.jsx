import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveApiKeys, setActiveApiKeyId } from '../store/quizSlice';
import { Key, Eye, EyeOff, Check, AlertCircle, Plus, Trash2, Settings, List } from 'lucide-react';

export default function ApiKeyConfig() {
  const dispatch = useDispatch();
  const apiKeys = useSelector((state) => state.quiz.apiKeys || []);
  const activeApiKeyId = useSelector((state) => state.quiz.activeApiKeyId || '');
  
  const [showManager, setShowManager] = useState(false);
  const [tempKeys, setTempKeys] = useState([]);
  const [showKeyMap, setShowKeyMap] = useState({});
  const [saved, setSaved] = useState(false);

  // Sync tempKeys when manager opens or apiKeys change
  useEffect(() => {
    setTempKeys(JSON.parse(JSON.stringify(apiKeys)));
  }, [apiKeys, showManager]);

  const handleActiveChange = (e) => {
    dispatch(setActiveApiKeyId(e.target.value));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleAddKey = () => {
    const newId = `key_${Date.now()}`;
    const keyNum = tempKeys.length + 1;
    setTempKeys([
      ...tempKeys,
      { id: newId, name: `Gemini Key ${keyNum}`, value: '' }
    ]);
  };

  const handleRemoveKey = (id) => {
    setTempKeys(tempKeys.filter((k) => k.id !== id));
  };

  const handleTempKeyChange = (id, field, val) => {
    setTempKeys(
      tempKeys.map((k) => (k.id === id ? { ...k, [field]: val } : k))
    );
  };

  const toggleShowKey = (id) => {
    setShowKeyMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveList = (e) => {
    e.preventDefault();
    // Filter out completely empty key values if any, or keep them for user to fill later
    dispatch(saveApiKeys(tempKeys));
    setShowManager(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activeKeyObj = apiKeys.find((k) => k.id === activeApiKeyId);

  return (
    <div className="card glass-panel p-4 mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 rounded-3 bg-indigo-500/10 text-indigo-400">
            <Key size={20} />
          </div>
          <div>
            <h3 className="font-semibold fs-5 text-slate-100 m-0">Danh sách Gemini API Keys</h3>
            <p className="m-0 text-slate-400 small">Quản lý và chuyển đổi nhiều API key linh hoạt</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowManager(!showManager)}
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
        >
          {showManager ? (
            <>
              <List size={14} /> Xem danh sách chọn
            </>
          ) : (
            <>
              <Settings size={14} /> Quản lý Keys ({apiKeys.length})
            </>
          )}
        </button>
      </div>

      {!showManager ? (
        // Selector View
        <div>
          {apiKeys.length === 0 ? (
            <div className="text-center py-4 border border-dashed border-slate-800 rounded-3 bg-slate-950/20">
              <AlertCircle className="text-slate-500 mb-2" size={24} />
              <p className="text-slate-400 small mb-3">Chưa có API Key nào được lưu cục bộ.</p>
              <button
                type="button"
                onClick={() => setShowManager(true)}
                className="btn btn-primary btn-sm d-flex align-items-center gap-2 mx-auto"
              >
                <Plus size={14} /> Thêm Key đầu tiên
              </button>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              <div>
                <label className="d-block small text-slate-400 mb-2 uppercase tracking-wider font-semibold" style={{ fontSize: '11px' }}>
                  Chọn API Key đang hoạt động
                </label>
                <div className="d-flex align-items-center gap-3">
                  <select
                    value={activeApiKeyId}
                    onChange={handleActiveChange}
                    className="form-select py-2.5"
                    style={{ flex: 1 }}
                  >
                    {apiKeys.map((key) => (
                      <option key={key.id} value={key.id}>
                        {key.name} ({key.value ? `${key.value.substring(0, 6)}...${key.value.slice(-4)}` : 'Chưa nhập'})
                      </option>
                    ))}
                  </select>
                  {saved && (
                    <span className="text-emerald-400 small d-flex align-items-center gap-1">
                      <Check size={16} /> Đã kích hoạt
                    </span>
                  )}
                </div>
              </div>
              <div className="d-flex align-items-center gap-2 small text-amber-500">
                <AlertCircle size={14} className="shrink-0" />
                <span>Nếu key được chọn hết token/lượt dùng, hãy chuyển sang key khác trong menu trên.</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Key Manager/Editor View
        <form onSubmit={handleSaveList} className="d-flex flex-column gap-3">
          <div className="d-flex flex-column gap-2" style={{ maxHh: '300px', overflowY: 'auto' }}>
            {tempKeys.length === 0 ? (
              <div className="text-center py-3 text-slate-500 italic small">
                Danh sách trống. Vui lòng bấm thêm key mới bên dưới.
              </div>
            ) : (
              tempKeys.map((k, index) => (
                <div key={k.id} className="p-3 rounded bg-slate-950/40 border border-slate-900 d-flex flex-column gap-2 mb-2 animate-fade-in">
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <input
                      type="text"
                      value={k.name}
                      onChange={(e) => handleTempKeyChange(k.id, 'name', e.target.value)}
                      placeholder="Tên gợi nhớ (ví dụ: Key chính, Key dự phòng 1...)"
                      className="form-control form-control-sm font-semibold border-slate-800 bg-transparent text-slate-200"
                      style={{ fontSize: '13px', maxWidth: '240px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveKey(k.id)}
                      className="btn btn-outline-danger btn-sm p-1.5 rounded-circle border-0 hover:bg-rose-500/10 text-rose-400"
                      title="Xóa Key này"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  
                  <div className="position-relative">
                    <input
                      type={showKeyMap[k.id] ? 'text' : 'password'}
                      value={k.value}
                      onChange={(e) => handleTempKeyChange(k.id, 'value', e.target.value.trim())}
                      placeholder="Nhập Gemini API Key..."
                      className="form-control form-control-sm pe-5 py-2"
                      style={{ fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(k.id)}
                      className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent text-slate-500 hover:text-slate-300 pe-3"
                      style={{ outline: 'none' }}
                    >
                      {showKeyMap[k.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mt-2">
            <button
              type="button"
              onClick={handleAddKey}
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
            >
              <Plus size={14} /> Thêm Key mới
            </button>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={() => setShowManager(false)}
                className="btn btn-outline-secondary btn-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm d-flex align-items-center gap-2"
              >
                <Check size={14} /> Lưu danh sách
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
