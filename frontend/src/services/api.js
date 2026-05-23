import axios from 'axios';

// Check if there is an API base URL defined in environment variables, fallback to local FastAPI server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to dynamically inject the Gemini API Key from localStorage
api.interceptors.request.use(
  (config) => {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (apiKey) {
      config.headers['X-Gemini-API-Key'] = apiKey;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
