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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// TEMPORARY (issue #32, remove in #33): attaches the caller id for the
// server's temporary auth stub (server/middleware/authStub.js) until M1's
// real JWT-verified auth lands. api.ts is a plain module, not a component,
// so it can't call the useAuth() hook directly -- it reads the same
// localStorage['user'] entry AuthContext itself hydrates from on load
// (see client/src/contexts/AuthContext.tsx's restoreAuth), which is
// effectively "from useAuth()" without a hook call.
api.interceptors.request.use(
  (config) => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const { id } = JSON.parse(storedUser);
        if (id) {
          config.headers['x-test-user-id'] = id;
        }
      }
    } catch {
      // Malformed/missing localStorage state -- just skip the header.
    }
    return config;
  },
  (error) => Promise.reject(error)
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
