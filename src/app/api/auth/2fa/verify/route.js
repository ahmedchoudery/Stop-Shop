import { NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import dbConnect from '../../../../../lib/db';
import User from '../../../../../models/User';
import RefreshToken from '../../../../../models/RefreshToken';
import { JWT_SECRET, requireAdmin, hasRole } from '../../../../../lib/adminAuth';
import { verifyTotp } from '../../../../../lib/totp';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const { code, backupCode, tempToken } = body;

    let userId = null;
    let isSetupVerification = false;

    if (tempToken) {
      // 1. Verify credentials challenge flow
      try {
        const decoded = jwt.verify(tempToken, JWT_SECRET);
        if (decoded.step !== '2fa_verify' && decoded.step !== '2fa_setup') {
          return NextResponse.json({ error: 'Invalid temporary token' }, { status: 401 });
        }
        userId = decoded.userId;
        isSetupVerification = decoded.step === '2fa_setup';
      } catch (err) {
        return NextResponse.json({ error: 'Expired or invalid temporary token' }, { status: 401 });
      }
    } else {
      // 2. Enabling 2FA flow (user is already logged in)
      const admin = await requireAdmin(req);
      userId = admin.id;
      isSetupVerification = true;
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!code && !backupCode) {
      return NextResponse.json({ error: 'Code or backup code is required' }, { status: 400 });
    }

    // Verify code
    if (code) {
      const valid = verifyTotp(code, user.twoFactorSecret);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
      }
    } else if (backupCode) {
      // Verify backup code
      let matchedIndex = -1;
      for (let i = 0; i < user.backupCodes.length; i++) {
        const verifyResult = await argon2.verify(user.backupCodes[i], backupCode.trim());
        if (verifyResult) {
          matchedIndex = i;
          break;
        }
      }

      if (matchedIndex === -1) {
        return NextResponse.json({ error: 'Invalid backup code' }, { status: 401 });
      }

      // Remove single-use backup code
      user.backupCodes.splice(matchedIndex, 1);
    }

    // Mark 2FA enabled on user
    if (isSetupVerification) {
      user.twoFactorEnabled = true;
    }

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
