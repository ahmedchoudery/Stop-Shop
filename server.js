/**
 * @fileoverview Stop & Shop — Express API
 * MongoDB Collections: products, orders, inventories, admins, settings, auditlogs, subscribers
 *
 * Auto-sync rules:
 *  - Product created/updated  → inventories document upserted automatically
 *  - Product deleted          → inventories document deleted automatically
 *  - Customer buys product    → product stock decremented + inventory movement logged
 *  - Admin edits inventory    → product stock updated + inventory synced
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
  reviewSchema,
  couponValidationSchema,
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

console.log('🚀 Starting API...');
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

class ValidationError  extends AppError { constructor(msg) { super(msg, 400); } }
class AuthenticationError extends AppError { constructor(msg) { super(msg, 401); } }
class AuthorizationError  extends AppError { constructor(msg) { super(msg, 403); } }
class NotFoundError    extends AppError { constructor(msg) { super(msg, 404); } }
class ConflictError    extends AppError { constructor(msg) { super(msg, 409); } }

// ─────────────────────────────────────────────────────────────────
// ENVIRONMENT HELPERS
// ─────────────────────────────────────────────────────────────────

const getEnv = (...keys) => keys.map(k => process.env[k]).find(Boolean);
const isProduction = process.env.NODE_ENV === 'production';

// ─────────────────────────────────────────────────────────────────
// APP SETUP
// ─────────────────────────────────────────────────────────────────

const app = express();
app.set('trust proxy', 1);

// ─────────────────────────────────────────────────────────────────
// PRE-MIDDLEWARE HEALTH ROUTES
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
  res.json({ status: 'alive', uptime: process.uptime(), ...startupLog, memory: process.memoryUsage() });
});

// ─────────────────────────────────────────────────────────────────
// SECURITY MIDDLEWARE
// ─────────────────────────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc:  ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc:     ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc:    ["'self'", 'https:', 'data:'],
      objectSrc:  ["'none'"],
      mediaSrc:   ["'self'", 'https:'],
      frameSrc:   ["'none'"],
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
  windowMs: 15 * 60 * 1000, max: 5,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true, legacyHeaders: false, skipSuccessfulRequests: true,
  validate: { xForwardedForHeader: false },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 100,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true, legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 10,
  message: { error: 'Too many checkout attempts. Please slow down.' },
  standardHeaders: true, legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// ─────────────────────────────────────────────────────────────────
// ██████  ███████     MONGODB SCHEMAS & MODELS
// ─────────────────────────────────────────────────────────────────

// ── 1. ORDERS ─────────────────────────────────────────────────────
//    Each order captures full product snapshot at time of purchase:
//    productId, name, price, qty, size, color, category, subCategory

const orderItemSchema = new mongoose.Schema({
  id:            { type: String, required: true },   // Product SKU / ID
  name:          { type: String, required: true },
  price:         { type: Number, required: true, min: 0 },
  quantity:      { type: Number, default: 1, min: 1 },
  selectedSize:  { type: String, default: '' },
  selectedColor: { type: String, default: '' },      // ← Color variant chosen by customer
  category:      { type: String, default: '' },      // ← Product bucket (Tops, Bottoms…)
  subCategory:   { type: String, default: '' },      // ← e.g. T-Shirt, Jeans
}, { _id: false });

const PAYMENT_METHODS = ['COD', 'ATM Card', 'Bank Transfer', 'Easypaisa', 'JazzCash'];

const orderSchema = new mongoose.Schema({
  orderID: { type: String, unique: true, index: true },
  customer: {
    name:    { type: String, required: true },
    email:   { type: String, required: true },
    address: String,
    city:    String,
    zip:     String,
  },
  items:         [orderItemSchema],
  total:         { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, required: true, enum: PAYMENT_METHODS },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
    index: true,
  },
  ip:            { type: String, default: '' },
}, { timestamps: true, versionKey: false });

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ orderID: 1, createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// ── 2. PRODUCTS ───────────────────────────────────────────────────
//    Master product catalogue. All admin changes write here.
//    Post-save/delete hooks keep the Inventory collection in sync.

const productSchema = new mongoose.Schema({
  id:            { type: String, unique: true, index: true },
  name:          { type: String, required: true, trim: true },
  price:         { type: Number, required: true, min: 0 },
  quantity:      { type: Number, default: 0, min: 0 },  // total available
  stock:         { type: Number, default: 0, min: 0 },  // mirrors quantity
  image:         { type: String, default: '' },
  mediaType:     { type: String, enum: ['upload', 'url', 'embed'], default: 'upload' },
  embedCode:     { type: String, default: '' },
  rating:        { type: Number, default: 5, min: 1, max: 5 },
  bucket:        { type: String, default: 'Tops', trim: true },      // category
  subCategory:   { type: String, default: 'General', trim: true },
  specs:         [{ type: String }],
  colors:        [{ type: String }],
  sizes:         [{ type: String }],
  sizeStock:     { type: Map, of: Number, default: {} },  // { S: 10, M: 5, L: 3 }
  lifestyleImage: { type: String, default: '' },
  variantImages: { type: Map, of: String, default: {} },  // { 'Red': 'url', 'Blue': 'url' }
  gallery:       [{ type: String }],
}, { timestamps: true, versionKey: false, autoIndex: true });

productSchema.index({ bucket: 1, createdAt: -1 });

// Keep quantity + stock always in sync
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

// ── Post-save: auto-sync Inventory ─────────────────────────────
productSchema.post('save', async function (doc) {
  try {
    await syncInventory(doc, 'ADMIN_UPDATE', 'Product saved by admin');
  } catch (err) {
    console.error('[Inventory] post-save sync failed:', err.message);
  }
});

// ── Post-delete: remove from Inventory ─────────────────────────
productSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  try {
    await Inventory.deleteOne({ productId: doc.id });
    console.log(`[Inventory] Removed inventory entry for deleted product: ${doc.id}`);
  } catch (err) {
    console.error('[Inventory] post-delete cleanup failed:', err.message);
  }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// ── 3. INVENTORY ──────────────────────────────────────────────────
//    Dedicated collection for stock management.
//    Auto-maintained by Product hooks + checkout endpoint.
//    Includes a movement log (last 100 events) for full audit trail.

const inventoryMovementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['RESTOCK', 'SALE', 'ADMIN_UPDATE', 'ADMIN_DELETE', 'INITIAL'],
    required: true,
  },
  quantityDelta:   { type: Number, required: true },  // +10 = restock, -2 = sale
  previousStock:   { type: Number, default: 0 },
  newStock:        { type: Number, default: 0 },
  note:            { type: String, default: '' },
  triggeredBy:     { type: String, default: 'system' }, // 'admin' | 'customer' | 'system'
  orderId:         { type: String, default: null },
  timestamp:       { type: Date, default: Date.now },
}, { _id: false });

const inventorySchema = new mongoose.Schema({
  // ── Identity ──────────────────────────────────────────────────
  productId:     { type: String, required: true, unique: true, index: true },
  sku:           { type: String, required: true, index: true },

  // ── Product snapshot (mirrored from products collection) ──────
  name:          { type: String, required: true, trim: true },
  category:      { type: String, required: true, trim: true },    // = bucket
  subCategory:   { type: String, required: true, trim: true },
  price:         { type: Number, required: true, min: 0 },
  image:         { type: String, default: '' },
  rating:        { type: Number, default: 5 },
  colorVariants: [{ type: String }],                              // = colors array
  sizes:         [{ type: String }],

  // ── Stock levels ──────────────────────────────────────────────
  totalStock:          { type: Number, default: 0, min: 0 },     // aggregate across all sizes
  sizeStock:           { type: Map, of: Number, default: {} },   // per-size breakdown
  lowStockThreshold:   { type: Number, default: 5 },

  // ── Status (computed from totalStock) ─────────────────────────
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock',
    index: true,
  },

  // ── Timestamps of last events ─────────────────────────────────
  lastRestocked:   { type: Date, default: null },
  lastSold:        { type: Date, default: null },
  lastAdminEdit:   { type: Date, default: null },

  // ── Movement history (rolling last 100 events) ────────────────
  movements: {
    type: [inventoryMovementSchema],
    default: [],
  },

}, { timestamps: true, versionKey: false });

inventorySchema.index({ category: 1, status: 1 });
inventorySchema.index({ totalStock: 1 });
inventorySchema.index({ category: 1, totalStock: 1 });

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);

//
// ── 4. ADMINS ──────────────────────────────────────────────────────

const adminSchema = new mongoose.Schema({
  name:                 { type: String, required: true, trim: true },
  email:                { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:             { type: String, required: true, select: false },
  isPrimary:            { type: Boolean, default: false },
  roles:                { type: [String], enum: ['admin', 'super-admin', 'auditor'], default: ['admin'] },
  failedLoginAttempts:  { type: Number, default: 0 },
  lockUntil:            { type: Date, default: null },
  lastLogin:            { type: Date, default: null },
}, { timestamps: true, versionKey: false });

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

// ── 5. SETTINGS ────────────────────────────────────────────────────

const settingsSchema = new mongoose.Schema({
  logo:         { type: String, default: '' },
  announcement: { type: String, default: 'Welcome to Stop & Shop — Premium Clothing', maxlength: 500 },
}, { timestamps: true, versionKey: false });

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

// ── 6. AUDIT LOGS ──────────────────────────────────────────────────

const auditLogSchema = new mongoose.Schema({
  action:     { type: String, required: true, index: true },
  details:    { type: mongoose.Schema.Types.Mixed },
  adminEmail: { type: String, required: true, index: true },
  ip:         { type: String },
  timestamp:  { type: Date, default: Date.now, index: true },
}, { timestamps: true, versionKey: false });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

// ── 7. SUBSCRIBERS ─────────────────────────────────────────────────

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
}, { timestamps: true, versionKey: false });

const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);

// ── 8. COUPONS ──────────────────────────────────────────────────────
//    Discount codes. Supports percentage (%) and fixed (PKR) types.
//    CARDINAL20 = 20% off — matches newsletter promise.

const couponSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
  type:          { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  value:         { type: Number, required: true, min: 0 },   // 20 = 20% off | 500 = Rs.500 off
  minOrderValue: { type: Number, default: 0 },               // min cart total to qualify
  maxUses:       { type: Number, default: null },             // null = unlimited
  usedCount:     { type: Number, default: 0 },
  isActive:      { type: Boolean, default: true },
  expiresAt:     { type: Date, default: null },               // null = never expires
}, { timestamps: true, versionKey: false });

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

// ── 9. REVIEWS ──────────────────────────────────────────────────────
//    Customer reviews submitted via the storefront ReviewsSection.
//    Status 'pending' by default — admin approves before going public.

const reviewSchema = new mongoose.Schema({
  customerName:  { type: String, required: true, trim: true, maxlength: 100 },
  customerEmail: { type: String, required: true, trim: true, lowercase: true },
  rating:        { type: Number, required: true, min: 1, max: 5 },
  title:         { type: String, required: true, trim: true, maxlength: 120 },
  body:          { type: String, required: true, trim: true, maxlength: 2000 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  productId:     { type: String, default: '' }, // optional — if review is for a specific product
}, { timestamps: true, versionKey: false });

reviewSchema.index({ status: 1, createdAt: -1 });


const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

// ── 10. CUSTOMERS ───────────────────────────────────────────────────

const customerSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 100 },
  email:    { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  password: { type: String, required: true, minlength: 6 },
  phone:    { type: String, default: '', trim: true },
  address:  { type: String, default: '' },
  city:     { type: String, default: '' },
  zip:      { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);


// ─────────────────────────────────────────────────────────────────
// INVENTORY SYNC HELPER
// ─────────────────────────────────────────────────────────────────

/**
 * Upsert an Inventory document from a Product document.
 * Calculates status, appends movement log entry.
 *
 * @param {Object} product    - Mongoose Product document or plain object
 * @param {string} moveType   - Movement type: RESTOCK | SALE | ADMIN_UPDATE | INITIAL
 * @param {string} [note]     - Human-readable note for this movement
 * @param {string} [orderId]  - Order ID if triggered by a sale
 */
const syncInventory = async (product, moveType = 'ADMIN_UPDATE', note = '', orderId = null) => {
  try {
    const totalStock = product.quantity ?? 0;

    // Determine status
    const status = totalStock === 0
      ? 'Out of Stock'
      : totalStock < (LOW_STOCK_THRESHOLD || 3)
        ? 'Low Stock'
        : 'In Stock';

    // Resolve sizeStock to a plain object (handles both Map and plain objects)
    const sizeStockPlain =
      product.sizeStock instanceof Map
        ? Object.fromEntries(product.sizeStock)
        : (product.sizeStock ?? {});

    // Fetch previous state for delta calculation
    const existing = await Inventory.findOne({ productId: product.id }).lean();
    const previousStock = existing?.totalStock ?? 0;
    const quantityDelta = totalStock - previousStock;

    // Build movement entry
    const movement = {
      type:          moveType,
      quantityDelta,
      previousStock,
      newStock:      totalStock,
      note:          note || `${moveType} — stock changed by ${quantityDelta > 0 ? '+' : ''}${quantityDelta}`,
      triggeredBy:   moveType === 'SALE' ? 'customer' : 'admin',
      orderId:       orderId ?? null,
      timestamp:     new Date(),
    };

    // Timestamp fields for last event
    const timeFields = {};
    if (moveType === 'RESTOCK' || (moveType === 'ADMIN_UPDATE' && quantityDelta > 0)) {
      timeFields.lastRestocked = new Date();
    }
    if (moveType === 'SALE') {
      timeFields.lastSold = new Date();
    }
    if (['ADMIN_UPDATE', 'RESTOCK'].includes(moveType)) {
      timeFields.lastAdminEdit = new Date();
    }

    // Upsert inventory document — keeps rolling 100-entry movement log
    await Inventory.findOneAndUpdate(
      { productId: product.id },
      {
        $set: {
          productId:    product.id,
          sku:          product.id,
          name:         product.name,
          category:     product.bucket || 'General',
          subCategory:  product.subCategory || 'General',
          price:        product.price,
          image:        product.image || '',
          rating:       product.rating ?? 5,
          colorVariants: product.colors ?? [],
          sizes:        product.sizes ?? [],
          totalStock,
          sizeStock:    sizeStockPlain,
          status,
          ...timeFields,
        },
        $push: {
          movements: {
            $each:  [movement],
            $slice: -100,           // Keep last 100 movements
            $position: 0,           // Newest first
          },
        },
      },
      { upsert: true, new: true }
    );

    console.log(`[Inventory] Synced: ${product.id} | ${product.name} | Stock: ${previousStock} → ${totalStock} | ${status}`);
  } catch (err) {
    // Never let inventory sync crash the main operation
    console.error('[Inventory] Sync failed for product', product.id, ':', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────

// Low stock threshold — alert when stock drops to this or below
const LOW_STOCK_THRESHOLD = 3;

const JWT_SECRET = getEnv('JWT_SECRET', 'jwt_secret');

const logAudit = async (action, details, req) => {
  try {
    await AuditLog.create({
      action,
      details,
      adminEmail: req?.user?.email ?? 'system',
      ip:         getClientIp(req),
      timestamp:  new Date(),
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
// LOW STOCK EMAIL ALERT
// Fires after every sale. Checks if any purchased product is now
// low (< 5) or out of stock, and emails admin once per product.
// ─────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = getEnv('ADMIN_EMAIL', 'EMAIL_USER', 'email_user');


/**
 * Checks stock levels after checkout and sends a consolidated
 * email alert listing ALL low-stock items in one email.
 * Never throws — runs fire-and-forget.
 */
const checkAndAlertLowStock = async (purchasedItems) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || getEnv('EMAIL_USER');
    if (!adminEmail) return; // No admin email configured

    // Find which purchased items now have low stock
    const lowStockItems = [];

    await Promise.all(purchasedItems.map(async (item) => {
      const product = await Product.findOne(buildIdQuery(item.id)).select('name quantity id').lean();
      if (!product) return;

      const remaining = product.quantity ?? 0;
      if (remaining <= LOW_STOCK_THRESHOLD) {
        lowStockItems.push({
          name:      product.name,
          id:        product.id || item.id,
          remaining,
        });
      }
    }));

    if (!lowStockItems.length) return;

    // Sort: 0 stock first, then ascending
    lowStockItems.sort((a, b) => a.remaining - b.remaining);

    const subject = `⚠️ Low Stock Alert — ${lowStockItems.length} item${lowStockItems.length !== 1 ? 's' : ''} need restocking`;

    const itemRows = lowStockItems.map(item =>
      `  • ${item.name} (SKU: ${item.id}) — ${item.remaining === 0 ? '🔴 OUT OF STOCK' : `🟡 ${item.remaining} left`}`
    ).join('\n');

    const text = `
Stop & Shop — Low Stock Alert
==============================

The following items need restocking after a recent order:

${itemRows}

Restock these items in your Admin Panel:
https://stop-shop-gamma.vercel.app/admin/inventory

This is an automated message from your Stop & Shop store.
    `.trim();

    await sendEmail({
      to:      adminEmail,
      subject,
      text,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ba1f3d; padding: 20px 30px;">
            <h1 style="color: white; margin: 0; font-size: 18px; letter-spacing: 2px; text-transform: uppercase;">
              ⚠️ Low Stock Alert
            </h1>
          </div>
          <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb;">
            <p style="color: #374151; font-size: 14px; margin-top: 0;">
              The following items need restocking after a recent order:
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; border-bottom: 1px solid #e5e7eb;">Product</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; border-bottom: 1px solid #e5e7eb;">SKU</th>
                  <th style="padding: 10px 12px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; border-bottom: 1px solid #e5e7eb;">Stock Left</th>
                </tr>
              </thead>
              <tbody>
                ${lowStockItems.map(item => `
                  <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 12px; font-size: 13px; font-weight: bold; color: #111827;">${item.name}</td>
                    <td style="padding: 12px; font-size: 11px; color: #6b7280; font-family: monospace;">${item.id}</td>
                    <td style="padding: 12px; text-align: center;">
                      <span style="background: ${item.remaining === 0 ? '#fee2e2' : '#fef3c7'}; color: ${item.remaining === 0 ? '#dc2626' : '#d97706'}; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                        ${item.remaining === 0 ? 'OUT OF STOCK' : `${item.remaining} left`}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <a href="https://stop-shop-gamma.vercel.app/admin/inventory"
               style="display: inline-block; background: #ba1f3d; color: white; padding: 12px 24px; text-decoration: none; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 10px;">
              Restock Now →
            </a>
          </div>
          <div style="padding: 15px 30px; background: #f9fafb; text-align: center;">
            <p style="color: #9ca3af; font-size: 11px; margin: 0;">
              Stop &amp; Shop · Automated inventory alert
            </p>
          </div>
        </div>
      `,
    });

    console.log(`📧 Low stock alert sent for ${lowStockItems.length} item(s)`);
  } catch (err) {
    // Never let alert failure break checkout
    console.error('[LowStock] Alert failed:', err.message);
  }
};


// ─────────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE
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

const requireRole = (...allowed) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(403).json({ error: 'Access denied — role not found' });
  if (!allowed.includes(role)) {
    return res.status(403).json({
      error: `Access denied — requires one of: ${allowed.join(', ')}`,
    });
  }
  next();
};

// ─────────────────────────────────────────────────────────────────
// ██████  ██████████  ROUTES
// ─────────────────────────────────────────────────────────────────

// ── Auth ────────────────────────────────────────────────────────────

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

    const token      = jwt.sign({ id: admin._id, email: admin.email, role: admin.roles?.[0] ?? 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    const csrfToken  = jwt.sign({ type: 'csrf', userId: admin._id.toString() }, JWT_SECRET, { expiresIn: '1h' });

    const cookieOptions = { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax', path: '/' };
    res.cookie('auth_token',  token,     { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 })
       .cookie('csrf_token',  csrfToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 })
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

// Create admin user — super-admin only
app.post('/api/admin/users', authenticateToken, requireRole('super-admin'), async (req, res, next) => {
  try {
    const { name, email, password, roles } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
    const hashed = await bcrypt.hash(password, 12);
    const admin = await Admin.create({ name, email, password: hashed, roles: roles ?? ['admin'] });
    await logAudit('ADMIN_CREATE', { email: admin.email }, req);
    res.status(201).json({ id: admin._id, name: admin.name, email: admin.email, roles: admin.roles });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    next(err);
  }
});

// Delete admin user — super-admin only
app.delete('/api/admin/users/:id', authenticateToken, requireRole('super-admin'), async (req, res, next) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id).lean();
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    await logAudit('ADMIN_DELETE', { email: admin.email }, req);
    res.json({ message: 'Admin deleted' });
  } catch (err) { next(err); }
});

// ── Stats ────────────────────────────────────────────────────────────

app.get('/api/stats/revenue', authenticateToken, async (req, res, next) => {
  try {
    const data = await cacheService.getOrSet(CACHE_KEYS.STATS_REVENUE, async () => {
      const [result] = await Order.aggregate([
        { $match: { status: { $in: ['Pending', 'Processing', 'Shipped', 'Delivered'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
      ]);
      return { totalRevenue: result?.totalRevenue ?? 0, trend: 0 };
    });
    res.json(data);
  } catch (err) { next(err); }
});

app.get('/api/stats/orders', authenticateToken, async (req, res, next) => {
  try {
    const data = await cacheService.getOrSet(CACHE_KEYS.STATS_ORDERS, async () => {
      const counts = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
      const totalOrders = counts.reduce((acc, c) => acc + c.count, 0);
      const pendingOrders = counts.find(c => c._id === 'Pending')?.count ?? 0;
      return { totalOrders, pendingOrders, counts: counts.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {}) };
    });
    res.json(data);
  } catch (err) { next(err); }
});

app.get('/api/stats/inventory', authenticateToken, async (req, res, next) => {
  try {
    const data = await cacheService.getOrSet(CACHE_KEYS.STATS_INVENTORY, async () => {
      const total    = await Product.countDocuments();
      const lowStock = await Product.countDocuments({ stock: { $gt: 0, $lt: 5 } });
      const outStock = await Product.countDocuments({ stock: 0 });
      return { total, lowStock, outStock };
    });
    res.json(data);
  } catch (err) { next(err); }
});

// ── Orders ───────────────────────────────────────────────────────────

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

// ── Products (Admin) ──────────────────────────────────────────────────

app.get('/api/admin/products', authenticateToken, async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    const docs = products.map(p => ({
      ...p,
      id: p.id || p._id?.toString() || `GEN-${Math.random().toString(36).substr(2, 9)}`,
    }));
    res.json(docs);
  } catch (err) { next(err); }
});

app.post('/api/admin/products', authenticateToken, validateRequest(createProductSchema), async (req, res, next) => {
  try {
    const buildId = () => `PRD-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const productData = { ...req.body, id: req.body.id || buildId() };

    let product;
    try {
      product = await new Product(productData).save();
    } catch (saveErr) {
      if (saveErr?.code === 11000 && saveErr?.keyPattern?.id) {
        product = await new Product({ ...productData, id: buildId() }).save();
      } else {
        throw saveErr;
      }
    }

    // Sync to inventory (post-save hook fires, but also log as INITIAL)
    await syncInventory(product, 'INITIAL', 'Product created by admin');
    await logAudit('PRODUCT_CREATE', { id: product.id, name: product.name }, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    return res.status(201).json(product);
  } catch (err) { next(err); }
});

const buildIdQuery = (idParam) => {
  return mongoose.isValidObjectId(idParam)
    ? { $or: [{ id: idParam }, { _id: idParam }] }
    : { id: idParam };
};

app.patch('/api/admin/products/:id', authenticateToken, validateRequest(updateProductSchema), async (req, res, next) => {
  try {
    const updateData = { ...req.body };

    // Recalculate totals if sizeStock is being updated
    if (updateData.sizeStock && typeof updateData.sizeStock === 'object') {
      const total = Object.values(updateData.sizeStock)
        .reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
      updateData.quantity = total;
      updateData.stock    = total;
    }

    const product = await Product.findOneAndUpdate(
      buildIdQuery(req.params.id),
      updateData,
      { new: true }
    );
    if (!product) throw new NotFoundError('Product not found');

    // Determine movement type: if stock increased it's a restock, decreased = adjustment
    const prevProduct = await Inventory.findOne({ productId: req.params.id }).lean();
    const prevStock   = prevProduct?.totalStock ?? 0;
    const moveType    = product.quantity > prevStock ? 'RESTOCK' : 'ADMIN_UPDATE';

    await syncInventory(product, moveType, `Admin updated: ${Object.keys(req.body).join(', ')}`);
    await logAudit('PRODUCT_UPDATE', { id: req.params.id, changes: Object.keys(req.body) }, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    res.json(product);
  } catch (err) { next(err); }
});

app.delete('/api/admin/products/:id', authenticateToken, requireRole('admin', 'super-admin'), async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete(buildIdQuery(req.params.id));
    if (!product) throw new NotFoundError('Product not found');

    // Inventory cleanup is handled by the post('findOneAndDelete') hook on productSchema
    await logAudit('PRODUCT_DELETE', { id: req.params.id, name: product.name }, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);
    res.json({ message: 'Product removed' });
  } catch (err) { next(err); }
});

// ── Inventory (Admin) ──────────────────────────────────────────────────
//    Read-focused endpoint. Mutations happen via /api/admin/products routes
//    which auto-sync the inventory collection.

app.get('/api/admin/inventory', authenticateToken, async (req, res, next) => {
  try {
    const inventory = await Inventory
      .find()
      .sort({ updatedAt: -1 })
      .lean();

    res.json(inventory);
  } catch (err) { next(err); }
});

// Inventory summary — for charts / dashboard widgets
app.get('/api/admin/inventory/summary', authenticateToken, async (req, res, next) => {
  try {
    const [summary] = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalProducts:  { $sum: 1 },
          totalStock:     { $sum: '$totalStock' },
          inStock:        { $sum: { $cond: [{ $eq: ['$status', 'In Stock'] }, 1, 0] } },
          lowStock:       { $sum: { $cond: [{ $eq: ['$status', 'Low Stock'] }, 1, 0] } },
          outOfStock:     { $sum: { $cond: [{ $eq: ['$status', 'Out of Stock'] }, 1, 0] } },
        },
      },
    ]);

    // Category breakdown
    const byCategory = await Inventory.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$totalStock' } } },
      { $sort: { totalStock: -1 } },
    ]);

    res.json({ ...(summary ?? {}), byCategory });
  } catch (err) { next(err); }
});

// Single inventory entry (with full movement history)
app.get('/api/admin/inventory/:productId', authenticateToken, async (req, res, next) => {
  try {
    const entry = await Inventory.findOne({ productId: req.params.productId }).lean();
    if (!entry) throw new NotFoundError('Inventory entry not found');
    res.json(entry);
  } catch (err) { next(err); }
});

// ── Inventory Mutations (Admin) ──────────────────────────────────────────
//    Direct inventory management: restock or delete an inventory entry.
//    Both sync back to the Product document and log audit + movements.

// POST /api/admin/inventory/:productId/restock
//    Adds stock to a product. Accepts: { quantity, sizeStock?, note? }
//    Updates Product.quantity / Product.stock AND Inventory.totalStock / sizeStock.
app.post('/api/admin/inventory/:productId/restock', authenticateToken, async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity, sizeStock, note } = req.body;

    const product = await Product.findOne({ id: productId });
    if (!product) throw new NotFoundError('Product not found');

    const prevStock = product.quantity ?? 0;

    if (sizeStock && typeof sizeStock === 'object') {
      const updated = { ...product.sizeStock };
      for (const [size, qty] of Object.entries(sizeStock)) {
        const n = Math.max(0, parseInt(qty) || 0);
        updated[size] = (parseInt(updated[size]) || 0) + n;
      }
      product.sizeStock = updated;
      product.quantity = Object.values(updated).reduce((s, v) => s + Math.max(0, parseInt(v) || 0), 0);
      product.stock = product.quantity;
    } else if (typeof quantity === 'number' && quantity > 0) {
      product.quantity = prevStock + quantity;
      product.stock = product.quantity;
    } else {
      return res.status(400).json({ error: 'Provide either quantity (number) or sizeStock (object)' });
    }

    await product.save();

    await syncInventory(
      product,
      'RESTOCK',
      note || `Admin restocked ${product.quantity - prevStock} units`,
    );

    await logAudit('INVENTORY_RESTOCK', { productId, added: quantity ?? sizeStock, newTotal: product.quantity }, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    res.json({ message: 'Restock successful', product });
  } catch (err) { next(err); }
});

// DELETE /api/admin/inventory/:productId
//    Removes an inventory entry entirely AND deletes the product.
//    Logs an ADMIN_DELETE movement before removing.
app.delete('/api/admin/inventory/:productId', authenticateToken, requireRole('super-admin'), async (req, res, next) => {
  try {
    const { productId } = req.params;

    const entry = await Inventory.findOne({ productId });
    if (!entry) throw new NotFoundError('Inventory entry not found');

    await syncInventory({ id: productId, name: entry.name, quantity: 0, bucket: entry.category, subCategory: entry.subCategory, price: entry.price, image: entry.image, rating: entry.rating, colors: entry.colorVariants, sizes: entry.sizes, sizeStock: entry.sizeStock }, 'ADMIN_DELETE', 'Admin deleted inventory and product');

    const product = await Product.findOneAndDelete({ id: productId });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await logAudit('INVENTORY_DELETE', { productId, name: entry.name }, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    res.json({ message: 'Inventory and product deleted successfully' });
  } catch (err) { next(err); }
});

// ── Public Order Tracking ──────────────────────────────────────────────
//    No auth required. Rate limited to prevent order ID enumeration.

const trackingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: 'Too many tracking requests. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

app.get('/api/public/track/:orderID', trackingLimiter, async (req, res, next) => {
  try {
    const { orderID } = req.params;

    if (!orderID || !orderID.toUpperCase().startsWith('ORD-')) {
      return res.status(400).json({ error: 'Invalid order ID format. Must start with ORD-' });
    }

    const order = await Order
      .findOne({ orderID: orderID.toUpperCase() })
      .select('orderID customer items total paymentMethod status createdAt updatedAt')
      .lean();

    if (!order) {
      return res.status(404).json({ error: `Order ${orderID} not found` });
    }

    // Return sanitized order — email and IP deliberately omitted for privacy
    res.json({
      orderID:       order.orderID,
      status:        order.status,
      paymentMethod: order.paymentMethod,
      total:         order.total,
      createdAt:     order.createdAt,
      updatedAt:     order.updatedAt,
      customer: {
        name:    order.customer?.name    ?? '',
        address: order.customer?.address ?? '',
        city:    order.customer?.city    ?? '',
        zip:     order.customer?.zip     ?? '',
      },
      items: (order.items ?? []).map(item => ({
        id:            item.id,
        name:          item.name,
        price:         item.price,
        quantity:      item.quantity ?? 1,
        selectedSize:  item.selectedSize  ?? '',
        selectedColor: item.selectedColor ?? '',
        category:      item.category      ?? '',
        subCategory:   item.subCategory   ?? '',
      })),
    });

  } catch (err) { next(err); }
});

// ── Public Products ────────────────────────────────────────────────────

app.get('/api/public/products', async (req, res, next) => {
  try {
    const data = await cacheService.getOrSet(CACHE_KEYS.PUBLIC_PRODUCTS, async () => {
      const products = await Product.find().lean();
      return products.map(p => ({
        ...p,
        id:          p.id || p._id?.toString(),
        bucket:      p.bucket || 'General',
        subCategory: p.subCategory || 'General',
      }));
    });
    res.json(data);
  } catch (err) { next(err); }
});

// Single product by ID — for /product/:id page
app.get('/api/public/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne(buildIdQuery(id)).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({
      ...product,
      id: product.id || product._id?.toString(),
    });
  } catch (err) { next(err); }
});

// ── Checkout ──────────────────────────────────────────────────────────
//    1. Validates cart against live stock
//    2. Decrements product stock
//    3. Logs inventory movement (SALE) per product
//    4. Creates order with full product snapshot (color, category, subCategory)
//    5. Sends confirmation email (fire-and-forget)

app.post('/api/checkout', checkoutLimiter, validateRequest(checkoutSchema), async (req, res, next) => {
  try {
    const { customer, items, total, paymentMethod } = req.body;
    const clientIp   = getClientIp(req);
    const productIds = [...new Set(items.map(i => i.id))];

    // Fetch all products in one query
    const dbProducts = await Product.find({ id: { $in: productIds } });
    if (dbProducts.length !== productIds.length) {
      const missing = productIds.filter(id => !dbProducts.find(p => p.id === id));
      return res.status(400).json({ error: `Some products in your cart are no longer available: ${missing.join(', ')}` });
    }
    const productMap  = new Map(dbProducts.map(p => [p.id, p]));

    // ── Stock validation ───────────────────────────────────────
    for (const item of items) {
      const product  = productMap.get(item.id);
      if (!product)  return res.status(400).json({ error: `Product not found: ${item.id}` });

      const qty      = Math.max(1, parseInt(item.quantity) || 1);
      const size     = (item.selectedSize ?? '').trim();
      const available = size
        ? (product.sizeStock?.get?.(size) ?? product.sizeStock?.[size] ?? 0)
        : product.quantity;

      if (available < qty) {
        return res.status(400).json({
          error: `Not enough stock for ${product.name}${size ? ` (size ${size})` : ''}. Available: ${available}`,
        });
      }
    }

    // ── Generate order ID ──────────────────────────────────────
    const orderID = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // ── Decrement stock + sync inventory per product ───────────
    for (const item of items) {
      const qty    = Math.max(1, parseInt(item.quantity) || 1);
      const size   = (item.selectedSize ?? '').trim();
      const sizeKey = size ? `sizeStock.${size}` : null;

      const stockUpdate = sizeKey
        ? { $inc: { quantity: -qty, stock: -qty, [sizeKey]: -qty } }
        : { $inc: { quantity: -qty, stock: -qty } };

      // ATOMIC UPDATE: Only decrement if sufficient stock exists (prevention of overselling)
      const updatedProduct = await Product.findOneAndUpdate(
        { 
          id: item.id, 
          ...(sizeKey ? { [sizeKey]: { $gte: qty } } : { stock: { $gte: qty } }) 
        },
        stockUpdate,
        { new: true }
      );

      if (updatedProduct) {
        // Log inventory movement as SALE
        await syncInventory(
          updatedProduct,
          'SALE',
          `Sold ${qty}x ${updatedProduct.name}${size ? ` (${size})` : ''} via order ${orderID}`,
          orderID
        );
      }
    }

    // ── Build enriched order items (full snapshot) ─────────────
    // ALL fields — especially price — are sourced from the DB product document,
    // never trust the client-provided values. This prevents price manipulation.
    const enrichedItems = items.map(item => {
      const product = productMap.get(item.id);
      return {
        id:            item.id,
        name:          product?.name          || item.name          || '',
        price:         product?.price        ?? item.price         ?? 0,
        quantity:      Math.max(1, parseInt(item.quantity) || 1),
        selectedSize:  (item.selectedSize  ?? '').trim(),
        selectedColor: (item.selectedColor ?? '').trim(),
        category:      product?.bucket      || item.category    || '',
        subCategory:   product?.subCategory || item.subCategory || '',
      };
    });

    // ── Recalculate order total from DB prices ───────────────────
    // Guards against client-side total tampering.
    const verifiedTotal = enrichedItems.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
    const finalTotal = Math.max(0, verifiedTotal);

    // ── Create order (uses verified total) ────────────────────────
    await Order.create({ orderID, customer, items: enrichedItems, total: finalTotal, paymentMethod, ip: clientIp });

    // ── Increment coupon usage if one was applied ──────────────
    if (req.body.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: req.body.couponCode.trim().toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    // ── Invalidate caches ──────────────────────────────────────
    await cacheService.invalidateMany([
      CACHE_KEYS.STATS_REVENUE,
      CACHE_KEYS.STATS_ORDERS,
      CACHE_KEYS.STATS_INVENTORY,
      CACHE_KEYS.PUBLIC_PRODUCTS,
    ]);

    // ── Fire-and-forget: customer confirmation + low-stock alert ───
    sendEmail({
      from:    `"Stop & Shop" <${getEnv('EMAIL_USER', 'email_user')}>`,
      to:      customer.email,
      subject: `Order Confirmed — ${orderID}`,
      html:    `
        <h2>Thank you, ${customer.name}!</h2>
        <p>Your order <strong>${orderID}</strong> has been placed successfully.</p>
        <p><strong>Total:</strong> PKR ${finalTotal.toLocaleString()}</p>
        <p><strong>Payment:</strong> ${paymentMethod}</p>
        <p>Track your order: <a href="https://stop-shop-gamma.vercel.app/track?orderID=${orderID}">Click here</a></p>
        <p>Thank you for shopping with Stop & Shop.</p>
      `,
    });

    // Consolidated alert checks stock after sale and emails admin if needed
    checkAndAlertLowStock(items);

    res.status(201).json({ message: 'Order placed', orderID, verifiedTotal: finalTotal });
  } catch (err) { next(err); }
});

// ── Settings ──────────────────────────────────────────────────────────

app.get('/api/public/settings', async (_req, res, next) => {
  try {
    const data = await cacheService.getOrSet(CACHE_KEYS.SETTINGS, async () => {
      const s = await Settings.findOne().lean();
      return s ?? { announcement: 'Welcome to Stop & Shop', logo: '' };
    });
    res.json(data);
  } catch (err) { next(err); }
});

app.post('/api/settings', authenticateToken, requireRole('admin', 'super-admin'), validateRequest(updateSettingsSchema), async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true }).lean();
    await logAudit('SETTINGS_UPDATE', { changed: Object.keys(req.body) }, req);
    await cacheService.del(CACHE_KEYS.SETTINGS);
    res.json({ message: 'Settings updated', settings });
  } catch (err) { next(err); }
});

// ── Coupons (Public) ────────────────────────────────────────────────────
// Validate a coupon code — called from checkout form

app.post('/api/public/coupons/validate', validateRequest(couponValidationSchema), async (req, res, next) => {
  try {
    const { code, cartTotal, activeCouponCode } = req.body;
 
    // ── Discount stacking prevention ─────────────────────────────
    if (activeCouponCode && activeCouponCode !== code?.trim().toUpperCase()) {
      return res.status(400).json({
        error: `Coupon "${activeCouponCode}" is already applied. Remove it before adding another.`,
      });
    }
 
    if (!code?.trim()) return res.status(400).json({ error: 'Coupon code is required' });
 
    const coupon = await Coupon.findOne({
      code:     code.trim().toUpperCase(),
      isActive: true,
    }).lean();
 
    if (!coupon) return res.status(404).json({ error: 'Invalid or inactive coupon code' });
 
    // Expiry check
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'This coupon has expired' });
    }
 
    // Max uses check
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'This coupon has reached its usage limit' });
    }
 
    // Minimum order check
    const orderTotal = parseFloat(cartTotal) || 0;
    if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
      return res.status(400).json({
        error: `This coupon requires a minimum order of Rs. ${coupon.minOrderValue.toLocaleString('en-PK')}`,
      });
    }
 
    // Calculate discount
    let discount;
    if (coupon.type === 'percentage') {
      discount = Math.round((orderTotal * coupon.value) / 100);
    } else {
      discount = Math.min(coupon.value, orderTotal); // Can't discount more than the total
    }
 
    const finalTotal = Math.max(0, orderTotal - discount);
 
    res.json({
      code:       coupon.code,
      type:       coupon.type,
      value:      coupon.value,
      discount,
      finalTotal,
      message:    coupon.type === 'percentage'
        ? `${coupon.value}% discount applied — you save Rs. ${discount.toLocaleString('en-PK')}`
        : `Rs. ${discount.toLocaleString('en-PK')} discount applied`,
    });
  } catch (err) { next(err); }
});


// ── Coupons (Admin) ─────────────────────────────────────────────────────

app.get('/api/admin/coupons', authenticateToken, async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json(coupons);
  } catch (err) { next(err); }
});

app.post('/api/admin/coupons', authenticateToken, async (req, res, next) => {
  try {
    const { code, type, value, minOrderValue, maxUses, expiresAt } = req.body;
    if (!code || !value) return res.status(400).json({ error: 'Code and value are required' });

    const coupon = await Coupon.create({
      code:          code.trim().toUpperCase(),
      type:          type ?? 'percentage',
      value:         parseFloat(value),
      minOrderValue: parseFloat(minOrderValue) || 0,
      maxUses:       maxUses ? parseInt(maxUses) : null,
      expiresAt:     expiresAt ? new Date(expiresAt) : null,
      isActive:      true,
    });

    await logAudit('COUPON_CREATE', { code: coupon.code, type: coupon.type, value: coupon.value }, req);
    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Coupon code already exists' });
    next(err);
  }
});

app.patch('/api/admin/coupons/:id', authenticateToken, async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    await logAudit('COUPON_UPDATE', { id: req.params.id }, req);
    res.json(coupon);
  } catch (err) { next(err); }
});

app.delete('/api/admin/coupons/:id', authenticateToken, requireRole('admin', 'super-admin'), async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id).lean();
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    await logAudit('COUPON_DELETE', { code: coupon.code }, req);
    res.json({ message: 'Coupon deleted' });
  } catch (err) { next(err); }
});

// ── Reviews: Public ──────────────────────────────────────────────────────
//
// GET  /api/public/reviews/:productId  → approved reviews for ONE product
// GET  /api/public/reviews             → all approved reviews (store-wide)
// POST /api/public/reviews             → submit a new review (goes to pending)

app.get('/api/public/reviews/:productId', async (req, res, next) => {
  try {
    const reviews = await Review
      .find({ status: 'approved', productId: req.params.productId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(reviews);
  } catch (err) { next(err); }
});

app.get('/api/public/reviews', async (_req, res, next) => {
  try {
    const reviews = await Review
      .find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(reviews);
  } catch (err) { next(err); }
});

app.post('/api/public/reviews', validateRequest(reviewSchema), async (req, res, next) => {
  try {
    const { name, email, rating, title, body, productId } = req.body;

    // Verify product exists first
    if (productId) {
      const p = await Product.exists({ id: productId });
      if (!p) return res.status(404).json({ error: 'Referenced product not found' });
    }

    // Validate
    if (!name?.trim())               return res.status(400).json({ error: 'Name is required' });
    if (!email?.trim())              return res.status(400).json({ error: 'Email is required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                                     return res.status(400).json({ error: 'Enter a valid email address' });
    if (!title?.trim())              return res.status(400).json({ error: 'Review title is required' });
    if (!body?.trim())               return res.status(400).json({ error: 'Review text is required' });
    if (body.trim().length < 20)     return res.status(400).json({ error: 'Review must be at least 20 characters' });
    if (!rating || rating < 1 || rating > 5)
                                     return res.status(400).json({ error: 'Rating must be between 1 and 5' });

    const review = await Review.create({
      customerName:  name.trim(),
      customerEmail: email.trim().toLowerCase(),
      rating:        parseInt(rating),
      title:         title.trim(),
      body:          body.trim(),
      productId:     productId ?? '',
      status:        'pending',
    });

    res.status(201).json({
      message: 'Review submitted successfully. It will appear after moderation.',
      id:      review._id,
    });
  } catch (err) { next(err); }
});


// ── Reviews: Admin ──────────────────────────────────────────────────────
//
// GET    /api/admin/reviews      → all reviews (pending + approved + rejected)
// PATCH  /api/admin/reviews/:id  → change status (approve / reject / pending)
// DELETE /api/admin/reviews/:id  → delete permanently

app.get('/api/admin/reviews', authenticateToken, async (_req, res, next) => {
  try {
    const reviews = await Review
      .find()
      .sort({ createdAt: -1 })
      .lean();
    res.json(reviews);
  } catch (err) { next(err); }
});

app.patch('/api/admin/reviews/:id', authenticateToken, async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: pending, approved, or rejected' });
    }

    const review = await Review
      .findByIdAndUpdate(req.params.id, { status }, { new: true })
      .lean();

    if (!review) return res.status(404).json({ error: 'Review not found' });

    // Audit log (fire and forget — never throws)
    logAudit(`REVIEW_${status.toUpperCase()}`, { reviewId: req.params.id, status }, req).catch(() => {});

    res.json(review);
  } catch (err) { next(err); }
});

app.delete('/api/admin/reviews/:id', authenticateToken, async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id).lean();
    if (!review) return res.status(404).json({ error: 'Review not found' });

    logAudit('REVIEW_DELETE', { reviewId: req.params.id }, req).catch(() => {});

    res.json({ message: 'Review deleted successfully' });
  } catch (err) { next(err); }
});
const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET || 'customer_secret_change_in_prod';
 
// Middleware to authenticate customer JWT
const authenticateCustomer = (req, res, next) => {
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
 
// ── Customer: Register ────────────────────────────────────────────────────
app.post('/api/customer/register', async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
 
    if (!name?.trim() || name.trim().length < 2)
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Enter a valid email address' });
    if (!password || password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
 
    const exists = await Customer.findOne({ email: email.toLowerCase().trim() }).lean();
    if (exists) return res.status(409).json({ error: 'An account with this email already exists' });
 
    const hashed  = await bcrypt.hash(password, 12);
    const customer = await Customer.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: hashed,
      phone:    phone?.trim() ?? '',
    });
 
    const token = jwt.sign(
      { id: customer._id, email: customer.email, type: 'customer' },
      CUSTOMER_JWT_SECRET,
      { expiresIn: '30d' }
    );
 
    const { password: _, ...safe } = customer.toObject();
    res.status(201).json({ token, customer: safe });
  } catch (err) { next(err); }
});
 
// ── Customer: Login ───────────────────────────────────────────────────────
app.post('/api/customer/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });
 
    const customer = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (!customer)
      return res.status(401).json({ error: 'No account found with this email' });
 
    const valid = await bcrypt.compare(password, customer.password);
    if (!valid)
      return res.status(401).json({ error: 'Incorrect password' });
 
    const token = jwt.sign(
      { id: customer._id, email: customer.email, type: 'customer' },
      CUSTOMER_JWT_SECRET,
      { expiresIn: '30d' }
    );
 
    const { password: _, ...safe } = customer.toObject();
    res.json({ token, customer: safe });
  } catch (err) { next(err); }
});
 
// ── Customer: Get Profile ─────────────────────────────────────────────────
app.get('/api/customer/profile', authenticateCustomer, async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customer.id).select('-password').lean();
    if (!customer) return res.status(404).json({ error: 'Account not found' });
    res.json(customer);
  } catch (err) { next(err); }
});
 
// ── Customer: Update Profile ──────────────────────────────────────────────
app.patch('/api/customer/profile', authenticateCustomer, async (req, res, next) => {
  try {
    const { name, phone, address, city, zip } = req.body;
 
    const updates = {};
    if (name?.trim()    && name.trim().length >= 2)  updates.name    = name.trim();
    if (phone !== undefined)  updates.phone   = phone?.trim() ?? '';
    if (address !== undefined) updates.address = address?.trim() ?? '';
    if (city !== undefined)   updates.city    = city?.trim() ?? '';
    if (zip !== undefined)    updates.zip     = zip?.trim() ?? '';
 
    const customer = await Customer
      .findByIdAndUpdate(req.customer.id, updates, { new: true })
      .select('-password')
      .lean();
 
    if (!customer) return res.status(404).json({ error: 'Account not found' });
    res.json(customer);
  } catch (err) { next(err); }
});
 
// ── Customer: Order History ───────────────────────────────────────────────
// Matches orders by the customer's email address
app.get('/api/customer/orders', authenticateCustomer, async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customer.id).select('email').lean();
    if (!customer) return res.status(404).json({ error: 'Account not found' });
 
    const orders = await Order
      .find({ 'customer.email': customer.email })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
 
    res.json(orders);
  } catch (err) { next(err); }
});



// ── Analytics ─────────────────────────────────────────────────────────────

// Real MongoDB aggregations powering the Analytics dashboard

app.get('/api/admin/analytics', authenticateToken, async (_req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const yesterday     = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Run all aggregations in parallel
    const [
      revenueResult,
      revenueYesterday,
      ordersResult,
      ordersYesterday,
      productCount,
      outOfStockCount,
      revenueOverTime,
      revenueByCategory,
      paymentMethods,
      bestSellers,
      ordersByStatusArr,
    ] = await Promise.all([

      // Total revenue (non-cancelled)
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),

      // Yesterday's revenue for trend
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: yesterday } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // Order counts
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Yesterday order count for trend
      Order.countDocuments({ createdAt: { $gte: yesterday } }),

      // Product count
      Product.countDocuments(),

      // Out of stock
      Product.countDocuments({ quantity: 0 }),

      // Revenue over last 30 days (grouped by day)
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%m/%d', date: '$createdAt' }
            },
            revenue: { $sum: '$total' },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', revenue: 1, orders: 1, _id: 0 } },
      ]),

      // Revenue by product category (from order items)
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.category',
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            units:   { $sum: '$items.quantity' },
          },
        },
        { $match: { _id: { $ne: null, $ne: '' } } },
        { $sort: { revenue: -1 } },
        { $project: { category: '$_id', revenue: 1, units: 1, _id: 0 } },
        { $limit: 8 },
      ]),

      // Payment method breakdown
      Order.aggregate([
        { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { method: '$_id', count: 1, _id: 0 } },
      ]),

      // Best sellers (by units sold)
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id:      '$items.id',
            name:     { $first: '$items.name' },
            category: { $first: '$items.category' },
            unitsSold:{ $sum: '$items.quantity' },
            revenue:  { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 10 },
        { $project: { productId: '$_id', name: 1, category: 1, unitsSold: 1, revenue: 1, _id: 0 } },
      ]),

      // Orders by status
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Compute derived values
    const totalRevenue    = revenueResult[0]?.total  ?? 0;
    const totalOrders     = revenueResult[0]?.count  ?? 0;
    const avgOrderValue   = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const pendingOrders   = ordersResult.find(o => o._id === 'Pending')?.count ?? 0;
    const yesterdayRev    = revenueYesterday[0]?.total ?? 0;
    const revenueTrend    = yesterdayRev > 0 ? ((totalRevenue - yesterdayRev) / yesterdayRev) * 100 : 0;
    const ordersByStatus  = ordersByStatusArr.reduce((acc, o) => ({ ...acc, [o._id]: o.count }), {});

    res.json({
      // KPIs
      totalRevenue,
      totalOrders,
      avgOrderValue,
      pendingOrders,
      revenueTrend,
      ordersTrend: ordersYesterday,
      totalProducts: productCount,
      outOfStock:    outOfStockCount,

      // Charts
      revenueOverTime,
      revenueByCategory,
      paymentMethods,
      bestSellers,
      ordersByStatus,
    });

  } catch (err) { next(err); }
});

// ── Audit Logs ─────────────────────────────────────────────────────────

app.get('/api/admin/audits', authenticateToken, async (_req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100).lean();
    res.json({ logs, total: logs.length });
  } catch (err) { next(err); }
});

// ── Newsletter ─────────────────────────────────────────────────────────

app.post('/api/newsletter', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    await Subscriber.findOneAndUpdate({ email }, { email }, { upsert: true });
    res.json({ message: 'Subscribed successfully' });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// STATIC FILES & SPA FALLBACK
// ─────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const distPath   = path.resolve(__dirname, './dist');

if (fs.existsSync(distPath)) {
  console.log('✅ Serving static assets from /dist');
  app.use(express.static(distPath, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  }));
} else {
  console.warn('⚠️ /dist not found — frontend not built yet.');
}

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));

app.get('*', (req, res) => {
  const index = path.join(distPath, 'index.html');
  if (fs.existsSync(index)) {
    res.sendFile(index);
  } else if (!req.path.startsWith('/api')) {
    res.status(200).json({ message: 'API running — Frontend not built', path: req.path });
  }
});

// ─────────────────────────────────────────────────────────────────
// CENTRALIZED ERROR HANDLER
// ─────────────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  const code = err.statusCode ?? 500;
  if (code >= 500) console.error('[ERROR]', err.message, err.stack);
  res.status(code).json({ 
    status:  code < 500 ? 'fail' : 'error', 
    message: process.env.NODE_ENV === 'production' && code >= 500 
               ? 'An internal error occurred' 
               : err.message 
  });
});

// ─────────────────────────────────────────────────────────────────
// SERVER STARTUP
// ─────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '5000', 10);
let server;

if (!process.env.VERCEL) {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

// MongoDB
const mongoUri = getEnv('MONGO_URI', 'MONGODB_URI');
if (mongoUri) {
  mongoose.connect(mongoUri, { dbName: 'stopshop', maxPoolSize: 10, socketTimeoutMS: 45000, family: 4 })
    .then(async () => {
      console.log('✅ MongoDB connected (db: stopshop)');
      // Seed the CARDINAL20 coupon promised in the newsletter if it doesn't exist yet
      const exists = await Coupon.findOne({ code: 'CARDINAL20' }).lean();
      if (!exists) {
        await Coupon.create({
          code: 'CARDINAL20', type: 'percentage', value: 20,
          minOrderValue: 0, maxUses: null, isActive: true, expiresAt: null,
        });
        console.log('✅ CARDINAL20 coupon seeded (20% off)');
      }
    })
    .catch(err => console.error('❌ MongoDB error:', err.message));
}

// Graceful shutdown
const shutdown = async (sig) => {
  console.log(`[Shutdown] ${sig}`);
  if (server?.close) {
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
process.on('SIGINT',  () => shutdown('SIGINT'));

export default app;