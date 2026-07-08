import { withRoute, ApiError } from '@/lib/api/withRoute';
import mongoose from 'mongoose';
import User from '@/models/User';
import UserRole from '@/models/UserRole';
import argon2 from 'argon2';

export const POST = withRoute({
  requiredRole: 'public',
  handler: async () => {
    const isTest = process.env.NODE_ENV === 'test' || process.env.CI === 'true';
    console.log('[TestReset] Endpoint hit. isTest status:', isTest, 'NODE_ENV:', process.env.NODE_ENV, 'CI:', process.env.CI);
    if (!isTest) {
      console.warn('[TestReset] Forbidden access attempted.');
      throw new ApiError('FORBIDDEN', 'Forbidden', 403);
    }

    console.log('[TestReset] Connected to database:', mongoose.connection?.name || 'unknown');

    const email = 'e2e-admin@stop-shop-test.com';
    const passwordHash = await argon2.hash('vxSk9mUi0/NX6IvZ!Aa1', {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    });

    console.log('[TestReset] Hashed password successfully. Saving to DB for:', email);

    // Find, create, or update E2E admin user in a single atomic operation
    const user = await User.findOneAndUpdate(
      { email },
      {
        email,
        passwordHash,
        name: 'E2E Test Admin',
        twoFactorEnabled: false,
        emailOtpCode: null,
        emailOtpExpiresAt: null,
        failedLoginCount: 0,
        lockedUntil: null
      },
      { upsert: true, new: true }
    );

    console.log('[TestReset] User document after update/upsert:', {
      _id: user?._id,
      email: user?.email,
      twoFactorEnabled: user?.twoFactorEnabled,
      hasPasswordHash: !!user?.passwordHash
    });

    // Ensure role is admin
    const roleExists = await UserRole.findOne({ userId: user._id, role: 'admin' });
    if (!roleExists) {
      await UserRole.create({
        userId: user._id,
        role: 'admin',
        assignedBy: 'system'
      });
      console.log('[TestReset] Created admin role for user.');
    } else {
      console.log('[TestReset] Admin role already exists.');
    }

    return { success: true };
  }
});
