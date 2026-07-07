import { NextResponse } from 'next/server';
import { toDataURL } from 'qrcode';
import argon2 from 'argon2';
import dbConnect from '../../../../../lib/db';
import User from '../../../../../models/User';
import { requireAdmin } from '../../../../../lib/adminAuth';
import { generateSecret, getOtpAuthUri, generateBackupCodes } from '../../../../../lib/totp';

export async function POST(req) {
  try {
    await dbConnect();
    const admin = await requireAdmin(req);

    const user = await User.findById(admin.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate new TOTP secret
    const secret = generateSecret();
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = false; // Confirming enables it

    // Generate 10 backup codes
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code =>
        argon2.hash(code, {
          type: argon2.argon2id,
          memoryCost: 19456,
          timeCost: 2,
          parallelism: 1
        })
      )
    );
    user.backupCodes = hashedBackupCodes;
    await user.save();

    // Generate QR code Data URL
    const otpAuthUri = getOtpAuthUri(user.email, secret);
    const qrCodeDataUrl = await toDataURL(otpAuthUri);

    return NextResponse.json({
      secret,
      qrCode: qrCodeDataUrl,
      backupCodes // Return plain text codes once so user can download/save them
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
