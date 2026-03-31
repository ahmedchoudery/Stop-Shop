/**
 * @fileoverview Stop & Shop — Main Express Server
 * Applies: nodejs-best-practices (layered arch, error handling, security, validation),
 *          javascript-pro (async/await, Promise.allSettled, ES6+ modules),
 *          javascript-mastery (const, optional chaining, nullish coalescing),
 *          typescript-expert (JSDoc typed throughout)
 */

import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import { cacheService, CACHE_KEYS } from './src/services/cacheService.js';
import { sanitizeInput, getClientIp, flattenQueryParams } from './src/middleware/security.js';
import {
  validateRequest,
  loginSchema,
  createProductSchema,
  updateProductSchema,
  createAdminSchema,
  updateOrderStatusSchema,
  checkoutSchema,
  updateSettingsSchema,
} from './src/schemas/validation.js';

dotenv.config();

// ─────────────────────────────────────────────────────────────────
// STARTUP DIAGNOSTICS
// ─────────────────────────────────────────────────────────────────

const startupLog = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGO_URI_PRESENT: !!(process.env.MONGO_URI ?? process.env.MONGODB_URI),
  JWT_SECRET_PRESENT: !!(process.env.JWT_SECRET ?? process.env.jwt_secret),
  REDIS_URL_PRESENT: !!(process.env.REDIS_URL ?? process.env.REDIS_TLS_URL),
};

console.table(startupLog);

// ─────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLERS — Keep process alive for diagnostics
// ─────────────────────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

// ─────────────────────────────────────────────────────────────────
// CUSTOM ERROR CLASSES (nodejs-best-practices: typed errors)
// ─────────────────────────────────────────────────────────────────

class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   */
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError { constructor(msg) { super(msg, 400); } }
class AuthenticationError extends AppError { constructor(msg) { super(msg, 401); } }
class AuthorizationError extends AppError { constructor(msg) { super(msg, 403); } }
class NotFoundError extends AppError { constructor(msg) { super(msg, 404); } }
class ConflictError extends AppError { constructor(msg) { super(msg, 409); } }

// ─────────────────────────────────────────────────────────────────
// ENVIRONMENT HELPER
// ─────────────────────────────────────────────────────────────────

/**
 * Get first defined environment variable from a list of keys.
 * @param {...string} keys
 * @returns {string|undefined}
 */
const getEnv = (...keys) => keys.map(k => process.env[k]).find(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

// ─────────────────────────────────────────────────────────────────
// APP SETUP
// ─────────────────────────────────────────────────────────────────

const app = express();
app.set('trust proxy', 1); // Required behind Railway/Vercel load balancer

// ─────────────────────────────────────────────────────────────────
// PRE-MIDDLEWARE ROUTES (health check must respond before all else)
// ─────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/_diag', (_req, res) => {
  res.json({
    status: 'alive',
    uptime: process.uptime(),
    ...startupLog,
    memory: process.memoryUsage(),
  });
});

// ─────────────────────────────────────────────────────────────────
// SECURITY MIDDLEWARE
// ─────────────────────────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'https:'],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ─────────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://stop-shop-gamma.vercel.app',
  'https://stop-shop-4da620xej-ahmedchouderys-projects.vercel.app',
  ...(getEnv('ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean),
];

const uniqueOrigins = [...new Set(ALLOWED_ORIGINS)];

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server / mobile / curl requests
    if (!origin) return callback(null, true);

    const allowed = uniqueOrigins.includes(origin)
      || /^https:\/\/stop-shop.*\.vercel\.app$/.test(origin);

    if (allowed) return callback(null, true);

    console.warn(`[CORS] Blocked: ${origin}`);
    callback(null, false);
  },
  credentials: true,
}));

// ─────────────────────────────────────────────────────────────────
// GENERAL MIDDLEWARE
// ─────────────────────────────────────────────────────────────────

app.use(compression());
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(sanitizeInput);
app.use(flattenQueryParams);

// ─────────────────────────────────────────────────────────────────
// RATE LIMITING
// ─────────────────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: { xForwardedForHeader: false },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: 'Too many checkout attempts. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// ─────────────────────────────────────────────────────────────────
// DB MODELS
// ─────────────────────────────────────────────────────────────────

const orderSchema = new mongoose.Schema({
  orderID: { type: String, unique: true, index: true },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: String,
    city: String,
    zip: String,
  },
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    selectedSize: { type: String, default: '' },
  }],
  total: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
    index: true,
  },
  ip: { type: String, default: '' },
}, { timestamps: true, versionKey: false });

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customer.email': 1 });

const Order = mongoose.model('Order', orderSchema);

const productSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, default: 0, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  image: { type: String, default: '' },
  mediaType: { type: String, enum: ['upload', 'url', 'embed'], default: 'upload' },
  embedCode: { type: String, default: '' },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  bucket: { type: String, default: 'Tops' },
  subCategory: { type: String, default: 'General' },
  specs: [{ type: String }],
  colors: [{ type: String }],
  sizes: [{ type: String }],
  sizeStock: { type: Map, of: Number, default: {} },
  lifestyleImage: { type: String, default: '' },
  variantImages: { type: Map, of: String, default: {} },
  gallery: [{ type: String }],
}, { timestamps: true, versionKey: false, autoIndex: true });

productSchema.index({ bucket: 1, createdAt: -1 });

/**
 * Sync quantity/stock from sizeStock map on save.
 * Pure function applied to Mongoose pre-save hook.
 */
productSchema.pre('save', function syncStock() {
  const sizeValues = this.sizeStock instanceof Map
    ? [...this.sizeStock.values()]
    : Object.values(this.sizeStock ?? {});

  if (sizeValues.length > 0) {
    const total = sizeValues.reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
    this.quantity = total;
    this.stock = total;
    return;
  }

  if (this.isModified('quantity')) {
    this.stock = this.quantity;
  } else if (this.isModified('stock')) {
    this.quantity = this.stock;
  }
});

const Product = mongoose.model('Product', productSchema);

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false }, // Never returned by default
  isPrimary: { type: Boolean, default: false },
  roles: {
    type: [String],
    enum: ['admin', 'super-admin', 'auditor'],
    default: ['admin'],
  },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  lastLogin: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

const Admin = mongoose.model('Admin', adminSchema);

const settingsSchema = new mongoose.Schema({
  logo: { type: String, default: '' },
  announcement: { type: String, default: 'Welcome to Stop & Shop — Premium Clothing', maxlength: 500 },
}, { timestamps: true, versionKey: false });

const Settings = mongoose.model('Settings', settingsSchema);

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true, index: true },
  details: { type: mongoose.Schema.Types.Mixed },
  adminEmail: { type: String, required: true, index: true },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: true, versionKey: false });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
}, { timestamps: true, versionKey: false });

const Subscriber = mongoose.model('Subscriber', subscriberSchema);

// ─────────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────────

const JWT_SECRET = getEnv('JWT_SECRET', 'jwt_secret');

/**
 * Verify JWT from cookie or Authorization header.
 * @type {import('express').RequestHandler}
 */
const authenticateToken = (req, res, next) => {
  const token = req.cookies?.auth_token
    ?? req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Validate CSRF token for state-changing requests.
 * @type {import('express').RequestHandler}
 */
const csrfValidation = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const csrfToken = req.headers['x-csrf-token'] ?? req.cookies?.csrf_token;
  if (!csrfToken) return res.status(403).json({ error: 'CSRF token required' });

  try {
    const decoded = jwt.verify(csrfToken, JWT_SECRET);
    if (decoded.type !== 'csrf') {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    if (decoded.userId !== req.user?.id) {
      return res.status(403).json({ error: 'CSRF token mismatch' });
    }
    return next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired CSRF token' });
  }
};

/**
 * Require specific admin role.
 * @param {string[]} roles
 * @returns {import('express').RequestHandler}
 */
const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  return next();
};

// ─────────────────────────────────────────────────────────────────
// EMAIL TRANSPORTER
// ─────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: getEnv('EMAIL_USER', 'email_user'),
    pass: getEnv('EMAIL_PASS', 'email_pass'),
  },
});

/**
 * Send email — never throws, logs failure.
 * @param {nodemailer.SendMailOptions} options
 */
const sendEmail = async (options) => {
  try {
    await transporter.sendMail(options);
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
  }
};

/**
 * Append an audit entry to MongoDB.
 * @param {string} action
 * @param {any} details
 * @param {import('express').Request} [req]
 */
const logAudit = async (action, details, req) => {
  try {
    await AuditLog.create({
      action,
      details,
      adminEmail: req?.user?.email ?? 'system',
      ip: getClientIp(req),
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[Audit] Failed to log:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────
// ROUTES: AUTH
// ─────────────────────────────────────────────────────────────────

app.post('/api/admin/login', authLimiter, validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // +password to override select:false
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) throw new AuthenticationError('Invalid credentials');

    // Account lock check
    if (admin.lockUntil && admin.lockUntil > new Date()) {
      const minutes = Math.ceil((admin.lockUntil - Date.now()) / 60_000);
      return res.status(423).json({ error: `Account locked. Try again in ${minutes} minutes.` });
    }

    const passwordValid = await bcrypt.compare(password, admin.password);

    if (!passwordValid) {
      const attempts = admin.failedLoginAttempts + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60_000) : null;

      await Admin.findByIdAndUpdate(admin._id, {
        $inc: { failedLoginAttempts: 1 },
        ...(lockUntil && { lockUntil }),
      });

      if (lockUntil) {
        return res.status(423).json({ error: 'Too many failed attempts. Account locked for 15 minutes.' });
      }

      throw new AuthenticationError('Invalid credentials');
    }

    // Reset failed attempts on success
    await Admin.findByIdAndUpdate(admin._id, {
      failedLoginAttempts: 0,
      lockUntil: null,
      lastLogin: new Date(),
    });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.roles?.[0] ?? 'admin' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const csrfToken = jwt.sign(
      { type: 'csrf', userId: admin._id.toString() },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    };

    res
      .cookie('auth_token', token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 })
      .cookie('csrf_token', csrfToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 })
      .json({ name: admin.name, success: true, token });

  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/logout', authenticateToken, (req, res) => {
  res
    .clearCookie('auth_token')
    .clearCookie('csrf_token')
    .json({ success: true });
});

// ─────────────────────────────────────────────────────────────────
// ROUTES: ORDERS
// ─────────────────────────────────────────────────────────────────

app.get('/api/orders', authenticateToken, async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) { next(err); }
});

app.patch('/api/orders/:id', authenticateToken, validateRequest(updateOrderStatusSchema), async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).lean();

    if (!order) throw new NotFoundError('Order not found');

    await logAudit('ORDER_STATUS_UPDATE', { id: req.params.id, status: req.body.status }, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_REVENUE, CACHE_KEYS.STATS_ORDERS]);
    res.json(order);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// ROUTES: PRODUCTS (admin)
// ─────────────────────────────────────────────────────────────────

app.get('/api/admin/products', authenticateToken, async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (err) { next(err); }
});

app.post('/api/admin/products', authenticateToken, validateRequest(createProductSchema), async (req, res, next) => {
  try {
    const buildId = () => `PRD-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    const productData = { ...req.body, id: req.body.id || buildId() };

    try {
      const product = await new Product(productData).save();
      await logAudit('PRODUCT_CREATE', { id: product.id, name: product.name }, req);
      await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);
      return res.status(201).json(product);
    } catch (saveErr) {
      // Retry with new ID on collision
      if (saveErr?.code === 11000 && saveErr?.keyPattern?.id) {
        const product = await new Product({ ...productData, id: buildId() }).save();
        await logAudit('PRODUCT_CREATE_RETRY', { id: product.id, name: product.name }, req);
        await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);
        return res.status(201).json(product);
      }
      throw saveErr;
    }
  } catch (err) { next(err); }
});

app.patch('/api/admin/products/:id', authenticateToken, validateRequest(updateProductSchema), async (req, res, next) => {
  try {
    const updateData = { ...req.body };

    // Sync stock from sizeStock if provided
    if (updateData.sizeStock && typeof updateData.sizeStock === 'object') {
      const total = Object.values(updateData.sizeStock)
        .reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
      updateData.quantity = total;
      updateData.stock = total;
    } else {
      // Ensure quantity and stock stay in sync
      if (updateData.quantity !== undefined && updateData.stock === undefined) {
        updateData.stock = updateData.quantity;
      } else if (updateData.stock !== undefined && updateData.quantity === undefined) {
        updateData.quantity = updateData.stock;
      }
    }

    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    ).lean();

    if (!product) throw new NotFoundError('Product not found');

    await logAudit('PRODUCT_UPDATE', { id: req.params.id, changes: Object.keys(req.body) }, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);
    res.json(product);
  } catch (err) { next(err); }
});

app.delete('/api/admin/products/:id', authenticateToken, async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id }).lean();
    if (!product) throw new NotFoundError('Product not found');

    await logAudit('PRODUCT_DELETE', { id: req.params.id, name: product.name }, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);
    res.json({ message: 'Product removed from system' });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// ROUTES: PUBLIC PRODUCTS
// ─────────────────────────────────────────────────────────────────

app.get('/api/public/products', async (req, res, next) => {
  try {
    const data = await cacheService.getOrSet(
      CACHE_KEYS.PUBLIC_PRODUCTS,
      () => Product.find().lean()
    );
    res.json(data);
  } catch (err) { next(err); }
});

app.get('/api/schema/products', async (_req, res, next) => {
  try {
    const products = await Product.find().lean();
    const baseUrl = 'https://stop-shop-gamma.vercel.app';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          description: `${product.name} — ${product.subCategory ?? 'Premium clothing'}`,
          image: product.image,
          url: `${baseUrl}/shop`,
          brand: { '@type': 'Brand', name: 'Stop & Shop' },
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'PKR',
            availability: product.quantity > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        },
      })),
    };

    res.json(schema);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// ROUTES: STATS (with caching)
// ─────────────────────────────────────────────────────────────────

app.get(['/api/stats/revenue', '/api/admin/stats/revenue'], authenticateToken, async (_req, res, next) => {
  try {
    const data = await cacheService.getOrSet(CACHE_KEYS.STATS_REVENUE, async () => {
      const orders = await Order.find({ status: { $ne: 'Cancelled' } }).lean();
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);

      const totalRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);

      const todayRevenue = orders
        .filter(o => new Date(o.createdAt) >= startOfToday)
        .reduce((sum, o) => sum + (o.total ?? 0), 0);

      const yesterdayRevenue = orders
        .filter(o => {
          const d = new Date(o.createdAt);
          return d >= startOfYesterday && d < startOfToday;
        })
        .reduce((sum, o) => sum + (o.total ?? 0), 0);

      const trend = yesterdayRevenue > 0
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : todayRevenue > 0 ? 100 : 0;

      const weeklyData = [...Array(7)].map((_, i) => {
        const target = new Date(startOfToday);
        target.setDate(target.getDate() - (6 - i));
        const next = new Date(target);
        next.setDate(next.getDate() + 1);

        const dayOrders = orders.filter(o => {
          const d = new Date(o.createdAt);
          return d >= target && d < next;
        });

        return {
          day: target.toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: dayOrders.reduce((sum, o) => sum + (o.total ?? 0), 0),
          orders: dayOrders.length,
        };
      });

      return { totalRevenue, trend, weeklyData };
    });

    res.json(data);
  } catch (err) { next(err); }
});

app.get(['/api/stats/orders', '/api/admin/stats/orders'], authenticateToken, async (_req, res, next) => {
  try {
    const data = await cacheService.getOrSet(CACHE_KEYS.STATS_ORDERS, async () => {
      const [totalOrders, pendingOrders] = await Promise.all([
        Order.countDocuments({ status: { $ne: 'Cancelled' } }),
        Order.countDocuments({ status: 'Pending' }),
      ]);
      return { totalOrders, pendingOrders };
    });

    res.json(data);
  } catch (err) { next(err); }
});

app.get(['/api/stats/inventory', '/api/admin/stats/inventory'], authenticateToken, async (_req, res, next) => {
  try {
    const data = await cacheService.getOrSet(CACHE_KEYS.STATS_INVENTORY, async () => {
      const products = await Product.find().lean();
      return {
        totalProducts: products.length,
        outOfStock: products.filter(p => p.quantity === 0).length,
        lowStock: products.filter(p => p.quantity > 0 && p.quantity < 5).length,
        products,
      };
    });

    res.json(data);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// ROUTES: SETTINGS
// ─────────────────────────────────────────────────────────────────

app.get('/api/settings', authenticateToken, async (_req, res, next) => {
  try {
    let settings = await Settings.findOne().lean();
    if (!settings) {
      settings = (await new Settings().save()).toObject();
    }
    res.json(settings);
  } catch (err) { next(err); }
});

app.post('/api/settings', authenticateToken, validateRequest(updateSettingsSchema), async (req, res, next) => {
  try {
    const { logo, announcement } = req.body;
    const update = {
      ...(logo !== undefined && { logo }),
      ...(announcement !== undefined && { announcement }),
    };

    const settings = await Settings.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
    }).lean();

    await logAudit('SETTINGS_UPDATE', { changedKeys: Object.keys(update) }, req);
    await cacheService.del(CACHE_KEYS.SETTINGS);
    res.json({ message: 'Settings updated successfully', settings });
  } catch (err) { next(err); }
});

app.get('/api/public/settings', async (_req, res, next) => {
  try {
    const data = await cacheService.getOrSet(
      CACHE_KEYS.SETTINGS,
      async () => {
        const s = await Settings.findOne().lean();
        return s ?? { announcement: 'Welcome to Stop & Shop', logo: '' };
      }
    );
    res.json(data);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// ROUTES: ADMIN USERS
// ─────────────────────────────────────────────────────────────────

app.get('/api/admin/users', authenticateToken, async (_req, res, next) => {
  try {
    const admins = await Admin.find().select('-password').lean();
    res.json(admins);
  } catch (err) { next(err); }
});

app.post('/api/admin/users', authenticateToken, validateRequest(createAdminSchema), async (req, res, next) => {
  try {
    const { name, email, password, roles } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) throw new ConflictError('Email already in use');

    const hashedPassword = await bcrypt.hash(password, 12);
    await Admin.create({ name, email, password: hashedPassword, roles: roles ?? ['admin'] });

    res.status(201).json({ message: 'Admin account created successfully' });
  } catch (err) { next(err); }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) throw new NotFoundError('Admin not found');
    if (admin.isPrimary) throw new AuthorizationError('Primary owner cannot be removed');

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: 'Access revoked successfully' });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// ROUTES: AUDIT LOGS
// ─────────────────────────────────────────────────────────────────

// Audit logging logic moved to top of file for global availability

app.get('/api/audits', authenticateToken, async (_req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100).lean();
    res.json(logs);
  } catch (err) { next(err); }
});

app.post('/api/newsletter/subscribe', apiLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email address required.' });
    }

    const normalised = email.toLowerCase().trim();
    
    // Check MongoDB for existing subscriber
    const existing = await Subscriber.findOne({ email: normalised });
    if (existing) {
      return res.json({ message: 'Already subscribed! You are on the list.' });
    }

    await Subscriber.create({ email: normalised });

    // Notify admin
    const adminEmail = getEnv('ADMIN_EMAIL', 'admin_email', 'EMAIL_USER', 'email_user');
    const fromEmail  = getEnv('EMAIL_USER', 'email_user');
    sendEmail({
      from: fromEmail,
      to: adminEmail,
      subject: '📧 New Newsletter Subscriber',
      html: `<p>New subscriber: <strong>${normalised}</strong></p>`,
    });

    res.json({ message: 'Subscribed! Thank you for joining.' });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// ROUTES: CHECKOUT
// ─────────────────────────────────────────────────────────────────

app.post('/api/checkout', checkoutLimiter, validateRequest(checkoutSchema), async (req, res, next) => {
  try {
    const { customer, items, total, paymentMethod } = req.body;
    const clientIp = getClientIp(req);

    // ── Stock pre-check (read, then atomic update) ──────────────

    const productIds = [...new Set(items.map(i => i.id))];
    const dbProducts = await Product.find({ id: { $in: productIds } });
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const product = productMap.get(item.id);
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.id}` });
      }

      const size = (item.selectedSize ?? '').trim();

      if (size && product.sizes?.length && !product.sizes.includes(size)) {
        return res.status(400).json({ error: `Invalid size ${size} for ${product.name}` });
      }

      const sizeAvailable = size ? (product.sizeStock?.get?.(size) ?? product.sizeStock?.[size]) : undefined;

      if (size && sizeAvailable !== undefined) {
        if (sizeAvailable < qty) {
          return res.status(400).json({ error: `Not enough stock for ${product.name} (${size})` });
        }
      } else if ((product.quantity ?? 0) < qty) {
        return res.status(400).json({ error: `Not enough stock for ${product.name}` });
      }
    }

    // ── Atomic stock deduction ───────────────────────────────────

    const orderID = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const lowStockItems = [];

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const size = (item.selectedSize ?? '').trim();
      const sizeKey = size ? `sizeStock.${size}` : null;

      const updateQuery = sizeKey
        ? { $inc: { quantity: -qty, stock: -qty, [sizeKey]: -qty } }
        : { $inc: { quantity: -qty, stock: -qty } };

      const filterQuery = sizeKey
        ? { id: item.id, [sizeKey]: { $gte: qty } }
        : { id: item.id, quantity: { $gte: qty } };

      const updated = await Product.findOneAndUpdate(filterQuery, updateQuery, { new: true });

      if (!updated) {
        return res.status(400).json({ error: `Could not reserve stock for ${item.name}. Please refresh and try again.` });
      }

      if (updated.quantity < 5) lowStockItems.push(updated);
    }

    // ── Create order ─────────────────────────────────────────────

    const newOrder = await Order.create({ orderID, customer, items, total, paymentMethod, ip: clientIp });

    // ── Invalidate relevant cache ────────────────────────────────

    await cacheService.invalidateMany([
      CACHE_KEYS.STATS_REVENUE,
      CACHE_KEYS.STATS_ORDERS,
      CACHE_KEYS.STATS_INVENTORY,
      CACHE_KEYS.PUBLIC_PRODUCTS,
    ]);

    // ── Send emails (fire and forget — never block response) ─────

    const adminEmail = getEnv('ADMIN_EMAIL', 'admin_email', 'EMAIL_USER', 'email_user');
    const fromEmail = getEnv('EMAIL_USER', 'email_user');

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">${item.name}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.quantity ?? 1}</td>
        <td style="padding:8px;border:1px solid #ddd">Rs. ${(item.price ?? 0).toFixed(2)}</td>
      </tr>
    `).join('');

    sendEmail({
      from: fromEmail,
      to: adminEmail,
      subject: `🛍️ New Order: ${orderID}`,
      html: `
        <h2 style="color:#F63049">New Order Received</h2>
        <p><strong>Order ID:</strong> ${orderID}</p>
        <p><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
        <p><strong>Address:</strong> ${customer.address}, ${customer.city} ${customer.zip}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <thead><tr style="background:#f2f2f2">
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Item</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:center">Qty</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Price</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot><tr>
            <td colspan="2" style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">Total:</td>
            <td style="padding:8px;border:1px solid #ddd;font-weight:bold">Rs. ${total.toFixed(2)}</td>
          </tr></tfoot>
        </table>
      `,
    });

    if (lowStockItems.length > 0) {
      sendEmail({
        from: fromEmail,
        to: adminEmail,
        subject: `⚠️ Low Stock Alert: ${lowStockItems.length} item(s) need restocking`,
        html: `
          <h2>Inventory Alert</h2>
          <p>After order <strong>${orderID}</strong>, the following items are running low:</p>
          <ul>
            ${lowStockItems.map(p => `<li><strong>${p.name}</strong> — ${p.quantity} remaining</li>`).join('')}
          </ul>
        `,
      });
    }

    res.status(201).json({ message: 'Order placed successfully', orderID });

  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// STATIC FILES & SPA FALLBACK
// ─────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
  }));
}

// API 404
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// SPA catch-all
app.use((_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({ status: 'API server running', message: 'Frontend not built yet' });
  }
});

// ─────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER (nodejs-best-practices: centralized)
// ─────────────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode ?? 500;
  const isOperational = err.isOperational ?? false;

  // Always log server errors
  if (statusCode >= 500) {
    console.error('[ERROR]', err.message, err.stack);
  }

  if (isProduction && !isOperational) {
    return res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
  }

  return res.status(statusCode).json({
    status: statusCode < 500 ? 'fail' : 'error',
    message: err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// ─────────────────────────────────────────────────────────────────
// SERVER STARTUP
// ─────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '5000', 10);

let server;
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server listening on 0.0.0.0:${PORT}`);
  });
}

// ── Database ─────────────────────────────────────────────────────

const mongoUri = getEnv('MONGO_URI', 'MONGODB_URI');
if (!mongoUri) {
  console.error('❌ Missing MONGO_URI — app running in degraded mode (no DB)');
} else {
  mongoose
    .connect(mongoUri, {
      maxPoolSize: 10,
      socketTimeoutMS: 45_000,
      serverSelectionTimeoutMS: 5_000,
      family: 4,
    })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err.message));
}

// ── Graceful Shutdown ─────────────────────────────────────────────

const gracefulShutdown = async (signal) => {
  console.log(`\n[Shutdown] ${signal} received — closing server...`);

  server.close(async () => {
    console.log('[Shutdown] HTTP server closed');

    // Close DB and cache in parallel
    await Promise.allSettled([
      mongoose.connection.close().then(() => console.log('[Shutdown] MongoDB closed')),
      cacheService.close().then(() => console.log('[Shutdown] Redis closed')),
    ]);

    console.log('[Shutdown] Clean exit');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[Shutdown] Forced exit after timeout');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;