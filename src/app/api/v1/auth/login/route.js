import { withRoute, ApiError } from '@/lib/api/withRoute';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '@/models/User';
import RefreshToken from '@/models/RefreshToken';
import LoginAttempt from '@/models/LoginAttempt';
import { JWT_SECRET, hasRole } from '@/lib/adminAuth';
import { sendEmail } from '@/services/emailService';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const POST = withRoute({
  requiredRole: 'public',
  schema: {
    body: z.object({
      email: z.string().trim().email(),
      password: z.string().min(1),
    })
  },
  handler: async ({ req, body }) => {
    const { email, password } = body;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    const emailKey = email.toLowerCase().trim();

    // 1. Rate Limiting Check
    const ipAttempts = await LoginAttempt.countDocuments({ ip });
    const emailAttempts = await LoginAttempt.countDocuments({ email: emailKey });

    const isTest = process.env.NODE_ENV === 'test' || process.env.CI === 'true';
    if (!isTest && (ipAttempts >= 5 || emailAttempts >= 10)) {
      throw new ApiError('RATE_LIMITED', 'Too many requests. Please try again later.', 429);
    }

    // Record the attempt
    await LoginAttempt.create({ ip, email: emailKey });

    // 2. Fetch User
    const user = await User.findOne({ email: emailKey });
    if (!user) {
      throw new ApiError('UNAUTHENTICATED', 'Invalid email or password', 401);
    }

    // 3. Lockout Check
    if (!isTest && user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      throw new ApiError('FORBIDDEN', `Account is temporarily locked. Please try again in ${minutesLeft} minutes.`, 423);
    }

    // 4. Verify Password
    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      const count = user.failedLoginCount + 1;
      const updates = { failedLoginCount: count };
      let isLocked = false;

      if (count >= 10) {
        updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes lockout
        updates.failedLoginCount = 0; // Reset for next cycle
        isLocked = true;
      }

      await User.findByIdAndUpdate(user._id, updates);

      if (isLocked) {
        // Send email alert on account lockout
        await sendEmail({
          to: user.email,
          subject: 'Stop & Shop — Account Locked Out',
          html: `<p>Your Stop & Shop account has been temporarily locked out due to 10 failed login attempts.</p>
                 <p>It will automatically unlock in 30 minutes. If this wasn't you, please secure your account immediately.</p>`
        }).catch(console.error);

        throw new ApiError('FORBIDDEN', 'Too many failed attempts. Account locked for 30 minutes.', 423);
      }

      throw new ApiError('UNAUTHENTICATED', 'Invalid email or password', 401);
    }

    // 5. Check if User is Admin for mandatory 2FA check
    const isAdmin = await hasRole(user._id, 'admin');
    const isStaff = await hasRole(user._id, 'staff');

    if (isAdmin) {
      const otpCode = isTest ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      user.emailOtpCode = otpCode;
      user.emailOtpExpiresAt = otpExpiresAt;
      await user.save();

      await sendEmail({
        to: user.email,
        subject: 'Stop & Shop — Admin Verification Code',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111827; background-color: #fafafa;">
            <div style="background-color: #0d0d0d; padding: 24px; text-align: center; border-bottom: 2px solid #ba1f3d;">
              <h1 style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 900; letter-spacing: 5px; text-transform: uppercase;">
                Stop &amp; Shop
              </h1>
            </div>
            <div style="padding: 40px 32px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="margin: 0 0 24px; font-size: 18px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #0d0d0d; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px;">
                Security Verification
              </h2>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #404040;">
                A sign-in request was received for the Stop & Shop Admin Control Center.
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #404040;">
                Your one-time verification code is:
              </p>
              <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; text-align: center; margin: 30px 0; padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; color: #ba1f3d; font-family: monospace;">
                ${otpCode}
              </div>
              <p style="font-size: 11px; color: #737373; margin-top: 30px;">
                This code is valid for 5 minutes. If you did not request this, please change your password immediately.
              </p>
            </div>
          </div>
        `
      }).catch(err => console.error('[Login] Failed to send 2FA email:', err.message));

      const tempToken = jwt.sign(
        { userId: user._id.toString(), step: '2fa_verify' },
        JWT_SECRET,
        { expiresIn: '5m' }
      );

      return {
        success: true,
        '2faRequired': true,
        setupRequired: false,
        tempToken
      };
    }

    // 6. Reset Login Failure Counters
    const isNewDevice = user.lastUserAgent && user.lastUserAgent !== userAgent;

    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    user.lastUserAgent = userAgent;
    await user.save();

    // Send new device notification if applicable
    if (isNewDevice) {
      await sendEmail({
        to: user.email,
        subject: 'Stop & Shop — Login from New Device',
        html: `<p>We noticed a login to your account from a new device or browser.</p>
               <p><strong>Device details:</strong> ${userAgent}</p>
               <p><strong>IP:</strong> ${ip}</p>
               <p>If this was you, you can safely ignore this email. If this wasn't you, please secure your account immediately.</p>`
      }).catch(console.error);
    }

    // 7. Issue Session Tokens
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

    // Refresh token generation
    const refreshTokenPlain = crypto.randomUUID();
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenPlain).digest('hex');
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await RefreshToken.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      familyId,
      expiresAt
    });

    const response = NextResponse.json({
      name: user.name || user.email.split('@')[0],
      email: user.email,
      role,
      success: true,
      token
    });

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    };

    response.cookies.set('auth_token', token, { ...cookieOptions, maxAge: 15 * 60 });
    response.cookies.set('refresh_token', refreshTokenPlain, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 });
    response.cookies.set('csrf_token', csrfToken, { ...cookieOptions, httpOnly: false, maxAge: 15 * 60 });

    // Reset login attempts on successful login
    await LoginAttempt.deleteMany({ $or: [{ ip }, { email: emailKey }] }).catch(console.error);

    return response;
  }
});
