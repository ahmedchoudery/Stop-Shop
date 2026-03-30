/**
 * @fileoverview Redis cache service
 * Applies: nodejs-best-practices (repository layer pattern, graceful degradation),
 *          javascript-pro (async/await, error handling at boundaries),
 *          javascript-mastery (optional chaining, nullish coalescing)
 */

import Redis from 'ioredis';

// ─────────────────────────────────────────────────────────────────
// CACHE KEYS (immutable constants)
// ─────────────────────────────────────────────────────────────────

/** @readonly */
export const CACHE_KEYS = Object.freeze({
  STATS_REVENUE: 'stats:revenue',
  STATS_ORDERS: 'stats:orders',
  STATS_INVENTORY: 'stats:inventory',
  PRODUCTS: 'admin:products',
  PUBLIC_PRODUCTS: 'public:products',
  SETTINGS: 'public:settings',
});

// ─────────────────────────────────────────────────────────────────
// TTL CONFIG (seconds)
// ─────────────────────────────────────────────────────────────────

const TTL = Object.freeze({
  [CACHE_KEYS.STATS_REVENUE]: 60,       // 1 minute
  [CACHE_KEYS.STATS_ORDERS]: 60,        // 1 minute
  [CACHE_KEYS.STATS_INVENTORY]: 120,    // 2 minutes
  [CACHE_KEYS.PRODUCTS]: 300,           // 5 minutes
  [CACHE_KEYS.PUBLIC_PRODUCTS]: 300,    // 5 minutes
  [CACHE_KEYS.SETTINGS]: 600,           // 10 minutes
  DEFAULT: 120,
});

// ─────────────────────────────────────────────────────────────────
// CLIENT INITIALIZATION
// ─────────────────────────────────────────────────────────────────

let client = null;

/**
 * Initialize Redis client lazily with reconnect strategy.
 * Fails gracefully — app continues without cache if Redis unavailable.
 *
 * @returns {Redis|null}
 */
const getClient = () => {
  if (client) return client;

  const redisUrl = process.env.REDIS_URL ?? process.env.REDIS_TLS_URL;
  if (!redisUrl) {
    console.warn('[Cache] REDIS_URL not set — running without cache');
    return null;
  }

  try {
    client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 5) {
          console.error('[Cache] Redis retry limit reached — disabling cache');
          client = null;
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000); // Exponential backoff up to 2s
      },
      enableOfflineQueue: false, // Don't queue commands when disconnected
    });

    client.on('error', (err) => {
      console.error('[Cache] Redis error:', err.message);
    });

    client.on('connect', () => {
      console.log('[Cache] Redis connected');
    });

    return client;
  } catch (err) {
    console.error('[Cache] Failed to initialize Redis:', err.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────
// CACHE SERVICE API
// ─────────────────────────────────────────────────────────────────

/**
 * Get a cached value by key.
 * Returns null (not throws) on miss or error — app falls through to DB.
 *
 * @param {string} key
 * @returns {Promise<any|null>}
 */
const get = async (key) => {
  const redis = getClient();
  if (!redis) return null;

  try {
    const raw = await redis.get(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[Cache] GET error for key "${key}":`, err.message);
    return null; // Degrade gracefully
  }
};

/**
 * Set a value in cache with automatic TTL.
 *
 * @param {string} key
 * @param {any} value - Serializable value
 * @param {number} [ttl] - Override TTL in seconds
 * @returns {Promise<boolean>} true if stored, false on error
 */
const set = async (key, value, ttl) => {
  const redis = getClient();
  if (!redis) return false;

  const exSeconds = ttl ?? TTL[key] ?? TTL.DEFAULT;

  try {
    const serialized = JSON.stringify(value);
    await redis.setex(key, exSeconds, serialized);
    return true;
  } catch (err) {
    console.error(`[Cache] SET error for key "${key}":`, err.message);
    return false;
  }
};

/**
 * Delete a key from cache.
 *
 * @param {string} key
 * @returns {Promise<boolean>}
 */
const del = async (key) => {
  const redis = getClient();
  if (!redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (err) {
    console.error(`[Cache] DEL error for key "${key}":`, err.message);
    return false;
  }
};

/**
 * Invalidate multiple cache keys atomically.
 *
 * @param {string[]} keys
 * @returns {Promise<void>}
 */
const invalidateMany = async (keys) => {
  await Promise.allSettled(keys.map(del));
};

/**
 * Cache-aside pattern: get from cache or execute loader.
 *
 * @template T
 * @param {string} key
 * @param {function(): Promise<T>} loader
 * @param {number} [ttl]
 * @returns {Promise<T>}
 */
const getOrSet = async (key, loader, ttl) => {
  const cached = await get(key);
  if (cached !== null) return cached;

  const fresh = await loader();
  await set(key, fresh, ttl);
  return fresh;
};

/**
 * Graceful shutdown — close Redis connection cleanly.
 *
 * @returns {Promise<void>}
 */
const close = async () => {
  if (client) {
    try {
      await client.quit();
      client = null;
      console.log('[Cache] Redis connection closed');
    } catch (err) {
      console.error('[Cache] Error closing Redis:', err.message);
      client?.disconnect();
      client = null;
    }
  }
};

export const cacheService = { get, set, del, invalidateMany, getOrSet, close };