/**
 * @fileoverview API URL resolver
 * Applies: javascript-pro (ES6+, module pattern), javascript-mastery (const, nullish coalescing)
 *          nodejs-best-practices (environment config, no hardcoded secrets)
 */

// ─────────────────────────────────────────────────────────────────
// ENVIRONMENT DETECTION
// ─────────────────────────────────────────────────────────────────

const isBrowser = typeof window !== 'undefined';
const getEnv = (key) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  return undefined;
};

const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') || 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) || 
  false;

const isTest = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') || 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'test') || 
  false;

/**
 * Detect if currently running on localhost
 * @returns {boolean}
 */
const detectLocalhost = () => {
  if (!isBrowser) return true;
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
};

const isLocalhost = detectLocalhost();

// ─────────────────────────────────────────────────────────────────
// URL RESOLUTION
// ─────────────────────────────────────────────────────────────────

/**
 * Normalize and validate the environment API URL.
 *
 * @param {string} raw - Raw env var value
 * @returns {string} Cleaned URL or empty string
 */
const resolveEnvApiUrl = (raw) => {
  if (!raw?.trim()) return '';

  let url = raw.trim().replace(/\/+$/, ''); // Strip trailing slashes

  // Fix missing protocol
  if (!url.startsWith('http') && url.includes('.')) {
    url = `https://${url}`;
  }

  // Guard: Don't use frontend host as API host
  if (isBrowser && url.includes(window.location.host)) {
    if (isDev) console.warn('[API] VITE_API_URL points to frontend host — ignoring');
    return '';
  }

  return url;
};

const envBase = resolveEnvApiUrl(getEnv('NEXT_PUBLIC_API_URL') || getEnv('VITE_API_URL') || '');

/**
 * Final API base URL.
 * - Same Domain: empty (Vercel/Cloud handles /api → backend)
 * - Different Domain: use envBase
 */
export const API_BASE = (isLocalhost || isTest)
  ? ''
  : (envBase || ''); // Default to relative for Vercel unified deployment

// ─────────────────────────────────────────────────────────────────
// DIAGNOSTICS (dev only)
// ─────────────────────────────────────────────────────────────────

if (isDev && isBrowser) {
  console.group('[API] Configuration');
  console.log('Mode:', typeof process !== 'undefined' ? process.env.NODE_ENV : (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.MODE : ''));
  console.log('VITE_API_URL:', getEnv('VITE_API_URL') || getEnv('NEXT_PUBLIC_API_URL'));
  console.log('Resolved API_BASE:', API_BASE || '(empty — using Vite proxy)');
  console.groupEnd();
}

// ─────────────────────────────────────────────────────────────────
// URL BUILDER
// ─────────────────────────────────────────────────────────────────

/**
 * Build a full API URL from a path.
 *
 * @param {string} path - Must start with '/'
 * @returns {string} Full URL in production, relative path in dev
 * @throws {TypeError} If path doesn't start with '/'
 */
export const apiUrl = (path) => {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new TypeError(`apiUrl() expects a path starting with '/'. Got: ${path}`);
  }
  return `${API_BASE}${path}`;
};

export default API_BASE;
