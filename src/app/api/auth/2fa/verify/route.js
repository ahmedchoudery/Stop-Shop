import { NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../../lib/db';
import User from '../../../../../models/User';
import RefreshToken from '../../../../../models/RefreshToken';
import { JWT_SECRET, requireAdmin, hasRole } from '../../../../../lib/adminAuth';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const { code, tempToken } = body;

    let userId = null;

    if (tempToken) {
      // 1. Verify credentials challenge flow
      try {
        const decoded = jwt.verify(tempToken, JWT_SECRET);
        if (decoded.step !== '2fa_verify') {
          return NextResponse.json({ error: 'Invalid temporary token' }, { status: 401 });
        }
        userId = decoded.userId;
      } catch (err) {
        return NextResponse.json({ error: 'Expired or invalid temporary token' }, { status: 401 });
      }
    } else {
      // 2. Require authenticated admin context
      const admin = await requireAdmin(req);
      userId = admin.id;
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!code) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    // Verify Email OTP code
    if (!user.emailOtpCode || !user.emailOtpExpiresAt) {
      return NextResponse.json({ error: 'No verification code found. Please request a new code.' }, { status: 401 });
    }

    if (new Date() > user.emailOtpExpiresAt) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new code.' }, { status: 401 });
    }

    if (user.emailOtpCode !== code.trim()) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
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
      const isAdmin = await hasRole(user._id, 'admin');
      const isStaff = await hasRole(user._id, 'staff');
      const role = isAdmin ? 'admin' : (isStaff ? 'staff' : 'customer');

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

    return NextResponse.json({ success: true, message: '2FA verified successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
