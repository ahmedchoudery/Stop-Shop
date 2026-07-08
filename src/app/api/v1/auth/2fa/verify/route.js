import { withRoute, ApiError } from '@/lib/api/withRoute';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import RefreshToken from '@/models/RefreshToken';
import { JWT_SECRET } from '@/lib/adminAuth';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const POST = withRoute({
  requiredRole: 'public',
  schema: {
    body: z.object({
      code: z.string().min(1),
      tempToken: z.string().optional(),
    })
  },
  handler: async ({ body, user: authUser }) => {
    const { code, tempToken } = body;
    let userId = null;

    if (tempToken) {
      // 1. Verify credentials challenge flow
      try {
        const decoded = jwt.verify(tempToken, JWT_SECRET);
        if (decoded.step !== '2fa_verify') {
          throw new ApiError('UNAUTHENTICATED', 'Invalid temporary token', 401);
        }
        userId = decoded.userId;
      } catch {
        throw new ApiError('UNAUTHENTICATED', 'Expired or invalid temporary token', 401);
      }
    } else {
      // 2. Require authenticated admin context
      if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'staff')) {
        throw new ApiError('UNAUTHENTICATED', 'Authentication required', 401);
      }
      userId = authUser.id;
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError('NOT_FOUND', 'User not found', 404);
    }

    // Verify Email OTP code
    if (!user.emailOtpCode || !user.emailOtpExpiresAt) {
      throw new ApiError('UNAUTHENTICATED', 'No verification code found. Please request a new code.', 401);
    }

    if (new Date() > user.emailOtpExpiresAt) {
      throw new ApiError('UNAUTHENTICATED', 'Verification code has expired. Please request a new code.', 401);
    }

    if (user.emailOtpCode !== code.trim()) {
      throw new ApiError('UNAUTHENTICATED', 'Invalid verification code', 401);
    }

    // Clear code on successful verification
    user.emailOtpCode = null;
    user.emailOtpExpiresAt = null;
    user.twoFactorEnabled = true;

    user.failedLoginCount = 0;
    user.lockedUntil = null;
    await user.save();

    // If login flow challenge, issue cookies and token
    if (tempToken) {
      const role = authUser?.role || 'admin'; // fallback, or we can check user roles dynamically

      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, role },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const csrfToken = jwt.sign(
        { type: 'csrf', userId: user._id.toString() },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const newRefreshPlain = crypto.randomUUID();
      const newRefreshHash = crypto.createHash('sha256').update(newRefreshPlain).digest('hex');
      const familyId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await RefreshToken.create({
        userId: user._id,
        tokenHash: newRefreshHash,
        familyId,
        expiresAt
      });

      const response = NextResponse.json({
        success: true,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        role,
        token
      });

      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      };

      response.cookies.set('auth_token', token, { ...cookieOptions, maxAge: 15 * 60 });
      response.cookies.set('refresh_token', newRefreshPlain, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 });
      response.cookies.set('csrf_token', csrfToken, { ...cookieOptions, httpOnly: false, maxAge: 15 * 60 });

      return response;
    }

    return { success: true, message: '2FA verified successfully' };
  }
});
