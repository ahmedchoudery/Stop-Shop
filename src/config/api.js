const rawBaseUrl = import.meta.env.VITE_API_URL || '';

// If VITE_API_URL is not provided, use relative paths.
// This works with Railway (same origin) and with Vite proxy in development.
const API_BASE = rawBaseUrl.trim().replace(/\/+$/, '');

export const apiUrl = (path) => {
  if (!path.startsWith('/')) {
    throw new Error('apiUrl(path) expects a leading slash');
  }
  return API_BASE ? `${API_BASE}${path}` : path;
};

export default API_BASE;
