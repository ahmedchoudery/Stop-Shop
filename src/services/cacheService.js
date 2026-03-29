import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10);

let redis = null;
let isConnected = false;

if (REDIS_URL) {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  redis.on('connect', () => {
    isConnected = true;
    console.log('✅ Connected to Redis');
  });

  redis.on('error', (err) => {
    isConnected = false;
    console.error('❌ Redis connection error:', err.message);
  });

  redis.on('close', () => {
    isConnected = false;
    console.log('⚠️ Redis connection closed');
  });

  redis.connect().catch((err) => {
    console.error('❌ Redis initial connection failed:', err.message);
  });
} else {
  console.log('⚠️ REDIS_URL not configured - using in-memory fallback');
}

const inMemoryCache = new Map();

export const cacheService = {
  isAvailable: () => isConnected && redis !== null,

  async get(key) {
    if (redis && isConnected) {
      try {
        const data = await redis.get(key);
        if (data) {
          return JSON.parse(data);
        }
      } catch (err) {
        console.error('Redis get error:', err.message);
      }
      return null;
    }
    
    const cached = inMemoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL * 1000) {
      return cached.data;
    }
    inMemoryCache.delete(key);
    return null;
  },

  async set(key, data, ttl = CACHE_TTL) {
    if (redis && isConnected) {
      try {
        await redis.setex(key, ttl, JSON.stringify(data));
        return true;
      } catch (err) {
        console.error('Redis set error:', err.message);
      }
      return false;
    }
    
    inMemoryCache.set(key, { data, timestamp: Date.now() });
    return true;
  },

  async del(key) {
    if (redis && isConnected) {
      try {
        await redis.del(key);
      } catch (err) {
        console.error('Redis del error:', err.message);
      }
    }
    inMemoryCache.delete(key);
  },

  async delPattern(pattern) {
    if (redis && isConnected) {
      try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (err) {
        console.error('Redis delPattern error:', err.message);
      }
    }
    
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of inMemoryCache.keys()) {
      if (regex.test(key)) {
        inMemoryCache.delete(key);
      }
    }
  },

  async clear() {
    if (redis && isConnected) {
      try {
        await redis.flushdb();
      } catch (err) {
        console.error('Redis clear error:', err.message);
      }
    }
    inMemoryCache.clear();
  },

  async close() {
    if (redis) {
      await redis.quit();
      redis = null;
      isConnected = false;
    }
  },

  getInMemoryStats() {
    return {
      type: redis && isConnected ? 'redis' : 'memory',
      keys: redis && isConnected ? null : inMemoryCache.size,
    };
  },
};

export const CACHE_KEYS = {
  STATS_REVENUE: 'stats:revenue',
  STATS_ORDERS: 'stats:orders',
  STATS_INVENTORY: 'stats:inventory',
  PRODUCTS: 'products:all',
  PUBLIC_PRODUCTS: 'products:public',
  SETTINGS: 'settings:current',
};

export default cacheService;
