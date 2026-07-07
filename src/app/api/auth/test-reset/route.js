import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import User from '../../../../models/User';

export async function POST(req) {
  try {
    const isTest = process.env.NODE_ENV === 'test' || process.env.CI === 'true';
    if (!isTest) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    await User.findOneAndUpdate(
      { email: 'ahmedchoudery30@gmail.com' },
      {
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
        backupCodes: [],
        failedLoginCount: 0,
        lockedUntil: null
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
