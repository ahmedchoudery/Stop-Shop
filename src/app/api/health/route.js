import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '../../../lib/db';

export async function GET(req) {
  let mongoStatus = 'disconnected';
  let ok = false;

  try {
    await dbConnect();
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
