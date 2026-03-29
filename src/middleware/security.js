// Strip HTML tags and dangerous characters without any external dependency
const sanitizeString = (str) => {
  return str
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/javascript:/gi, '')       // strip js: protocol
    .replace(/on\w+\s*=/gi, '')         // strip event handlers
    .trim();
};

const sanitizeObject = (obj, depth = 0) => {
  if (depth > 10) return obj; // Prevent deep recursion crashes
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item, depth + 1));
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    }
    return sanitized;
  }
  return obj;
};

export const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize body if present and it's a writable object
    if (req.body && typeof req.body === 'object') {
      const sanitizedBody = sanitizeObject(req.body);
      try {
        // Only if it's a plain object can we reliably merge safely
        if (req.body.constructor === Object) {
          for (const key in req.body) delete req.body[key];
          Object.assign(req.body, sanitizedBody);
        } else {
          req.body = sanitizedBody;
        }
      } catch (e) {
        // Fallback for non-reassignable objects
        for (const key in sanitizedBody) {
          try { req.body[key] = sanitizedBody[key]; } catch (ie) { /* ignore non-writable property */ }
        }
      }
    }

    // Sanitize query parameters in-place where possible
    if (req.query && typeof req.query === 'object') {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          try { req.query[key] = sanitizeString(req.query[key]); } catch (e) { /* ignore non-writable property */ }
        }
      }
    }

    // Sanitize URL params in-place where possible
    if (req.params && typeof req.params === 'object') {
      for (const key in req.params) {
        if (typeof req.params[key] === 'string') {
          try { req.params[key] = sanitizeString(req.params[key]); } catch (e) { /* ignore non-writable property */ }
        }
      }
    }
  } catch (err) {
    console.error('Non-critical Sanitization Error:', err);
  }
  next();
};

export const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validateOrderID = (orderID) => /^ORD-[A-Z0-9]{9}$/.test(orderID);
export const validateProductID = (productID) => /^PRD-[A-Z0-9]{9}$/.test(productID);

export const rateLimitByIP = new Map();

export const ipRateLimiter = (maxRequests = 60, windowMs = 60000) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const record = rateLimitByIP.get(ip);
    if (!record) {
      rateLimitByIP.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    if (now > record.resetTime) {
      rateLimitByIP.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    if (record.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests from this IP. Please try again later.' });
    }
    record.count++;
    next();
  };
};

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitByIP.entries()) {
    if (now > record.resetTime) rateLimitByIP.delete(ip);
  }
}, 60000);
