import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '../../../../lib/db';
import RefreshToken from '../../../../models/RefreshToken';

export async function POST(req) {
  try {
    await dbConnect();
    const tokenCookie = req.cookies.get('refresh_token')?.value;

    if (tokenCookie) {
      const hashed = crypto.createHash('sha256').update(tokenCookie).digest('hex');
      // Revoke in the database
      await RefreshToken.findOneAndUpdate(
        { tokenHash: hashed },
        { revokedAt: new Date() }
      );
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear cookies
    const clearOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    };

    response.cookies.set('auth_token', '', clearOptions);
    response.cookies.set('refresh_token', '', clearOptions);
    response.cookies.set('csrf_token', '', { ...clearOptions, httpOnly: false });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
