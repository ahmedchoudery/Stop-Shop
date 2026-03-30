/**
 * @fileoverview Supabase Integration Service
 * Applies: nodejs-best-practices (service layer, repository pattern),
 *          javascript-pro (async/await, error handling),
 *          typescript-expert (JSDoc typed throughout)
 *
 * HOW TO USE:
 * 1. Install: npm install @supabase/supabase-js
 * 2. Add to .env:
 *    SUPABASE_URL=https://tvvatsvudsxsyejlgvhl.supabase.co
 *    SUPABASE_ANON_KEY=your_anon_key
 *    SUPABASE_SERVICE_KEY=your_service_role_key (server-only)
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

// ─────────────────────────────────────────────────────────────────
// STORAGE SERVICE (Product Images)
// ─────────────────────────────────────────────────────────────────

const BUCKET_NAME = 'product-images';

/**
 * Upload a product image to Supabase Storage.
 * Replaces the base64 data URL approach — uses proper CDN storage.
 *
 * @param {File|Blob} file - Image file to upload
 * @param {string} productId - Used as filename prefix
 * @param {'main'|'lifestyle'|'gallery'} [type='main']
 * @returns {Promise<{ url: string|null, error: string|null }>}
 */
export const uploadProductImage = async (file, productId, type = 'main') => {
  if (!supabaseAdmin) {
    return { url: null, error: 'Supabase not configured' };
  }

  try {
    const ext = file.name?.split('.').pop() ?? 'jpg';
    const path = `products/${productId}/${type}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type ?? 'image/jpeg',
      });

    if (uploadError) throw uploadError;

    const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(path);

    return { url: data.publicUrl, error: null };

  } catch (err) {
    console.error('[Supabase Storage] Upload failed:', err.message);
    return { url: null, error: err.message };
  }
};

/**
 * Delete a product image from storage.
 *
 * @param {string} path - Storage path (not full URL)
 * @returns {Promise<boolean>}
 */
export const deleteProductImage = async (path) => {
  if (!supabaseAdmin) return false;

  try {
    const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).remove([path]);
    return !error;
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────
// ANALYTICS SERVICE (Page Views, Events)
// ─────────────────────────────────────────────────────────────────

/**
 * Track a storefront event in Supabase analytics table.
 *
 * @param {Object} params
 * @param {'page_view'|'product_view'|'add_to_cart'|'checkout_start'|'order_complete'} params.event
 * @param {string} [params.productId]
 * @param {string} [params.orderId]
 * @param {Record<string, unknown>} [params.metadata]
 * @returns {Promise<void>}
 */
export const trackEvent = async ({ event, productId, orderId, metadata = {} }) => {
  if (!supabase) return;

  try {
    await supabase.from('analytics_events').insert({
      event_type: event,
      product_id: productId ?? null,
      order_id: orderId ?? null,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Never let analytics break the app
    console.warn('[Supabase Analytics] Track failed:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────
// REALTIME SUBSCRIPTIONS (Admin Dashboard Live Updates)
// ─────────────────────────────────────────────────────────────────

/**
 * Subscribe to new orders in real-time.
 * Use in admin dashboard for live order notifications.
 *
 * @param {function(Object): void} onNewOrder - Callback for each new order
 * @returns {function(): void} Unsubscribe function
 *
 * @example
 * const unsubscribe = subscribeToOrders((order) => {
 *   showNotification(`New order: ${order.orderID}`);
 * });
 * // Call unsubscribe() on component unmount
 */
export const subscribeToOrders = (onNewOrder) => {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('orders-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      (payload) => onNewOrder(payload.new)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to inventory changes in real-time.
 * Alert admins when stock drops below threshold.
 *
 * @param {number} [threshold=5] - Low stock threshold
 * @param {function(Object): void} onLowStock
 * @returns {function(): void} Unsubscribe function
 */
export const subscribeToInventory = (onLowStock, threshold = 5) => {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('inventory-realtime')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'products' },
      (payload) => {
        const product = payload.new;
        if ((product.quantity ?? 0) < threshold) {
          onLowStock(product);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// ─────────────────────────────────────────────────────────────────
// NEWSLETTER / EMAIL CAPTURE
// ─────────────────────────────────────────────────────────────────

/**
 * Subscribe an email to the newsletter list.
 *
 * @param {string} email
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
export const subscribeNewsletter = async (email) => {
  if (!supabase) return { success: false, error: 'Service unavailable' };

  try {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        { email: email.toLowerCase().trim(), subscribed_at: new Date().toISOString() },
        { onConflict: 'email' }
      );

    if (error) throw error;

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ─────────────────────────────────────────────────────────────────
// PRODUCT REVIEWS (Supabase table)
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch reviews for a product.
 *
 * @param {string} productId
 * @returns {Promise<Array>}
 */
export const getProductReviews = async (productId) => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
};

/**
 * Submit a product review.
 *
 * @param {Object} review
 * @param {string} review.productId
 * @param {string} review.customerName
 * @param {string} review.customerEmail
 * @param {number} review.rating - 1 to 5
 * @param {string} review.title
 * @param {string} review.body
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
export const submitProductReview = async ({ productId, customerName, customerEmail, rating, title, body }) => {
  if (!supabase) return { success: false, error: 'Service unavailable' };

  try {
    const { error } = await supabase.from('product_reviews').insert({
      product_id: productId,
      customer_name: customerName,
      customer_email: customerEmail,
      rating: Math.min(5, Math.max(1, rating)),
      title,
      body,
      status: 'pending', // Requires admin approval
    });

    if (error) throw error;

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};