import { NextResponse } from 'next/server';
import IdempotencyKey from '../models/IdempotencyKey.js';
import logger from './logger.js';
import { dbConnect } from '../lib/db.js';

/**
 * Higher-order Route Handler wrapper enforcing idempotency using MongoDB.
 * Resolves duplicate state-changing requests by returning cached results.
 *
 * @param {function(any, any): any} handler - Next.js Route Handler function
 * @returns {function(any, any): any} Wrapped handler
 */
export function withIdempotency(handler) {
  return async (req, context) => {
    // Read key from header (standard case-insensitive match)
    const rawKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key');
    if (!rawKey) {
      return handler(req, context);
    }

    const key = rawKey.trim();
    if (!key) {
      return handler(req, context);
    }

    await dbConnect();

    const maxWaitTimeMs = 10000; // max wait for concurrent requests
    const intervalMs = 100;
    const startTime = Date.now();

    // 1. Try to fetch existing idempotency record
    let record = await IdempotencyKey.findOne({ key });

    if (record) {
      if (record.status === 'completed') {
        logger.info(`♻️ [Idempotency] Duplicate request detected (completed). Returning stored response for key: ${key}`);
        return new NextResponse(
          JSON.stringify(record.response.body),
          {
            status: record.response.status,
            headers: {
              'Content-Type': 'application/json',
              'X-Cache-Idempotency': 'true',
              ...record.response.headers,
            },
          }
        );
      }

      // If it's pending, another concurrent request is processing. We poll/wait.
      logger.info(`⏳ [Idempotency] Concurrent request in progress for key: ${key}. Waiting...`);
      while (Date.now() - startTime < maxWaitTimeMs) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        record = await IdempotencyKey.findOne({ key });
        if (record && record.status === 'completed') {
          logger.info(`♻️ [Idempotency] Concurrent request finished. Returning stored response for key: ${key}`);
          return new NextResponse(
            JSON.stringify(record.response.body),
            {
              status: record.response.status,
              headers: {
                'Content-Type': 'application/json',
                'X-Cache-Idempotency': 'true',
                ...record.response.headers,
              },
            }
          );
        }
      }
      logger.error(`❌ [Idempotency] Wait timeout exceeded for concurrent request with key: ${key}`);
      return NextResponse.json({ error: 'Concurrent request timeout. Please retry.' }, { status: 409 });
    }

    // 2. No record exists, attempt to acquire lock atomically
    try {
      record = await IdempotencyKey.create({
        key,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiration
      });
    } catch (err) {
      if (err.code === 11000) {
        // Lock acquisition failed due to duplicate key (race condition won by another request)
        logger.info(`⏳ [Idempotency] Race condition detected. Concurrent request won. Waiting...`);
        while (Date.now() - startTime < maxWaitTimeMs) {
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
          record = await IdempotencyKey.findOne({ key });
          if (record && record.status === 'completed') {
            return new NextResponse(
              JSON.stringify(record.response.body),
              {
                status: record.response.status,
                headers: {
                  'Content-Type': 'application/json',
                  'X-Cache-Idempotency': 'true',
                  ...record.response.headers,
                },
              }
            );
          }
        }
        return NextResponse.json({ error: 'Concurrent request timeout. Please retry.' }, { status: 409 });
      }
      throw err;
    }

    // 3. Process handler and cache response if successful
    try {
      const response = await handler(req, context);

      // Only cache complete requests (status codes < 500)
      if (response && response.status < 500) {
        let responseBody = {};
        try {
          const clonedRes = response.clone();
          responseBody = await clonedRes.json();
        } catch (e) {
          // Response body was not JSON or empty
        }

        // Extract response headers to persist
        const persistedHeaders = {};
        response.headers.forEach((value, name) => {
          if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(name.toLowerCase())) {
            persistedHeaders[name] = value;
          }
        });

        await IdempotencyKey.updateOne(
          { key },
          {
            status: 'completed',
            response: {
              status: response.status,
              body: responseBody,
              headers: persistedHeaders,
            },
          }
        );
      } else {
        // Delete pending record on 500 or bad responses so it can be retried
        await IdempotencyKey.deleteOne({ key });
      }

      return response;
    } catch (error) {
      logger.error(`❌ [Idempotency] Handler execution failed for key "${key}": ${error.message}`);
      // Remove lock on failure so the request can be retried
      await IdempotencyKey.deleteOne({ key });
      throw error;
    }
  };
}

export default withIdempotency;
