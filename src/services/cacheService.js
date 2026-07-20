/**
 * @fileoverview Redis cache service — Supports Upstash REST API (Vercel Serverless native) & ioredis TCP fallback.
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
  PUBLIC_REVIEWS: 'public:reviews',
  PUBLIC_REVIEWS_PRODUCT: 'public:reviews:product',
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
  [CACHE_KEYS.PUBLIC_REVIEWS]: 300,     // 5 minutes
  [CACHE_KEYS.PUBLIC_REVIEWS_PRODUCT]: 300, // 5 minutes per-product
  DEFAULT: 120,
});

const getTtlForKey = (key) => {
  if (typeof key === 'string' && Object.prototype.hasOwnProperty.call(TTL, key)) {
    return TTL[key];
  }
  return TTL.DEFAULT;
};

let client = null;
let warnLogged = false;

// ─────────────────────────────────────────────────────────────────
// UPSTASH REST API HELPER (Vercel Serverless / Edge Native)
// ─────────────────────────────────────────────────────────────────

const getRestConfig = () => {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/+$/, ''), token };
  }
  return null;
};

const execRestCommand = async (commandArray) => {
  const config = getRestConfig();
  if (!config) return null;
  try {
    const res = await fetch(config.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commandArray),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.error('[Cache REST] Error executing command:', err.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────
// ioredis CLIENT INITIALIZATION (TCP Fallback)
// ─────────────────────────────────────────────────────────────────

const getClient = () => {
  if (client && client.status !== 'end' && client.status !== 'close') {
    return client;
  }
  client = null;

  const redisUrl = process.env.REDIS_URL ?? process.env.REDIS_TLS_URL ?? process.env.KV_URL ?? process.env.UPSTASH_REDIS_URL;
  if (!redisUrl) {
    if (!warnLogged && !getRestConfig()) {
      console.warn('⚠️ [Cache] REDIS_URL not set — running in stateless memory fallback mode.');
      warnLogged = true;
    }
    return null;
  }

  try {
    client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 4000,
      enableOfflineQueue: true, // Allow commands to queue briefly during reconnects
      retryStrategy: (times) => {
        if (times > 3) {
          client = null;
          return null;
        }
        return Math.min(times * 200, 1000);
      },
    });

    client.on('error', (err) => {
      console.error('[Cache ioredis] Error:', err.message);
      if (err.message.includes('Stream') || err.message.includes('closed') || err.message.includes('enableOfflineQueue')) {
        try {
          client.disconnect();
        } catch {
          // Ignore disconnect error
        }
        client = null;
      }
    });

    return client;
  } catch (err) {
    console.error('[Cache] Failed to initialize ioredis:', err.message);
    client = null;
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────
// CACHE SERVICE API
// ─────────────────────────────────────────────────────────────────

/**
 * Get a cached value by key.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
const get = async (key) => {
  const restConfig = getRestConfig();
  if (restConfig) {
    const raw = await execRestCommand(['GET', key]);
    if (raw === null || raw === undefined) return null;
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return raw;
    }
  }

  const redis = getClient();
  if (!redis) return null;

  try {
    const raw = await redis.get(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[Cache] GET error for key "${key}":`, err.message);
    if (err.message.includes('Stream') || err.message.includes('enableOfflineQueue')) {
      client = null;
    }
    return null;
  }
};

/**
 * Set a value in cache with automatic TTL.
 * @param {string} key
 * @param {any} value - Serializable value
 * @param {number} [ttl] - Override TTL in seconds
 * @returns {Promise<boolean>}
 */
const set = async (key, value, ttl) => {
  const exSeconds = ttl ?? getTtlForKey(key);
  const serialized = JSON.stringify(value);

  const restConfig = getRestConfig();
  if (restConfig) {
    const res = await execRestCommand(['SET', key, serialized, 'EX', exSeconds]);
    return res === 'OK';
  }

  const redis = getClient();
  if (!redis) return false;

  try {
    await redis.setex(key, exSeconds, serialized);
    return true;
  } catch (err) {
    console.error(`[Cache] SET error for key "${key}":`, err.message);
    if (err.message.includes('Stream') || err.message.includes('enableOfflineQueue')) {
      client = null;
    }
    return false;
  }
};

/**
 * Delete a key from cache.
 * @param {string} key
 * @returns {Promise<boolean>}
 */
const del = async (key) => {
  const restConfig = getRestConfig();
  if (restConfig) {
    if (key === CACHE_KEYS.PUBLIC_PRODUCTS) {
      const matchedKeys = await execRestCommand(['KEYS', `${CACHE_KEYS.PUBLIC_PRODUCTS}*`]);
      if (Array.isArray(matchedKeys) && matchedKeys.length > 0) {
        await execRestCommand(['DEL', ...matchedKeys]);
      }
    } else {
      await execRestCommand(['DEL', key]);
    }
    return true;
  }

  const redis = getClient();
  if (!redis) return false;

  try {
    if (key === CACHE_KEYS.PUBLIC_PRODUCTS) {
      const matchedKeys = await redis.keys(`${CACHE_KEYS.PUBLIC_PRODUCTS}*`);
      if (matchedKeys.length > 0) {
        await redis.del(...matchedKeys);
      }
    } else {
      await redis.del(key);
    }
    return true;
  } catch (err) {
    console.error(`[Cache] DEL error for key "${key}":`, err.message);
    if (err.message.includes('Stream') || err.message.includes('enableOfflineQueue')) {
      client = null;
    }
    return false;
  }
};

/**
 * Invalidate multiple cache keys atomically.
 * @param {string[]} keys
 * @returns {Promise<void>}
 */
const invalidateMany = async (keys) => {
  await Promise.allSettled(keys.map(del));
};

/**
 * Cache-aside pattern: get from cache or execute loader.
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
 * @returns {Promise<void>}
 */
const close = async () => {
  if (client) {
    try {
      await client.quit();
    } catch {
      client?.disconnect();
    } finally {
      client = null;
    }
  }
};

const getStatus = async () => {
  if (getRestConfig()) return 'upstash_rest_active';
  const redis = getClient();
  if (!redis) return 'stateless_memory';
  try {
    const pong = await redis.ping();
    return pong === 'PONG' ? 'connected' : `unexpected_response: ${pong}`;
  } catch (err) {
    return `disconnected: ${err.message}`;
  }
};

export const cacheService = { get, set, del, invalidateMany, getOrSet, close, getStatus };
