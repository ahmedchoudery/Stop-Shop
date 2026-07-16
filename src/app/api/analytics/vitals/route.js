import { NextResponse } from 'next/server';
// @ts-ignore
import logger from '../../../../utils/logger.js';

export async function POST(req) {
  try {
    const body = await req.json();
    logger.info({ webVitals: body }, `[Web Vitals] Received ${body.name} metric: ${body.value}`);
    return new Response(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
