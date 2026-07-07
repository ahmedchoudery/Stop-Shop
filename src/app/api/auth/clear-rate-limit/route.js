import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import LoginAttempt from '../../../../models/LoginAttempt';

export async function GET(_req) {
  try {
    await dbConnect();
    await LoginAttempt.deleteMany({});
    return NextResponse.json({ success: true, message: 'All login rate limits cleared successfully!' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
