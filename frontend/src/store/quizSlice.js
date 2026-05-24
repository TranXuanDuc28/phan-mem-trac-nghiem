import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Async Thunks
export const fetchSlides = createAsyncThunk('quiz/fetchSlides', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/api/slides');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Lỗi khi tải danh sách slide.');
  }
});

export const uploadSlide = createAsyncThunk('quiz/uploadSlide', async ({ file, creator }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('creator', creator || 'Ẩn danh');
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Lỗi khi tải lên file slide.');
  }
});

export const fetchQuizzes = createAsyncThunk('quiz/fetchQuizzes', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/api/quizzes');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Lỗi khi tải danh sách bài trắc nghiệm.');
  }
});

export const generateQuiz = createAsyncThunk(
  'quiz/generateQuiz',
  async ({ slideId, numQuestions, difficulty, creator, start_slide, end_slide }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/generate', {
        slide_id: slideId,
        num_questions: numQuestions,
        difficulty: difficulty,
        creator: creator || 'Ẩn danh',
        start_slide,
        end_slide
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Lỗi khi tạo đề trắc nghiệm bằng AI.');
    }
  }
);

export const fetchAttempts = createAsyncThunk('quiz/fetchAttempts', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/api/attempts');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Lỗi khi tải lịch sử làm bài.');
  }
});

export const saveAttempt = createAsyncThunk('quiz/saveAttempt', async (attemptData, { rejectWithValue }) => {
  try {
    const response = await api.post('/api/attempts', attemptData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Lỗi khi lưu kết quả làm bài.');
  }
});

export const importQuizDocx = createAsyncThunk('quiz/importQuizDocx', async ({ file, creator }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const apiKey = state.quiz?.apiKey || '';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('creator', creator || 'Ẩn danh');
    const response = await api.post('/api/upload-quiz', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Gemini-API-Key': apiKey,
      },
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Lỗi khi nhập file trắc nghiệm Word.');
  }
});

// Parse saved keys or migrate old single key
const getInitialKeys = () => {
  try {
    const savedKeys = JSON.parse(localStorage.getItem('gemini_api_keys') || '[]');
    if (savedKeys.length > 0) return savedKeys;
  } catch (e) {}
  
  const oldKey = localStorage.getItem('gemini_api_key') || '';
  if (oldKey) {
    const initial = [{ id: 'key_default', name: 'Mặc định (Default)', value: oldKey }];
    localStorage.setItem('gemini_api_keys', JSON.stringify(initial));
    localStorage.setItem('gemini_active_api_key_id', 'key_default');
    return initial;
  }
  return [];
};

const initialKeysList = getInitialKeys();
const activeKeyId = localStorage.getItem('gemini_active_api_key_id') || (initialKeysList.length > 0 ? initialKeysList[0].id : '');
const activeKeyVal = initialKeysList.find(k => k.id === activeKeyId)?.value || '';

const initialState = {
  apiKeys: initialKeysList,
  activeApiKeyId: activeKeyId,
  apiKey: activeKeyVal,
  slides: [],
  quizzes: [],
  attempts: [],
  currentQuiz: null,
  loading: false,
  generating: false,
  error: null,
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setApiKey: (state, action) => {
      state.apiKey = action.payload;
      localStorage.setItem('gemini_api_key', action.payload);
      
      // Auto-migrate or sync to list if not present
      if (action.payload && !state.apiKeys.some(k => k.value === action.payload)) {
        const newId = `key_${Date.now()}`;
        state.apiKeys.push({ id: newId, name: `API Key ${state.apiKeys.length + 1}`, value: action.payload });
        state.activeApiKeyId = newId;
        localStorage.setItem('gemini_api_keys', JSON.stringify(state.apiKeys));
        localStorage.setItem('gemini_active_api_key_id', newId);
      }
    },
    saveApiKeys: (state, action) => {
      state.apiKeys = action.payload;
      localStorage.setItem('gemini_api_keys', JSON.stringify(action.payload));
      
      const activeExists = state.apiKeys.some(k => k.id === state.activeApiKeyId);
      if (!activeExists) {
        state.activeApiKeyId = state.apiKeys.length > 0 ? state.apiKeys[0].id : '';
        localStorage.setItem('gemini_active_api_key_id', state.activeApiKeyId);
      }
      
      const activeKeyObj = state.apiKeys.find(k => k.id === state.activeApiKeyId);
      state.apiKey = activeKeyObj ? activeKeyObj.value : '';
      localStorage.setItem('gemini_api_key', state.apiKey);
    },
    setActiveApiKeyId: (state, action) => {
      state.activeApiKeyId = action.payload;
      localStorage.setItem('gemini_active_api_key_id', action.payload);
      
      const activeKeyObj = state.apiKeys.find(k => k.id === action.payload);
      state.apiKey = activeKeyObj ? activeKeyObj.value : '';
      localStorage.setItem('gemini_api_key', state.apiKey);
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentQuiz: (state, action) => {
      state.currentQuiz = action.payload;
    },
    clearCurrentQuiz: (state) => {
      state.currentQuiz = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Slides
      .addCase(fetchSlides.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSlides.fulfilled, (state, action) => {
        state.loading = false;
        state.slides = action.payload;
      })
      .addCase(fetchSlides.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload Slide
      .addCase(uploadSlide.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadSlide.fulfilled, (state, action) => {
        state.loading = false;
        state.slides.unshift(action.payload);
      })
      .addCase(uploadSlide.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Quizzes
      .addCase(fetchQuizzes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuizzes.fulfilled, (state, action) => {
        state.loading = false;
        state.quizzes = action.payload;
      })
      .addCase(fetchQuizzes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Generate Quiz
      .addCase(generateQuiz.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(generateQuiz.fulfilled, (state, action) => {
        state.generating = false;
        state.currentQuiz = action.payload;
        state.quizzes.unshift(action.payload);
      })
      .addCase(generateQuiz.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload;
      })
      // Fetch Attempts
      .addCase(fetchAttempts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttempts.fulfilled, (state, action) => {
        state.loading = false;
        state.attempts = action.payload;
      })
      .addCase(fetchAttempts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Save Attempt
      .addCase(saveAttempt.fulfilled, (state, action) => {
        state.attempts.unshift(action.payload);
      })
      // Import Quiz Docx
      .addCase(importQuizDocx.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importQuizDocx.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuiz = action.payload;
        state.quizzes.unshift(action.payload);
      })
      .addCase(importQuizDocx.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setApiKey, saveApiKeys, setActiveApiKeyId, clearError, setCurrentQuiz, clearCurrentQuiz } = quizSlice.actions;
export default quizSlice.reducer;
