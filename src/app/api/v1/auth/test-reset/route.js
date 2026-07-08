import { withRoute, ApiError } from '@/lib/api/withRoute';
import mongoose from 'mongoose';
import User from '@/models/User';
import UserRole from '@/models/UserRole';
import argon2 from 'argon2';

/**
 * POST /api/v1/auth/test-reset
 *
 * Seeds/resets the E2E test admin user. Only callable when the request
 * carries the correct x-e2e-secret header (set via E2E_SECRET env var)
 * OR when CI=true (GitHub Actions built-in).
 *
 * This route is intentionally NOT removed in production builds — it is
 * protected by the secret check and is a no-op in the absence of the header.
 */
export const POST = withRoute({
  requiredRole: 'public',
  handler: async ({ req }) => {
    // Guard: require either CI env var or a matching E2E secret header
    const ciMode = process.env.CI === 'true';
    const e2eSecret = process.env.E2E_SECRET;
    const headerSecret = req.headers.get('x-e2e-secret');

    const isAuthorised =
      ciMode ||
      (e2eSecret && headerSecret && headerSecret === e2eSecret);

    console.info('[TestReset] Endpoint hit.', {
      ciMode,
      hasE2ESecret: !!e2eSecret,
      headerMatch: headerSecret === e2eSecret,
      isAuthorised,
    });

    if (!isAuthorised) {
      console.warn('[TestReset] Forbidden access attempted.');
      throw new ApiError('FORBIDDEN', 'Forbidden', 403);
    }

    console.info('[TestReset] Connected to database:', mongoose.connection?.name || 'unknown');

    const email = 'e2e-admin@stop-shop-test.com';
    const passwordHash = await argon2.hash('vxSk9mUi0/NX6IvZ!Aa1', {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    });

    console.info('[TestReset] Hashed password. Upserting user:', email);

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

    console.info('[TestReset] User after upsert:', {
      _id: user?._id,
      email: user?.email,
      twoFactorEnabled: user?.twoFactorEnabled,
      hasPasswordHash: !!user?.passwordHash
    });

    const roleExists = await UserRole.findOne({ userId: user._id, role: 'admin' });
    if (!roleExists) {
      await UserRole.create({ userId: user._id, role: 'admin', assignedBy: 'system' });
      console.info('[TestReset] Created admin role.');
    } else {
      console.info('[TestReset] Admin role already exists.');
    }

    return { success: true };
  }
});
