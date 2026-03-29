import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { cacheService, CACHE_KEYS } from './src/services/cacheService.js';
import { sanitizeInput } from './src/middleware/security.js';
import { validateRequest, loginSchema, createProductSchema, updateProductSchema, createAdminSchema, updateOrderStatusSchema, checkoutSchema, updateSettingsSchema } from './src/schemas/validation.js';

dotenv.config();

// ─────────────────────────────────────────────────────────────────
// CUSTOM ERROR CLASSES
// ─────────────────────────────────────────────────────────────────
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message) {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message) {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message) {
    super(message, 429);
  }
}

// ─────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLING MIDDLEWARE
// ─────────────────────────────────────────────────────────────────
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  
  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      console.error("ERROR 💥", err);
      res.status(500).json({
        status: "error",
        message: "Something went very wrong!"
      });
    }
  }
};

// ─────────────────────────────────────────────────────────────────
// APP SETUP
// ─────────────────────────────────────────────────────────────────
const app = express();

// TEST ROUTE AT BEGINNING
app.get('/api/test', (req, res) => {
  console.log('TEST ROUTE AT BEGINNING HIT!');
  res.json({ test: true, message: 'Test route at beginning works' });
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression());

// Request logging
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// Body parsing with size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// CORS
const allowedFromEnv = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const defaultAllowed = [
  'http://localhost:5173', 'http://localhost:3000',
  'https://stop-shop-gamma.vercel.app'
];
const allowedOrigins = [...new Set([...defaultAllowed, ...allowedFromEnv])];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

app.use(cookieParser());
app.use(sanitizeInput);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

const getEnv = (...keys) => {
  for (const key of keys) {
    if (process.env[key]) return process.env[key];
  }
  return undefined;
};

// ─────────────────────────────────────────────────────────────────
// DATABASE CONNECTION
// ─────────────────────────────────────────────────────────────────
const mongoUri = getEnv('MONGO_URI', 'MONGODB_URI');
if (!mongoUri) {
  console.error('❌ Missing MongoDB env var (MONGO_URI or MONGODB_URI)');
  process.exit(1);
}

mongoose.connect(mongoUri, {
  maxPoolSize: 10,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  family: 4
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ─────────────────────────────────────────────────────────────────
// SCHEMAS & MODELS
// ─────────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  orderID: { type: String, unique: true },
  customer: {
    name: String,
    email: String,
    address: String,
    city: String,
    zip: String,
  },
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    selectedSize: String
  }],
  total: Number,
  paymentMethod: String,
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  createdAt: { type: Date, default: Date.now }
});
orderSchema.index({ status: 1, createdAt: -1 });
const Order = mongoose.model('Order', orderSchema);

const productSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  price: Number,
  quantity: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  image: String,
  mediaType: { type: String, enum: ['upload', 'url', 'embed'], default: 'upload' },
  embedCode: { type: String, default: '' },
  rating: { type: Number, default: 5 },
  bucket: { type: String, default: 'Tops' },
  subCategory: { type: String, default: 'General' },
  specs: [{ type: String }],
  colors: [{ type: String }],
  sizes: [{ type: String }],
  sizeStock: { type: Map, of: Number, default: {} },
  lifestyleImage: { type: String, default: '' },
  variantImages: { type: Map, of: String, default: {} },
  gallery: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
}, { indexes: false });
productSchema.index({ bucket: 1, createdAt: -1 });

productSchema.pre('save', function() {
  const mapValues = this.sizeStock instanceof Map
    ? [...this.sizeStock.values()]
    : Object.values(this.sizeStock || {});
  const hasSizeStock = mapValues.length > 0;
  if (hasSizeStock) {
    const totalFromSizes = mapValues.reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
    this.quantity = totalFromSizes;
    this.stock = totalFromSizes;
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
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isPrimary: { type: Boolean, default: false },
  roles: { type: [String], enum: ['admin', 'super-admin', 'auditor'], default: ['admin'] },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  lastLogin: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});
const Admin = mongoose.model('Admin', adminSchema);

const settingsSchema = new mongoose.Schema({
  logo: { type: String, default: '' },
  announcement: { type: String, default: 'Welcome to Stop & Shop — Premium Clothing' },
  updatedAt: { type: Date, default: Date.now }
});
const Settings = mongoose.model('Settings', settingsSchema);

// ─────────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const cookies = req.cookies || {};
  let token = cookies.auth_token;
  
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }
  
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  
  jwt.verify(token, getEnv('JWT_SECRET', 'jwt_secret'), (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const csrfValidation = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const cookies = req.cookies || {};
  const csrfFromCookie = cookies.csrf_token;
  const csrfFromHeader = req.headers['x-csrf-token'];
  
  if (!csrfFromCookie && !csrfFromHeader) {
    return res.status(403).json({ error: 'CSRF token required' });
  }
  
  const csrfToken = csrfFromHeader || csrfFromCookie;
  
  try {
    const decoded = jwt.verify(csrfToken, getEnv('JWT_SECRET', 'jwt_secret'));
    if (decoded.type !== 'csrf') {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    if (decoded.userId !== req.user?.id) {
      return res.status(403).json({ error: 'CSRF token mismatch' });
    }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired CSRF token' });
  }
};

// ─────────────────────────────────────────────────────────────────
// RATE LIMITING
// ─────────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ─────────────────────────────────────────────────────────────────
// NODEMAILER
// ─────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: getEnv('EMAIL_USER', 'email_user'),
    pass: getEnv('EMAIL_PASS', 'email_pass')
  }
});

// ─────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbStatus[dbState] || 'unknown',
    cache: cacheService.getInMemoryStats(),
    uptime: process.uptime()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ test: true, message: 'Test route works' });
});

// ─────────────────────────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────────────────────────
app.post('/api/admin/login', validateRequest(loginSchema), authLimiter, async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (admin.lockUntil && admin.lockUntil > new Date()) {
      const lockRemaining = Math.ceil((admin.lockUntil - new Date()) / 60000);
      return res.status(423).json({ 
        error: `Account locked. Try again in ${lockRemaining} minutes.` 
      });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      await Admin.findByIdAndUpdate(admin._id, {
        $inc: { failedLoginAttempts: 1 }
      });
      
      if (admin.failedLoginAttempts >= 4) {
        await Admin.findByIdAndUpdate(admin._id, {
          lockUntil: new Date(Date.now() + 15 * 60 * 1000)
        });
        return res.status(423).json({ 
          error: 'Too many failed attempts. Account locked for 15 minutes.' 
        });
      }
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (admin.failedLoginAttempts > 0 || admin.lockUntil) {
      await Admin.findByIdAndUpdate(admin._id, {
        failedLoginAttempts: 0,
        lockUntil: null,
        lastLogin: new Date()
      });
    } else {
      await Admin.findByIdAndUpdate(admin._id, { lastLogin: new Date() });
    }
    
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.roles?.[0] || 'admin' },
      getEnv('JWT_SECRET', 'jwt_secret'),
      { expiresIn: '8h' }
    );

    const csrfToken = jwt.sign(
      { type: 'csrf', userId: admin._id },
      getEnv('JWT_SECRET', 'jwt_secret'),
      { expiresIn: '1h' }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/'
    });

    res.cookie('csrf_token', csrfToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 60 * 60 * 1000,
      path: '/'
    });

    res.json({ name: admin.name, success: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// ORDER ROUTES
// ─────────────────────────────────────────────────────────────────
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.patch('/api/orders/:id', authenticateToken, validateRequest(updateOrderStatusSchema), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await Promise.all([
      cacheService.del(CACHE_KEYS.STATS_REVENUE),
      cacheService.del(CACHE_KEYS.STATS_ORDERS)
    ]);
    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ─────────────────────────────────────────────────────────────────
// PRODUCT ROUTES
// ─────────────────────────────────────────────────────────────────
app.get('/api/admin/products', authenticateToken, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/admin/products', authenticateToken, validateRequest(createProductSchema), async (req, res) => {
  try {
    const productData = req.body;
    const buildId = () => 'PRD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    if (!productData.id) productData.id = buildId();
    try {
      const product = new Product(productData);
      await product.save();
      await Promise.all([
        cacheService.del(CACHE_KEYS.STATS_INVENTORY),
        cacheService.del(CACHE_KEYS.PRODUCTS),
        cacheService.del(CACHE_KEYS.PUBLIC_PRODUCTS)
      ]);
      return res.status(201).json(product);
    } catch (saveError) {
      if (saveError?.code === 11000 && saveError?.keyPattern?.id) {
        const retryData = { ...productData, id: buildId() };
        const retryProduct = new Product(retryData);
        await retryProduct.save();
        await Promise.all([
          cacheService.del(CACHE_KEYS.STATS_INVENTORY),
          cacheService.del(CACHE_KEYS.PRODUCTS),
          cacheService.del(CACHE_KEYS.PUBLIC_PRODUCTS)
        ]);
        return res.status(201).json(retryProduct);
      }
      throw saveError;
    }
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error?.message || 'Failed to create product' });
  }
});

app.patch('/api/admin/products/:id', authenticateToken, validateRequest(updateProductSchema), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.sizeStock && typeof updateData.sizeStock === 'object') {
      const totalFromSizes = Object.values(updateData.sizeStock)
        .reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
      updateData.quantity = totalFromSizes;
      updateData.stock = totalFromSizes;
    }
    if (updateData.quantity !== undefined && updateData.stock === undefined) {
      updateData.stock = updateData.quantity;
    } else if (updateData.stock !== undefined && updateData.quantity === undefined) {
      updateData.quantity = updateData.stock;
    }

    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await Promise.all([
      cacheService.del(CACHE_KEYS.STATS_INVENTORY),
      cacheService.del(CACHE_KEYS.PRODUCTS),
      cacheService.del(CACHE_KEYS.PUBLIC_PRODUCTS)
    ]);
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/admin/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await Promise.all([
      cacheService.del(CACHE_KEYS.STATS_INVENTORY),
      cacheService.del(CACHE_KEYS.PRODUCTS),
      cacheService.del(CACHE_KEYS.PUBLIC_PRODUCTS)
    ]);
    res.json({ message: 'Product removed from system' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ─────────────────────────────────────────────────────────────────
// PUBLIC PRODUCT ROUTE
// ─────────────────────────────────────────────────────────────────
app.get('/api/public/products', async (req, res) => {
  try {
    const cached = await cacheService.get(CACHE_KEYS.PUBLIC_PRODUCTS);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    const products = await Product.find();
    await cacheService.set(CACHE_KEYS.PUBLIC_PRODUCTS, products);
    res.json(products);
  } catch (error) {
    console.error('Fetch public products error:', error);
    res.status(500).json({ error: 'Failed to fetch public products' });
  }
});

// ─────────────────────────────────────────────────────────────────
// PUBLIC PRODUCT SCHEMA.ORG (for AI/SEO)
// ─────────────────────────────────────────────────────────────────
app.get('/api/schema/products', (req, res) => {
  Product.find().then(products => {
    const baseUrl = 'https://stop-shop-gamma.vercel.app';
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'itemListElement': products.map((product, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'item': {
          '@type': 'Product',
          'name': product.name,
          'description': `${product.name} - ${product.subCategory || 'Premium clothing'}`,
          'image': product.image,
          'url': `${baseUrl}/shop`,
          'brand': { '@type': 'Brand', 'name': 'Stop & Shop' },
          'offers': {
            '@type': 'Offer',
            'price': product.price,
            'priceCurrency': 'PKR',
            'availability': product.quantity > 0 
              ? 'https://schema.org/InStock' 
              : 'https://schema.org/OutOfStock'
          }
        }
      }))
    };
    res.json(schema);
  }).catch(error => {
    console.error('Schema endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch products schema' });
  });
});

// ─────────────────────────────────────────────────────────────────
// STATS ROUTES (with caching)
// ─────────────────────────────────────────────────────────────────
app.get(['/api/stats/revenue', '/api/admin/stats/revenue'], authenticateToken, async (req, res) => {
  const cached = await cacheService.get(CACHE_KEYS.STATS_REVENUE);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }
  
  try {
    const orders = await Order.find({ status: { $ne: 'Cancelled' } });
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    const todayRevenue = orders
      .filter(o => new Date(o.createdAt) >= startOfToday)
      .reduce((sum, o) => sum + (o.total || 0), 0);
      
    const yesterdayRevenue = orders
      .filter(o => {
        const d = new Date(o.createdAt);
        return d >= startOfYesterday && d < startOfToday;
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);
      
    let trend = 0;
    if (yesterdayRevenue > 0) {
      trend = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    } else if (todayRevenue > 0) {
      trend = 100;
    }
    
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(startOfToday);
      targetDate.setDate(targetDate.getDate() - i);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d >= targetDate && d < nextDate;
      });
      
      const dayRev = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      
      weeklyData.push({
        day: targetDate.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayRev,
        orders: dayOrders.length
      });
    }

    const result = { totalRevenue, trend, weeklyData };
    await cacheService.set(CACHE_KEYS.STATS_REVENUE, result);
    res.json(result);
  } catch (error) {
    console.error('Revenue stats error:', error);
    res.status(500).json({ error: 'Failed to calculate revenue' });
  }
});

app.get(['/api/stats/orders', '/api/admin/stats/orders'], authenticateToken, async (req, res) => {
  const cached = await cacheService.get(CACHE_KEYS.STATS_ORDERS);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }
  
  try {
    const totalOrders = await Order.countDocuments({ status: { $ne: 'Cancelled' } });
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const result = { totalOrders, pendingOrders };
    await cacheService.set(CACHE_KEYS.STATS_ORDERS, result);
    res.json(result);
  } catch (error) {
    console.error('Order stats error:', error);
    res.status(500).json({ error: 'Failed to fetch order stats' });
  }
});

app.get(['/api/stats/inventory', '/api/admin/stats/inventory'], authenticateToken, async (req, res) => {
  const cached = await cacheService.get(CACHE_KEYS.STATS_INVENTORY);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }
  
  try {
    const products = await Product.find();
    const totalProducts = products.length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    const lowStock = products.filter(p => p.quantity < 5 && p.quantity > 0).length;
    const result = { totalProducts, outOfStock, lowStock, products };
    await cacheService.set(CACHE_KEYS.STATS_INVENTORY, result);
    res.json(result);
  } catch (error) {
    console.error('Inventory stats error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory stats' });
  }
});

// ─────────────────────────────────────────────────────────────────
// SETTINGS ROUTES
// ─────────────────────────────────────────────────────────────────
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    console.error('Fetch settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', authenticateToken, validateRequest(updateSettingsSchema), async (req, res) => {
  try {
    const { logo, announcement } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ logo, announcement });
    } else {
      if (logo !== undefined) settings.logo = logo;
      if (announcement !== undefined) settings.announcement = announcement;
      settings.updatedAt = Date.now();
    }
    await settings.save();
    res.json({ message: 'Store identity updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.get('/api/public/settings', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings || { announcement: 'Welcome to Stop & Shop', logo: '' });
  } catch (error) {
    console.error('Fetch public settings error:', error);
    res.status(500).json({ error: 'Failed to fetch public settings' });
  }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN USER MANAGEMENT ROUTES
// ─────────────────────────────────────────────────────────────────
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (error) {
    console.error('Fetch admins error:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

app.post('/api/admin/users', authenticateToken, validateRequest(createAdminSchema), async (req, res) => {
  try {
    const { name, email, password, roles } = req.body;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ error: 'Email already in use' });
    const hashedPassword = await bcrypt.hash(password, 12);
    const newAdmin = new Admin({ name, email, password: hashedPassword, roles: roles || ['admin'] });
    await newAdmin.save();
    res.status(201).json({ message: 'Admin account created successfully' });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    const adminToDelete = await Admin.findById(req.params.id);
    if (!adminToDelete) return res.status(404).json({ error: 'Admin not found' });
    if (adminToDelete.isPrimary) return res.status(403).json({ error: 'Primary owner cannot be removed' });
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: 'Access revoked successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// ─────────────────────────────────────────────────────────────────
// PUBLIC CHECKOUT ROUTE
// ─────────────────────────────────────────────────────────────────
app.post('/api/checkout', validateRequest(checkoutSchema), async (req, res) => {
  try {
    const { customer, items, total, paymentMethod } = req.body;

    const precheckProducts = await Product.find({ id: { $in: items.map(i => i.id) } });
    const byId = new Map(precheckProducts.map(p => [p.id, p]));
    for (const item of items) {
      const orderedQty = Math.max(1, parseInt(item.quantity) || 1);
      const product = byId.get(item.id);
      if (!product) return res.status(400).json({ error: `Product not found: ${item.id}` });
      const size = (item.selectedSize || '').trim();
      
      if (size && (!product.sizes || !product.sizes.includes(size))) {
        return res.status(400).json({ error: `Invalid size ${size} for product ${product.name}` });
      }
      
      if (size && product.sizeStock && product.sizeStock.get(size) !== undefined) {
        const available = Math.max(0, parseInt(product.sizeStock.get(size)) || 0);
        if (available < orderedQty) return res.status(400).json({ error: `Insufficient stock for ${product.name} (${size})` });
      } else if ((product.quantity || 0) < orderedQty) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
    }

    const orderID = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const lowStockItems = [];
    for (const item of items) {
      const orderedQty = Math.max(1, parseInt(item.quantity) || 1);
      const size = (item.selectedSize || '').trim();
      const baseProduct = byId.get(item.id);
      let product;
      if (size && baseProduct?.sizeStock && baseProduct.sizeStock.get(size) !== undefined) {
        const sizePath = `sizeStock.${size}`;
        product = await Product.findOneAndUpdate(
          { id: item.id, [sizePath]: { $gte: orderedQty } },
          { $inc: { quantity: -orderedQty, stock: -orderedQty, [sizePath]: -orderedQty } },
          { new: true }
        );
      } else {
        product = await Product.findOneAndUpdate(
          { id: item.id, quantity: { $gte: orderedQty } },
          { $inc: { quantity: -orderedQty, stock: -orderedQty } },
          { new: true }
        );
      }
      if (!product) return res.status(400).json({ error: `Unable to reserve stock for ${item.name}` });
      if (product && product.quantity < 5) lowStockItems.push(product);
    }

    const newOrder = new Order({ orderID, customer, items, total, paymentMethod });
    await newOrder.save();

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">${item.name}</td>
        <td style="padding:8px;border:1px solid #ddd">${item.quantity || 1}</td>
        <td style="padding:8px;border:1px solid #ddd">Rs. ${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    const mainMailOptions = {
      from: getEnv('EMAIL_USER', 'email_user'),
      to: getEnv('admin_email', 'admin_email', 'EMAIL_USER', 'email_user'),
      subject: `New Order: ${orderID}`,
      html: `
        <h2 style="color:#F63049">New Order Summary</h2>
        <p><strong>Order ID:</strong> ${orderID}</p>
        <p><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
        <p><strong>Address:</strong> ${customer.address}, ${customer.city}, ${customer.zip}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:20px">
          <thead>
            <tr style="background:#f2f2f2">
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Name</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Qty</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">Total:</td>
              <td style="padding:8px;border:1px solid #ddd;font-weight:bold">Rs. ${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      `
    };

    transporter.sendMail(mainMailOptions).catch(err => console.error('Email error:', err));

    if (lowStockItems.length > 0) {
      const lowStockHtml = lowStockItems.map(p => `<li>${p.name} — Remaining: <b>${p.quantity}</b></li>`).join('');
      const alertMailOptions = {
        from: getEnv('EMAIL_USER', 'email_user'),
        to: getEnv('ADMIN_EMAIL', 'admin_email', 'EMAIL_USER', 'email_user'),
        subject: `⚠️ LOW STOCK ALERT: ${lowStockItems.length} Items`,
        html: `<h2>Inventory Alert</h2><p>Low stock after Order <b>${orderID}</b>:</p><ul>${lowStockHtml}</ul>`
      };
      transporter.sendMail(alertMailOptions).catch(err => console.error('Stock alert email error:', err));
    }

    await Promise.all([
      cacheService.del(CACHE_KEYS.STATS_REVENUE),
      cacheService.del(CACHE_KEYS.STATS_ORDERS),
      cacheService.del(CACHE_KEYS.STATS_INVENTORY),
      cacheService.del(CACHE_KEYS.PUBLIC_PRODUCTS)
    ]);

    res.status(201).json({ message: 'Order placed successfully', orderID });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// SERVE STATIC FILES
// ─────────────────────────────────────────────────────────────────
// TEMPORARILY DISABLED: app.use(express.static(distPath));

// SPA catch-all - must be last (only for non-API routes)
app.use((req, res, next) => {
  console.log(`SPA check: ${req.path}`);
  if (req.path.startsWith('/api')) {
    console.log('Skipping SPA, passing to next');
    return next();
  }
  res.sendFile(path.join(distPath, "index.html"));
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  console.log(`API 404: ${req.path}`);
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

// Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    } catch (err) {
      console.error('Error closing MongoDB:', err);
    }
    
    try {
      await cacheService.close();
      console.log('Redis connection closed');
    } catch (err) {
      console.error('Error closing Redis:', err);
    }
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
