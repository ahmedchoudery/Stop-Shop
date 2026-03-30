/**
 * @fileoverview Security middleware
 * Applies: nodejs-best-practices (trust nothing, validate everything),
 *          javascript-pro (functional patterns, ES6+), javascript-mastery (optional chaining)
 */

// ─────────────────────────────────────────────────────────────────
// INPUT SANITIZATION
// ─────────────────────────────────────────────────────────────────

/**
 * Recursively sanitize a value by escaping HTML entities
 * and removing null bytes. Preserves numbers/booleans.
 *
 * @param {unknown} value
 * @param {number} [depth=0] - Current recursion depth
 * @returns {unknown} Sanitized value
 */
const sanitizeValue = (value, depth = 0) => {
  // Prevent deep object traversal attacks
  if (depth > 10) return value;

  if (typeof value === 'string') {
    return value
      .replace(/\0/g, '')           // Remove null bytes
      .replace(/</g, '&lt;')        // Escape HTML tags
      .replace(/>/g, '&gt;')
      .replace(/javascript:/gi, '') // Block JS protocol
      .replace(/on\w+\s*=/gi, '');  // Block event handlers
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        sanitizeValue(k, depth + 1),
        sanitizeValue(v, depth + 1),
      ])
    );
  }

  return value;
};

/**
 * Express middleware: sanitize all request body fields.
 *
 * @type {import('express').RequestHandler}
 */
export const sanitizeInput = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
};

// ─────────────────────────────────────────────────────────────────
// REQUEST SIZE GUARD
// ─────────────────────────────────────────────────────────────────

/**
 * Reject requests with excessively large bodies (belt-and-suspenders,
 * in addition to express.json({ limit: '10kb' })).
 *
 * @param {number} [maxBytes=10240] - Default 10KB
 * @returns {import('express').RequestHandler}
 */
export const requestSizeGuard = (maxBytes = 10_240) => (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] ?? '0', 10);
  if (contentLength > maxBytes) {
    return res.status(413).json({
      status: 'fail',
      message: `Request body too large. Maximum allowed: ${maxBytes} bytes`,
    });
  }
  next();
};

// ─────────────────────────────────────────────────────────────────
// IP EXTRACTION (behind proxy)
// ─────────────────────────────────────────────────────────────────

/**
 * Get the real client IP from request, respecting proxy headers.
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
export const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? req.connection?.remoteAddress ?? 'unknown';
};

// ─────────────────────────────────────────────────────────────────
// NO-OP SECURITY LOGGER (attach to sensitive routes)
// ─────────────────────────────────────────────────────────────────

/**
 * Log sensitive route access for audit purposes.
 *
 * @param {string} action
 * @returns {import('express').RequestHandler}
 */
export const auditLog = (action) => (req, _res, next) => {
  console.log(`[Security] ${action} | IP: ${getClientIp(req)} | ${new Date().toISOString()}`);
  next();
};

// ─────────────────────────────────────────────────────────────────
// PREVENT PARAMETER POLLUTION
// ─────────────────────────────────────────────────────────────────

/**
 * Flatten arrays in query params to prevent HPP (HTTP Parameter Pollution).
 * e.g. ?status=Pending&status=Shipped → status='Pending' (first wins)
 *
 * @type {import('express').RequestHandler}
 */
export const flattenQueryParams = (req, _res, next) => {
  for (const key in req.query) {
    if (Array.isArray(req.query[key])) {
      req.query[key] = req.query[key][0];
    }
  }
  next();
};