import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import User from '../../../../models/User';
import UserRole from '../../../../models/UserRole';
import argon2 from 'argon2';

export async function POST(req) {
  try {
    const isTest = process.env.NODE_ENV === 'test' || process.env.CI === 'true';
    if (!isTest) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Find or create E2E admin user
    let user = await User.findOne({ email: 'ahmedchoudery30@gmail.com' });
    if (!user) {
      const passwordHash = await argon2.hash('vxSk9mUi0/NX6IvZ!Aa1', {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1
      });
      user = await User.create({
        email: 'ahmedchoudery30@gmail.com',
        passwordHash,
        name: 'E2E Test Admin',
        createdAt: new Date()
      });
    }

    // Ensure role is admin
    const roleExists = await UserRole.findOne({ userId: user._id, role: 'admin' });
    if (!roleExists) {
      await UserRole.create({
        userId: user._id,
        role: 'admin',
        assignedBy: 'system'
      });
    }

    // Reset 2FA and login attempts
    await User.findByIdAndUpdate(user._id, {
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      backupCodes: [],
      failedLoginCount: 0,
      lockedUntil: null
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
