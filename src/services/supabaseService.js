/**
 * @fileoverview Supabase Integration Service
 * Applies: nodejs-best-practices (service layer, repository pattern),
 *          javascript-pro (async/await, error handling),
 *          typescript-expert (JSDoc typed throughout)
 *
 * NOTE: Supabase functions are defined here but not currently in use.
 * To implement: add tables to Supabase PostgreSQL, enable RLS policies,
 * and integrate function calls into relevant components.
 */

import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────
// CLIENT INITIALIZATION
// ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY — Supabase features disabled');
}

/**
 * Public (anon) client — for browser-safe operations.
 * Subject to Row Level Security (RLS) policies.
 */
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * Service role client — server-side only, bypasses RLS.
 * NEVER expose this key to the browser.
 */
export const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    })
  : null;