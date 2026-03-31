/**
 * @fileoverview Stop & Shop — Vercel Serverless Entry Point
 * Migrated from server.js to support both Railway (standalone) and Vercel (serverless).
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

// Updated imports to reflect root-level position
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
  VERCEL: !!process.env.VERCEL,
  RAILWAY: !!process.env.RAILWAY_STATIC_URL || !!process.env.RAILWAY_ENVIRONMENT,
};

console.log('🚀 Starting API Diagnostics...');
console.table(startupLog);

// ─────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLERS
// ─────────────────────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message, err.stack);
  if (!process.env.VERCEL) process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  if (!process.env.VERCEL) process.exit(1);
});

// ─────────────────────────────────────────────────────────────────
// CUSTOM ERROR CLASSES
// ─────────────────────────────────────────────────────────────────

class AppError extends Error {
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

const getEnv = (...keys) => keys.map(k => process.env[k]).find(Boolean);
const isProduction = process.env.NODE_ENV === 'production';

// ─────────────────────────────────────────────────────────────────
// APP SETUP
// ─────────────────────────────────────────────────────────────────

const app = express();
app.set('trust proxy', 1);

// ─────────────────────────────────────────────────────────────────
// PRE-MIDDLEWARE ROUTES
// ─────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

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
  bucket: { type: String, default: 'Tops', trim: true },
  subCategory: { type: String, default: 'General', trim: true },
  specs: [{ type: String }],
  colors: [{ type: String }],
  sizes: [{ type: String }],
  sizeStock: { type: Map, of: Number, default: {} },
  lifestyleImage: { type: String, default: '' },
  variantImages: { type: Map, of: String, default: {} },
  gallery: [{ type: String }],
}, { timestamps: true, versionKey: false, autoIndex: true });

productSchema.index({ bucket: 1, createdAt: -1 });

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

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false },
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

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

const settingsSchema = new mongoose.Schema({
  logo: { type: String, default: '' },
  announcement: { type: String, default: 'Welcome to Stop & Shop — Premium Clothing', maxlength: 500 },
}, { timestamps: true, versionKey: false });

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true, index: true },
  details: { type: mongoose.Schema.Types.Mixed },
  adminEmail: { type: String, required: true, index: true },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: true, versionKey: false });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
}, { timestamps: true, versionKey: false });

const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);

// ─────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────

const JWT_SECRET = getEnv('JWT_SECRET', 'jwt_secret');

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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: getEnv('EMAIL_USER', 'email_user'),
    pass: getEnv('EMAIL_PASS', 'email_pass'),
  },
});

const sendEmail = async (options) => {
  try {
    await transporter.sendMail(options);
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────────

const authenticateToken = (req, res, next) => {
  const token = req.cookies?.auth_token ?? req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ─────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────

app.post('/api/admin/login', authLimiter, validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) throw new AuthenticationError('Invalid credentials');

    if (admin.lockUntil && admin.lockUntil > new Date()) {
      const minutes = Math.ceil((admin.lockUntil - Date.now()) / 60_000);
      return res.status(423).json({ error: `Account locked. Try again in ${minutes} minutes.` });
    }

    const passwordValid = await bcrypt.compare(password, admin.password);
    if (!passwordValid) {
      const attempts = admin.failedLoginAttempts + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60_000) : null;
      await Admin.findByIdAndUpdate(admin._id, { $inc: { failedLoginAttempts: 1 }, ...(lockUntil && { lockUntil }) });
      if (lockUntil) return res.status(423).json({ error: 'Too many failed attempts. Account locked for 15 minutes.' });
      throw new AuthenticationError('Invalid credentials');
    }

    await Admin.findByIdAndUpdate(admin._id, { failedLoginAttempts: 0, lockUntil: null, lastLogin: new Date() });

    const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.roles?.[0] ?? 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    const csrfToken = jwt.sign({ type: 'csrf', userId: admin._id.toString() }, JWT_SECRET, { expiresIn: '1h' });

    const cookieOptions = { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax', path: '/' };
    res.cookie('auth_token', token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 })
       .cookie('csrf_token', csrfToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 })
       .json({ name: admin.name, success: true, token });
  } catch (err) { next(err); }
});

app.post('/api/admin/logout', authenticateToken, (req, res) => {
  res.clearCookie('auth_token').clearCookie('csrf_token').json({ success: true });
});

app.get('/api/admin/users', authenticateToken, async (req, res, next) => {
  try {
    const users = await Admin.find().sort({ createdAt: -1 }).select('-password').lean();
    res.json(users);
  } catch (err) { next(err); }
});

// ── Admin Stats ────────────────────────────────────────────────
app.get('/api/stats/revenue', authenticateToken, async (req, res, next) => {
  try {
    const total = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    res.json({ total: total[0]?.total || 0, growth: 0 });
  } catch (err) { next(err); }
});

app.get('/api/stats/orders', authenticateToken, async (req, res, next) => {
  try {
    const counts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const total = counts.reduce((acc, c) => acc + c.count, 0);
    res.json({ total, counts: counts.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {}) });
  } catch (err) { next(err); }
});

app.get('/api/stats/inventory', authenticateToken, async (req, res, next) => {
  try {
    const total = await Product.countDocuments();
    const lowStock = await Product.countDocuments({ stock: { $lt: 5 } });
    res.json({ total, lowStock });
  } catch (err) { next(err); }
});

app.get('/api/orders', authenticateToken, async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) { next(err); }
});

app.patch('/api/orders/:id', authenticateToken, validateRequest(updateOrderStatusSchema), async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).lean();
    if (!order) throw new NotFoundError('Order not found');
    await logAudit('ORDER_STATUS_UPDATE', { id: req.params.id, status: req.body.status }, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_REVENUE, CACHE_KEYS.STATS_ORDERS]);
    res.json(order);
  } catch (err) { next(err); }
});

app.get('/api/admin/products', authenticateToken, async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    // Professional Fallback: ensure every record has useable ID for frontend
    const docs = products.map(p => ({
      ...p,
      id: p.id || p._id?.toString() || `GEN-${Math.random().toString(36).substr(2, 9)}`
    }));
    res.json(docs);
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
    if (updateData.sizeStock && typeof updateData.sizeStock === 'object') {
      const total = Object.values(updateData.sizeStock).reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
      updateData.quantity = total;
      updateData.stock = total;
    }
    const product = await Product.findOneAndUpdate({ id: req.params.id }, updateData, { new: true }).lean();
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
    res.json({ message: 'Product removed' });
  } catch (err) { next(err); }
});

app.get('/api/public/products', async (req, res, next) => {
  try {
    const data = await cacheService.getOrSet(CACHE_KEYS.PUBLIC_PRODUCTS, async () => {
      const products = await Product.find().lean();
      return products.map(p => ({
        ...p,
        id: p.id || p._id?.toString() || `GEN-${Math.random().toString(36).substr(2, 9)}`,
        bucket: p.bucket || 'General',
        subCategory: p.subCategory || 'General'
      }));
    });
    res.json(data);
  } catch (err) { next(err); }
});

app.post('/api/checkout', checkoutLimiter, validateRequest(checkoutSchema), async (req, res, next) => {
  try {
    const { customer, items, total, paymentMethod } = req.body;
    const clientIp = getClientIp(req);
    const productIds = [...new Set(items.map(i => i.id))];
    const dbProducts = await Product.find({ id: { $in: productIds } });
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.id);
      if (!product) return res.status(400).json({ error: `Product not found: ${item.id}` });
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const size = (item.selectedSize ?? '').trim();
      const available = size ? (product.sizeStock?.get?.(size) ?? product.sizeStock?.[size]) : product.quantity;
      if (available < qty) return res.status(400).json({ error: `Not enough stock for ${product.name}` });
    }

    const orderID = `ORD-${Date.now().toString(36).toUpperCase()}`;
    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const size = (item.selectedSize ?? '').trim();
      const sizeKey = size ? `sizeStock.${size}` : null;
      const update = sizeKey ? { $inc: { quantity: -qty, stock: -qty, [sizeKey]: -qty } } : { $inc: { quantity: -qty, stock: -qty } };
      await Product.findOneAndUpdate({ id: item.id }, update);
    }

    await Order.create({ orderID, customer, items, total, paymentMethod, ip: clientIp });
    await cacheService.invalidateMany([CACHE_KEYS.STATS_REVENUE, CACHE_KEYS.STATS_ORDERS, CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PUBLIC_PRODUCTS]);
    res.status(201).json({ message: 'Order placed', orderID });
  } catch (err) { next(err); }
});

app.get('/api/public/settings', async (_req, res, next) => {
  try {
    const data = await cacheService.getOrSet(CACHE_KEYS.SETTINGS, async () => {
      const s = await Settings.findOne().lean();
      return s ?? { announcement: 'Welcome to Stop & Shop', logo: '' };
    });
    res.json(data);
  } catch (err) { next(err); }
});

app.post('/api/settings', authenticateToken, validateRequest(updateSettingsSchema), async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true }).lean();
    await logAudit('SETTINGS_UPDATE', { changed: Object.keys(req.body) }, req);
    await cacheService.del(CACHE_KEYS.SETTINGS);
    res.json({ message: 'Settings updated', settings });
  } catch (err) { next(err); }
});

app.get('/api/audits', authenticateToken, async (_req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100).lean();
    res.json(logs);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// STATIC FILES & SPA ROUTING
// ─────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, './dist');

console.log(`[Static] Checking for dist at: ${distPath}`);

if (fs.existsSync(distPath)) {
  console.log('✅ Static assets found. Serving from /dist');
  app.use(express.static(distPath, { 
    maxAge: '1d',
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    }
  }));
} else {
  console.warn('⚠️ Static assets NOT found. Frontend might not be built yet.');
}

app.use('/api', (_req, res) => res.status(404).json({ error: 'API not found' }));

// SPA Fallback: Serve index.html for all non-API routes
app.get('*', (req, res) => {
  const index = path.join(distPath, 'index.html');
  if (fs.existsSync(index)) {
    res.sendFile(index);
  } else if (!req.path.startsWith('/api')) {
    res.status(200).json({ 
      message: 'API running — Frontend not built',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  const code = err.statusCode ?? 500;
  if (code >= 500) console.error('[ERROR]', err.message, err.stack);
  res.status(code).json({ status: code < 500 ? 'fail' : 'error', message: err.message });
});

// ─────────────────────────────────────────────────────────────────
// SERVER STARTUP
// ─────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '5000', 10);
let server;

if (!process.env.VERCEL) {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server on ${PORT}`);
    console.log(`[Diagnostic] Health check: http://0.0.0.0:${PORT}/api/health`);
  });
}

// ── Database ──
const mongoUri = getEnv('MONGO_URI', 'MONGODB_URI');
if (mongoUri) {
  console.log('🔌 Connecting to MongoDB...');
  mongoose.connect(mongoUri, { maxPoolSize: 10, socketTimeoutMS: 45000, family: 4 })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ DB error:', err.message));
}

// ── Shutdown ──
const shutdown = async (sig) => {
  console.log(`[Shutdown] ${sig}`);
  if (server && typeof server.close === 'function') {
    server.close(async () => {
      await Promise.allSettled([mongoose.connection.close(), cacheService.close()]);
      process.exit(0);
    });
  } else {
    await Promise.allSettled([mongoose.connection.close(), cacheService.close()]);
    if (!process.env.VERCEL) process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
