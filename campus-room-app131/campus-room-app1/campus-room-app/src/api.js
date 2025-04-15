import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add JWT token to requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 Unauthorized and not already retrying
    if (error.response.status === 401 && !originalRequest._retry) {
      // Here you could handle token refresh if implemented
      // For now, just logout the user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
    login: (email, password, rememberMe) => {
      console.log('Login request:', { email, password, rememberMe });
      return instance.post('/auth/login', { email, password, rememberMe });
    },
  
  register: (userData) => {
    console.log('Register request:', userData);
    return instance.post('/auth/register', userData);
  },
  
  forgotPassword: (email) => {
    return instance.post('/auth/forgot-password', { email });
  },
  
  resetPassword: (token, password, confirmPassword) => {
    return instance.post('/auth/reset-password', { token, password, confirmPassword });
  },
};

export default instance;