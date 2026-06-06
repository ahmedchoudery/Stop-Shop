import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  const cookieOptions = {
    path: '/',
    maxAge: 0,
  };
  
  response.cookies.set('auth_token', '', cookieOptions);
  response.cookies.set('csrf_token', '', cookieOptions);
  
  return response;
}
