import { NextResponse } from 'next/server';
import { cacheService } from '../services/cacheService.js';
import logger from './logger.js';

// Local in-memory Map fallback for local developer setups when Redis is not available
const localIdempotencyMap = new Map();

/**
 * Higher-order Route Handler wrapper enforcing idempotency.
 * Resolves duplicate state-changing requests by returning cached results.
 *
 * @param {function(any, any): any} handler - Next.js Route Handler function
 * @returns {function(any, any): any} Wrapped handler
 */
export function withIdempotency(handler) {
  return async (req, context) => {
    // Read key from header
    const rawKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key');
    if (!rawKey) {
      return handler(req, context);
    }

    const key = rawKey.trim();
    const cacheKey = `idempotency:${key}`;

    // 1. Check Redis cache or memory fallback
    let cachedResult = null;
    try {
      cachedResult = await cacheService.get(cacheKey);
    } catch (e) {
      logger.error(`[Idempotency] Cache fetch failed for key "${key}": ${e.message}`);
    }

    if (!cachedResult) {
      cachedResult = localIdempotencyMap.get(cacheKey) || null;
    }

    // 2. Return cached response if present
    if (cachedResult) {
      logger.warn(`♻️ [Idempotency] Duplicate request detected. Returning cached response for key: ${key}`);
      return new NextResponse(
        JSON.stringify(cachedResult.body),
        {
          status: cachedResult.status,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache-Idempotency': 'true',
          },
        }
      );
    }

    // 3. Process handler and cache response if successful
    try {
      const response = await handler(req, context);

      // Only cache complete requests (status codes < 500)
      if (response.status < 500) {
        let responseBody = {};
        try {
          const clonedRes = response.clone();
          responseBody = await clonedRes.json();
        } catch (e) {
          // Response body was not JSON or empty
        }

        const cacheValue = {
          status: response.status,
          body: responseBody,
        };

        // Cache for 24 hours (86400 seconds)
        try {
          await cacheService.set(cacheKey, cacheValue, 86400);
        } catch (e) {
          logger.error(`[Idempotency] Cache set failed for key "${key}": ${e.message}`);
        }
        
        localIdempotencyMap.set(cacheKey, cacheValue);

        // Invalidate memory map key after 24 hours to prevent leaks
        setTimeout(() => {
          localIdempotencyMap.delete(cacheKey);
        }, 24 * 60 * 60 * 1000);
      }

      return response;
    } catch (error) {
      logger.error(`[Idempotency] Execution failed for key "${key}": ${error.message}`);
      throw error;
    }
  };
}

export default withIdempotency;
