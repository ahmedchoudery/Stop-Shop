/**
 * @fileoverview Auth utilities for API calls
 * Applies: javascript-pro (async/await, error boundaries), nodejs-best-practices (security),
 *          typescript-expert (JSDoc typed), javascript-mastery (nullish coalescing)
 */

import { apiUrl } from '../config/api.js';

const TOKEN_KEY = 'stopshop_admin_token';

// ─────────────────────────────────────────────────────────────────
// TOKEN MANAGEMENT
// ─────────────────────────────────────────────────────────────────

/**
 * Get the stored auth token.
 * Prefers httpOnly cookie (server validates), falls back to localStorage for dev.
 *
 * @returns {string|null}
 */
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * Store auth token in localStorage.
 * @param {string} token
 */
export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    console.warn('Could not persist auth token');
  }
};

/**
 * Clear all auth data and redirect to login.
 */
export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Silent: restricted environment
  }

  // Clear httpOnly cookies via expiry (best effort — server should also clear them)
  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
  document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
};

// ─────────────────────────────────────────────────────────────────
// AUTHENTICATED FETCH
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch with automatic auth token injection and credential inclusion.
 * Supports both cookie-based and Bearer token auth.
 *
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export const authFetch = async (url, options = {}) => {
  const token = getToken();

  const headers = new Headers(options.headers ?? {});

  // Set content-type if body is present and not already set
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Bearer token if available (dev/fallback)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always send cookies
  });

  return response;
};

// ─────────────────────────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────────────────────────

/**
 * Handle auth errors from API responses.
 * Redirects to login on 401/403 with cleanup.
 *
 * @param {number} status - HTTP status code
 * @returns {boolean} true if auth error was detected (and redirect initiated)
 */
export const handleAuthError = (status) => {
  if (status === 401 || status === 403) {
    clearToken();
    // Use replace to prevent back-button to protected page
    window.location.replace('/login');
    return true;
  }
  return false;
};

// ─────────────────────────────────────────────────────────────────
// AUTH STATE CHECK (lightweight)
// ─────────────────────────────────────────────────────────────────

/**
 * Check if user appears to be authenticated (client-side only check).
 * Real auth validation happens on the server.
 *
 * @returns {boolean}
 */
export const isLoggedIn = () => {
  return !!getToken();
};

// ─────────────────────────────────────────────────────────────────
// ADMIN LOGIN
// ─────────────────────────────────────────────────────────────────

/**
 * Perform admin login.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ name: string, success: boolean, token: string }>}
 * @throws {Error} with user-friendly message
 */
export const adminLogin = async (email, password) => {
  const res = await fetch(apiUrl('/api/admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    // Map status codes to user-friendly messages
    const messages = {
      401: data.error ?? 'Invalid email or password.',
      423: data.error ?? 'Account is temporarily locked.',
      429: 'Too many attempts. Please wait 15 minutes.',
    };
    throw new Error(messages[res.status] ?? data.error ?? 'Login failed. Please try again.');
  }

  // Persist token for Bearer fallback
  if (data.token) setToken(data.token);

  return data;
};