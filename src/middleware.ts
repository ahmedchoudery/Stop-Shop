import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Rate Limit Settings ───────────────────────────────────────────
const WINDOW_MS = 60000;
const LIMIT = 20;

// Simple memory-based fallback for local dev when Redis is not configured
const localRateLimitMap = new Map<string, number[]>();

async function checkRateLimit(ip: string): Promise<boolean> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const key = `ratelimit:${ip}`;
      const res = await fetch(`${upstashUrl}/eval`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${upstashToken}` },
        body: JSON.stringify({
          script: `
            local current = redis.call('get', KEYS[1])
            if current and tonumber(current) >= tonumber(ARGV[1]) then
              return 0
            else
              redis.call('incr', KEYS[1])
              if not current then
                redis.call('expire', KEYS[1], ARGV[2])
              end
              return 1
            end
          `,
          keys: [key],
          args: [LIMIT.toString(), Math.ceil(WINDOW_MS / 1000).toString()],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.result === 'number') {
          return data.result === 1;
        }
      }
      console.warn('[RateLimit] Upstash returned non-ok response, falling back to local memory limit');
    } catch {
      console.warn('[RateLimit] Upstash call failed, falling back to local memory limit');
    }
  }

  // Fallback to local memory limiter
  const now = Date.now();
  const timestamps = localRateLimitMap.get(ip) || [];
  const activeTimestamps = timestamps.filter(t => now - t < WINDOW_MS);
  
  if (activeTimestamps.length >= LIMIT) return false;
  
  activeTimestamps.push(now);
  localRateLimitMap.set(ip, activeTimestamps);
  return true;
}

// ── CSRF Check Helper ─────────────────────────────────────────────
function verifyCsrf(request: NextRequest): boolean {
  const method = request.method;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;

  // Authorization Bearer token header authentication is inherently immune to CSRF
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return true;

  const csrfCookie = request.cookies.get('csrf_token')?.value;
  const csrfHeader = request.headers.get('x-csrf-token');

  if (!csrfCookie || !csrfHeader) return false;
  return csrfCookie === csrfHeader;
}

// ── Middleware ────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  // 1. Rate Limiting on critical endpoints
  const RATE_LIMITED_PATHS = [
    '/api/checkout', '/api/v1/checkout',
    '/api/customer/login', '/api/v1/customer/login',
    '/api/customer/register', '/api/v1/customer/register'
  ];
  if (RATE_LIMITED_PATHS.some(path => pathname.startsWith(path))) {
    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'x-request-id': requestId } }
      );
    }
  }

  // 2. CSRF Verification for state-changing protected API routes
  const CSRF_PROTECTED_PATHS = [
    '/api/admin/', '/api/v1/admin/',
    '/api/pos/', '/api/v1/pos/',
    '/api/customer/profile', '/api/v1/customer/profile'
  ];
  const CSRF_BYPASS_PATHS = [
    '/api/admin/login', '/api/v1/admin/login',
    '/api/auth/login', '/api/v1/auth/login'
  ];

  if (
    CSRF_PROTECTED_PATHS.some(path => pathname.startsWith(path)) &&
    !CSRF_BYPASS_PATHS.some(path => pathname.startsWith(path))
  ) {
    if (!verifyCsrf(request)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid or missing CSRF token' }),
        { status: 403, headers: { 'Content-Type': 'application/json', 'x-request-id': requestId } }
      );
    }
  }

  // Clone headers and inject x-request-id for downstream Next.js Route Handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // Generate dynamic, cryptographically secure nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  requestHeaders.set('x-nonce', nonce);

  // 3. Strict CORS lock on all /api/* (except webhooks)
  let corsHeaders: Record<string, string> = {};
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/webhooks')) {
    const origin = request.headers.get('origin');
    const ownOrigin = request.nextUrl.origin;

    if (origin && origin !== ownOrigin) {
      return new NextResponse(
        JSON.stringify({ error: 'CORS policy violation: Access denied.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', 'x-request-id': requestId } }
      );
    }

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': ownOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token, x-request-id',
          'Access-Control-Allow-Credentials': 'true',
          'x-request-id': requestId,
        },
      });
    }

    corsHeaders = {
      'Access-Control-Allow-Origin': ownOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token, x-request-id',
      'Access-Control-Allow-Credentials': 'true',
    };
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const scriptSrc = isProduction
    ? `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://connect.facebook.net`
    : `script-src 'self' 'unsafe-eval' 'nonce-${nonce}' https://www.googletagmanager.com https://connect.facebook.net`;

  const styleSrc = `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`;

  const cspHeader = [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    "img-src 'self' data: https://res.cloudinary.com https://www.google-analytics.com https://www.facebook.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.resend.com https://open.er-api.com https://www.google-analytics.com https://www.google.com https://analytics.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  requestHeaders.set('Content-Security-Policy', cspHeader);

  const isDeprecated = pathname.startsWith('/api/') && !pathname.startsWith('/api/v1/');
  const targetPath = isDeprecated ? pathname.replace('/api/', '/api/v1/') : pathname;

  if (isDeprecated) {
    requestHeaders.set('x-deprecated-api', 'true');
  }

  const response = isDeprecated
    ? NextResponse.rewrite(new URL(targetPath, request.url), {
        request: {
          headers: requestHeaders,
        },
      })
    : NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

  // 4. Robust Security Headers & request tracing ID
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-nonce', nonce);
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');
  response.headers.set('Content-Security-Policy', cspHeader);

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (isDeprecated) {
    response.headers.set('Deprecation', 'true');
    response.headers.set('Warning', '299 - "Deprecated API Version"');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
};
