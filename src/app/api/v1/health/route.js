import { withRoute } from '@/lib/api/withRoute';
import mongoose from 'mongoose';
import { cacheService } from '@/services/cacheService';
import { NextResponse } from 'next/server';

export const GET = withRoute({
  requiredRole: 'public',
  handler: async () => {
    let mongoStatus = 'disconnected';
    let ok = false;

    try {
      const readyState = mongoose.connection.readyState;
      if (readyState === 1) {
        // Perform actual admin ping
        await mongoose.connection.db.admin().ping();
        mongoStatus = 'connected';
        ok = true;
      } else {
        mongoStatus = `ready_state_${readyState}`;
      }
    } catch (err) {
      mongoStatus = `error: ${err.message}`;
    }

    const cacheStatus = await cacheService.getStatus();

    const responseBody = {
      ok,
      mongo: mongoStatus,
      cache: cacheStatus,
      uptime: process.uptime(),
      buildSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.BUILD_SHA || 'development',
    };

    return NextResponse.json(responseBody, {
      status: ok ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
});
