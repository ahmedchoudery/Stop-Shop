import DOMPurify from 'isomorphic-dompurify';

const sanitizeObject = (obj) => {
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
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
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

export const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateOrderID = (orderID) => {
  const orderIDRegex = /^ORD-[A-Z0-9]{9}$/;
  return orderIDRegex.test(orderID);
};

export const validateProductID = (productID) => {
  const productIDRegex = /^PRD-[A-Z0-9]{9}$/;
  return productIDRegex.test(productID);
};

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
      return res.status(429).json({ 
        error: 'Too many requests from this IP. Please try again later.' 
      });
    }

    record.count++;
    next();
  };
};

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitByIP.entries()) {
    if (now > record.resetTime) {
      rateLimitByIP.delete(ip);
    }
  }
}, 60000);
