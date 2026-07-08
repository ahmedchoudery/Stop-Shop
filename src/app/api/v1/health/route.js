import { withRoute } from '@/lib/api/withRoute';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

export const GET = withRoute({
  requiredRole: 'public',
  handler: async () => {
    let mongoStatus = 'disconnected';
    let ok = false;

    try {
      const readyState = mongoose.connection.readyState;
      if (readyState === 1) {
        mongoStatus = 'connected';
        ok = true;
      } else {
        mongoStatus = `ready_state_${readyState}`;
      }
    } catch (err) {
      mongoStatus = `error: ${err.message}`;
    }

    const responseBody = {
      ok,
      mongo: mongoStatus,
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
