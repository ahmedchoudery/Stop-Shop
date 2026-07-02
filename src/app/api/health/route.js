import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '../../../lib/db';
import { cacheService } from '../../../services/cacheService';

export async function GET(req) {
  const healthStatus = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    services: {
      database: 'disconnected',
      cache: 'disconnected',
    },
  };

  let hasError = false;

  // 1. Verify MongoDB connection
  try {
    await dbConnect();
    const readyState = mongoose.connection.readyState;
    // Mongoose ready states: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (readyState === 1) {
      healthStatus.services.database = 'connected';
    } else {
      hasError = true;
      healthStatus.status = 'DEGRADED';
      healthStatus.services.database = `ready_state_${readyState}`;
    }
  } catch (err) {
    hasError = true;
    healthStatus.status = 'DOWN';
    healthStatus.services.database = `error: ${err.message}`;
  }

  // 2. Verify Caching connection (Redis or memory fallback)
  try {
    const testKey = 'sys:healthcheck';
    await cacheService.set(testKey, 'ok', 10);
    const testValue = await cacheService.get(testKey);
    
    if (testValue === 'ok') {
      const isRedis = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
      healthStatus.services.cache = isRedis ? 'connected (Redis)' : 'connected (Memory Fallback)';
    } else {
      hasError = true;
      healthStatus.status = 'DEGRADED';
      healthStatus.services.cache = 'stale_write';
    }
  } catch (err) {
    hasError = true;
    healthStatus.status = 'DEGRADED';
    healthStatus.services.cache = `error: ${err.message}`;
  }

  return NextResponse.json(healthStatus, {
    status: hasError && healthStatus.status === 'DOWN' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
