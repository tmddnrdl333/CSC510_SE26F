import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // Only add Authorization header for non-delivery routes
    // Delivery routes don't use token-based auth
    if (token && !config.url?.includes('/delivery/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // TEMPORARY (M1): friends/teams/challenges sit behind the x-test-user-id
    // auth stub (server/middleware/authStub.js) until the JWT middleware from
    // M1 merges. Remove this block together with the stub.
    if (/\/(friends|teams|challenges)(\/|$)/.test(config.url || '')) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (storedUser?.id) config.headers['x-test-user-id'] = storedUser.id;
      } catch { /* ignore malformed localStorage */ }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect to login for delivery route errors
      // as they use different authentication
      if (!error.config?.url?.includes('/delivery/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect to login if we're not already on the login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
