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
    // JWT issued by /auth/login or /auth/register; the server reads the caller's
    // identity from it (M1 trust layer), including on delivery routes.
    const token = localStorage.getItem('token');
    if (token) {
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
    // A 401 means the token is missing, expired or invalid: log out.
    // (Login itself also 401s on a wrong password, so don't redirect from /login.)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
