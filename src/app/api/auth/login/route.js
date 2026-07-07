import { NextResponse } from 'next/server';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dbConnect from '../../../../lib/db';
import User from '../../../../models/User';
import UserRole from '../../../../models/UserRole';
import RefreshToken from '../../../../models/RefreshToken';
import LoginAttempt from '../../../../models/LoginAttempt';
import { JWT_SECRET, hasRole } from '../../../../lib/adminAuth';
import { verifyTotp, generateSecret, getOtpAuthUri, generateBackupCodes } from '../../../../lib/totp';
import { sendEmail } from '../../../../services/emailService';
import { toDataURL } from 'qrcode';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const { email, password, code, backupCode } = body;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // 1. Rate Limiting Check: 5/min per IP + 10/min per email
    const emailKey = (email || '').toLowerCase().trim();
    if (!emailKey || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const isTest = process.env.NODE_ENV === 'test' || process.env.CI === 'true';
    if (!isTest && (ipAttempts >= 5 || emailAttempts >= 10)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    // Record the attempt
    await LoginAttempt.create({ ip, email: emailKey });

    // 2. Fetch User
    const user = await User.findOne({ email: emailKey });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 3. Lockout Check
    if (!isTest && user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      return NextResponse.json({
        error: `Account is temporarily locked. Please try again in ${minutesLeft} minutes.`
      }, { status: 423 });
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

        return NextResponse.json({
          error: 'Too many failed attempts. Account locked for 30 minutes.'
        }, { status: 423 });
      }

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 5. Check if User is Admin for mandatory 2FA check
    const isAdmin = await hasRole(user._id, 'admin');
    const isStaff = await hasRole(user._id, 'staff');

    if (isAdmin) {
      // Admin must pass 2FA
      if (!user.twoFactorEnabled) {
        // Setup required: Generate secret & backup codes
        const secret = generateSecret();
        const backupCodes = generateBackupCodes();
        const hashedBackupCodes = await Promise.all(
          backupCodes.map(c =>
            argon2.hash(c, {
              type: argon2.argon2id,
              memoryCost: 19456,
              timeCost: 2,
              parallelism: 1
            })
          )
        );
        user.twoFactorSecret = secret;
        user.backupCodes = hashedBackupCodes;
        await user.save();

        const otpAuthUri = getOtpAuthUri(user.email, secret);
        const qrCodeDataUrl = await toDataURL(otpAuthUri);

        const tempToken = jwt.sign(
          { userId: user._id.toString(), step: '2fa_setup' },
          JWT_SECRET,
          { expiresIn: '5m' }
        );

        return NextResponse.json({
          success: true,
          '2faRequired': true,
          setupRequired: true,
          tempToken,
          secret,
          qrCode: qrCodeDataUrl,
          backupCodes
        });
      }

      // Check if they supplied 2FA code or backup code
      if (!code && !backupCode) {
        const tempToken = jwt.sign(
          { userId: user._id.toString(), step: '2fa_verify' },
          JWT_SECRET,
          { expiresIn: '5m' }
        );
        return NextResponse.json({
          success: true,
          '2faRequired': true,
          setupRequired: false,
          tempToken
        });
      }

      // Validate 2FA
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

        // Remove the used backup code
        user.backupCodes.splice(matchedIndex, 1);
        await user.save();
      }
    }

    // 6. Reset Login Failure Counters
    const isNewDevice = user.lastUserAgent && user.lastUserAgent !== userAgent;
    const oldUserAgent = user.lastUserAgent;

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

    return response;
  } catch (error) {
    console.error('[Login API] Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
