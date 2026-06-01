import jwt from 'jsonwebtoken';

const getEnv = (...keys) => keys.map(k => process.env[k]).find(Boolean);
export const JWT_SECRET = getEnv('JWT_SECRET', 'jwt_secret');
export const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET || 'customer_secret_change_in_prod';

// ─────────────────────────────────────────────────────────────────
// CUSTOM ERROR CLASSES
// ─────────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError      extends AppError { constructor(msg) { super(msg, 400); } }
export class AuthenticationError extends AppError { constructor(msg) { super(msg, 401); } }
export class AuthorizationError  extends AppError { constructor(msg) { super(msg, 403); } }
export class NotFoundError       extends AppError { constructor(msg) { super(msg, 404); } }
export class ConflictError       extends AppError { constructor(msg) { super(msg, 409); } }

// ─────────────────────────────────────────────────────────────────
// AUTHENTICATION MIDDLEWARES
// ─────────────────────────────────────────────────────────────────

export const authenticateToken = (req, res, next) => {
  const token = req.cookies?.auth_token ?? req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (...allowed) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(403).json({ error: 'Access denied — role not found' });
  if (!allowed.includes(role)) {
    return res.status(403).json({
      error: `Access denied — requires one of: ${allowed.join(', ')}`,
    });
  }
  next();
};

export const authenticateCustomer = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.customer = jwt.verify(token, CUSTOMER_JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
