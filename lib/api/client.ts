import axios from 'axios';

// Use /backend prefix which will be proxied to the backend via Next.js rewrites
// This avoids CORS issues since requests go through the same origin
const api = axios.create({
  baseURL: '/backend',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if this is an auth endpoint (login/register)
      const isAuthEndpoint = error.config?.url?.startsWith('/auth/');

      if (!isAuthEndpoint && typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
