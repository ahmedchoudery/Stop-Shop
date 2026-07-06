import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  const cookieOptions = {
    path: '/',
    maxAge: 0,
    secure: true,
    sameSite: 'lax',
  };
  
  response.cookies.set('auth_token', '', { ...cookieOptions, httpOnly: true });
  response.cookies.set('csrf_token', '', { ...cookieOptions, httpOnly: false });
  
  return response;
}
