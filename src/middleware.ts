import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting map for sliding window
const rateLimitMap = new Map<string, number[]>();

const WINDOW_MS = 60000; // 1 minute
const LIMIT = 20; // 20 requests per window

// Paths that require rate limiting
const RATE_LIMITED_PATHS = [
  '/api/checkout',
  '/api/admin/login',
  '/api/customer/login',
  '/api/customer/register',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Sliding Window Rate Limiting (Critical Endpoints)
  if (RATE_LIMITED_PATHS.some((path) => pathname.startsWith(path))) {
    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const now = Date.now();

    // Clean up expired entries randomly to prevent memory leaks (5% chance per request)
    if (Math.random() < 0.05) {
      for (const [key, timestamps] of rateLimitMap.entries()) {
        const activeTimestamps = timestamps.filter((t) => now - t < WINDOW_MS);
        if (activeTimestamps.length === 0) {
          rateLimitMap.delete(key);
        } else {
          rateLimitMap.set(key, activeTimestamps);
        }
      }
    }

    const timestamps = rateLimitMap.get(ip) || [];
    // Filter timestamps within the current window
    const activeTimestamps = timestamps.filter((t) => now - t < WINDOW_MS);

    if (activeTimestamps.length >= LIMIT) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests. Please try again after some time.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(WINDOW_MS / 1000).toString(),
          },
        }
      );
    }

    // Record the current request timestamp
    activeTimestamps.push(now);
    rateLimitMap.set(ip, activeTimestamps);
  }

  // 2. Security Headers
  const response = NextResponse.next();
  
  // HSTS (Strict-Transport-Security)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // X-Frame-Options to prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options to prevent MIME-sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https:",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

// Config to specify the matching paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
};
