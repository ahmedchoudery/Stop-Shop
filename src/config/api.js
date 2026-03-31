/**
 * @fileoverview API URL resolver
 * Applies: javascript-pro (ES6+, module pattern), javascript-mastery (const, nullish coalescing)
 *          nodejs-best-practices (environment config, no hardcoded secrets)
 */

// ─────────────────────────────────────────────────────────────────
// ENVIRONMENT DETECTION
// ─────────────────────────────────────────────────────────────────

const isBrowser = typeof window !== 'undefined';
const isDev = import.meta.env.DEV ?? false;
const isTest = import.meta.env.MODE === 'test';

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

const PROD_API = 'https://stop-shop-production.up.railway.app';

/**
 * Normalize and validate the environment API URL.
 * Handles stale deployment URLs gracefully.
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

  // Fix stale Railway deployment suffix
  if (url.includes('stop-shop-production-3860')) {
    if (isDev) console.warn('[API] Stale -3860 Railway URL detected — auto-correcting');
    url = url.replace('stop-shop-production-3860', 'stop-shop-production');
  }

  return url;
};

const envBase = resolveEnvApiUrl(import.meta.env.VITE_API_URL ?? '');

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
  console.log('Mode:', import.meta.env.MODE);
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
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
