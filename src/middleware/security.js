// Strip HTML tags and dangerous characters without any external dependency
const sanitizeString = (str) => {
  return str
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/javascript:/gi, '')       // strip js: protocol
    .replace(/on\w+\s*=/gi, '')         // strip event handlers
    .trim();
};

const sanitizeObject = (obj) => {
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
};

export const sanitizeInput = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      const sanitizedBody = sanitizeObject(req.body);
      // Try to reassign, if it fails (non-writable), try to clear and assign
      try { req.body = sanitizedBody; } catch (e) {
        for (const key in req.body) delete req.body[key];
        Object.assign(req.body, sanitizedBody);
      }
    }
    if (req.query && typeof req.query === 'object') {
      const sanitizedQuery = sanitizeObject(req.query);
      try { req.query = sanitizedQuery; } catch (e) {
        // If req.query is a getter/non-writable, we might not be able to delete/assign
        // In Express 5, req.query is often a getter that returns an object.
        // We can try to modify that object's properties if it's not frozen.
        const q = req.query;
        for (const key in q) {
          if (typeof q[key] === 'string') q[key] = sanitizeString(q[key]);
        }
      }
    }
    if (req.params && typeof req.params === 'object') {
      const sanitizedParams = sanitizeObject(req.params);
      try { req.params = sanitizedParams; } catch (e) {
        for (const key in req.params) {
          if (typeof req.params[key] === 'string') req.params[key] = sanitizeString(req.params[key]);
        }
      }
    }
  } catch (err) {
    console.error('Sanitization Error:', err);
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
