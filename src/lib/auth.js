/**
 * auth.js — Centralized admin authentication utility
 * Uses localStorage + Bearer token instead of cookies to work across
 * cross-origin deployments (Vercel frontend ↔ Railway backend).
 */

const TOKEN_KEY = 'admin_token';

export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const isAuthenticated = () => !!getToken();

/**
 * Returns fetch options with the Authorization header pre-set.
 * Pass extra options to merge (e.g. method, body, headers).
 */
export const authFetch = (url, options = {}) => {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers });
};

/**
 * Redirects to /login and clears the token if a 401/403 is received.
 */
export const handleAuthError = (status) => {
  if (status === 401 || status === 403) {
    clearToken();
    window.location.href = '/login';
    return true;
  }
  return false;
};
