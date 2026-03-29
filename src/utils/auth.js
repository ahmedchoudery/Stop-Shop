const API_FETCH_OPTIONS = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
};

export const fetchApi = async (url, options = {}) => {
  return fetch(url, {
    ...API_FETCH_OPTIONS,
    ...options
  });
};

export const isAuthenticated = async () => {
  try {
    const response = await fetchApi('/api/health');
    return response.ok;
  } catch {
    return false;
  }
};

export default API_FETCH_OPTIONS;
