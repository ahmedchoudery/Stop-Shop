const isBrowser = typeof window !== 'undefined';
const host = isBrowser ? window.location.hostname : '';
const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
const isProductionHost = isBrowser && !isLocalHost;

// The base URL from environment (Vercel/Local)
let envBase = (import.meta.env.VITE_API_URL || '').trim();

// If it's an external URL (contains dots and doesn't have protocol), add https://
if (envBase && !envBase.startsWith('http') && envBase.includes('.')) {
  envBase = `https://${envBase}`;
}

const envIsFrontendHost = isBrowser && envBase.includes(window.location.host);
const SAFE_PROD_API = 'https://stop-shop-production.up.railway.app';
const SECONDARY_SAFE_API = 'https://stop-shop-production.up.railway.app';

// Choose the actual API base to use
const rawBaseUrl = isProductionHost
  ? (envBase && !envIsFrontendHost ? envBase : SAFE_PROD_API)
  : envBase;

const API_BASE = (rawBaseUrl || '').trim().replace(/\/+$/, '');

if (isBrowser) {
  console.log('--- API DIAGNOSTICS ---');
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('isProductionHost:', isProductionHost);
  console.log('Resolved API_BASE:', API_BASE);
  console.log('-----------------------');
}

export const apiUrl = (path) => {
  if (!path.startsWith('/')) {
    throw new Error('apiUrl(path) expects a leading slash');
  }
  // Return absolute URL only if API_BASE is set and it's not pointing to the same host
  return API_BASE ? `${API_BASE}${path}` : path;
};

export default API_BASE;
