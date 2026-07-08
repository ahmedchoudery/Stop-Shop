import { withRoute, ApiError } from '@/lib/api/withRoute';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import RefreshToken from '@/models/RefreshToken';
import User from '@/models/User';
import { JWT_SECRET, hasRole } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';

export const POST = withRoute({
  requiredRole: 'public',
  handler: async ({ req }) => {
    const tokenCookie = req.cookies.get('refresh_token')?.value;

    if (!tokenCookie) {
      throw new ApiError('UNAUTHENTICATED', 'Refresh token required', 401);
    }

    const hashed = crypto.createHash('sha256').update(tokenCookie).digest('hex');
    const tokenRecord = await RefreshToken.findOne({ tokenHash: hashed });

    if (!tokenRecord) {
      throw new ApiError('UNAUTHENTICATED', 'Invalid refresh token', 401);
    }

    const clearOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    };

    // Reuse Detection: If the token is already revoked or rotated, invalidate the whole family
    if (tokenRecord.revokedAt || tokenRecord.rotatedTo) {
      console.warn(`[Auth Security] Reuse detected for refresh token! Revoking entire family: ${tokenRecord.familyId}`);
      await RefreshToken.updateMany(
        { familyId: tokenRecord.familyId },
        { revokedAt: new Date() }
      );

      const response = NextResponse.json(
        {
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Refresh token reused. Session revoked.',
            requestId: req.headers.get('x-request-id') || '',
          }
        },
        { status: 401 }
      );
      response.cookies.set('auth_token', '', clearOptions);
      response.cookies.set('refresh_token', '', clearOptions);
      response.cookies.set('csrf_token', '', { ...clearOptions, httpOnly: false });
      return response;
    }

    // Expired check
    if (tokenRecord.expiresAt < new Date()) {
      throw new ApiError('UNAUTHENTICATED', 'Refresh token expired', 401);
    }

    // Fetch user and check role
    const user = await User.findById(tokenRecord.userId);
    if (!user || (user.lockedUntil && user.lockedUntil > new Date())) {
      throw new ApiError('UNAUTHENTICATED', 'User is locked or suspended', 401);
    }

    const isAdmin = await hasRole(user._id, 'admin');
    const isStaff = await hasRole(user._id, 'staff');
    const role = isAdmin ? 'admin' : (isStaff ? 'staff' : 'customer');

    // Generate new rotated refresh token
    const newRefreshPlain = crypto.randomUUID();
    const newRefreshHash = crypto.createHash('sha256').update(newRefreshPlain).digest('hex');
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Rolling 30 days

    // Mark current token as rotated
    tokenRecord.rotatedTo = newRefreshHash;
    tokenRecord.revokedAt = new Date();
    await tokenRecord.save();

    // Create the next token in the family
    await RefreshToken.create({
      userId: user._id,
      tokenHash: newRefreshHash,
      familyId: tokenRecord.familyId,
      expiresAt: newExpiresAt
    });

    // Issue new access tokens
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
});
