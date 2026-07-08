import { withRoute } from '@/lib/api/withRoute';
import crypto from 'crypto';
import RefreshToken from '@/models/RefreshToken';
import { NextResponse } from 'next/server';

export const POST = withRoute({
  requiredRole: 'public',
  handler: async ({ req }) => {
    const tokenCookie = req.cookies.get('refresh_token')?.value;

    if (tokenCookie) {
      const hashed = crypto.createHash('sha256').update(tokenCookie).digest('hex');
      await RefreshToken.findOneAndUpdate(
        { tokenHash: hashed },
        { revokedAt: new Date() }
      );
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
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
  }
});
