import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

import { cacheService, CACHE_KEYS } from '../services/cacheService.js';
import { getClientIp } from '../middleware/security.js';
import logger from '../utils/logger.js';
import {
  validateRequest,
  loginSchema,
  createProductSchema,
  updateProductSchema,
  updateOrderStatusSchema,
  updateSettingsSchema,
} from '../schemas/validation.js';

import {
  authenticateToken,
  requireRole,
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  JWT_SECRET,
} from '../middleware/auth.js';

import { authLimiter } from '../middleware/rateLimiters.js';
import { syncInventory } from '../services/inventoryService.js';
import { sendEmail, sendOrderStatusEmail } from '../services/emailService.js';

// Models
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';
import Admin from '../models/Admin.js';
import Settings from '../models/Settings.js';
import AuditLog from '../models/AuditLog.js';
import Coupon from '../models/Coupon.js';
import Review from '../models/Review.js';

const router = express.Router();
const isProduction = process.env.NODE_ENV === 'production';

// Cloudinary & Multer configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Helpers
const buildIdQuery = (idParam) => {
  return mongoose.isValidObjectId(idParam)
    ? { $or: [{ id: idParam }, { _id: idParam }] }
    : { id: idParam };
};

const logAudit = async (action, details, req) => {
  const adminEmail = req?.user?.email ?? 'system';
  const ip = getClientIp(req);
  try {
    await AuditLog.create({
      action,
      details,
      adminEmail,
      ip,
      timestamp:  new Date(),
    });
    logger.info(`[Audit Log] ${action} by ${adminEmail}`, {
      security: true,
      ip,
      action,
      details,
      email: adminEmail,
    });
  } catch (err) {
    logger.error(`[Audit] Failed to log audit event: ${err.message}`, {
      action,
      details,
      email: adminEmail,
      ip,
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// ADMIN AUTHENTICATION
// ─────────────────────────────────────────────────────────────────

router.post('/admin/login', authLimiter, validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      logger.warn('Admin login failed: Account not found', {
        security: true,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
        email,
      });
      throw new AuthenticationError('Invalid credentials');
    }

    if (admin.lockUntil && admin.lockUntil > new Date()) {
      const minutes = Math.ceil((admin.lockUntil - Date.now()) / 60_000);
      logger.warn('Admin login failed: Account is locked', {
        security: true,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
        email,
        lockRemainingMinutes: minutes,
      });
      return res.status(423).json({ error: `Account locked. Try again in ${minutes} minutes.` });
    }

    const passwordValid = await bcrypt.compare(password, admin.password);
    if (!passwordValid) {
      const attempts = admin.failedLoginAttempts + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60_000) : null;
      await Admin.findByIdAndUpdate(admin._id, { $inc: { failedLoginAttempts: 1 }, ...(lockUntil && { lockUntil }) });
      
      logger.warn(`Admin login failed: Incorrect password (Attempt #${attempts})`, {
        security: true,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
        email,
        failedAttempts: attempts,
        lockoutTriggered: !!lockUntil,
      });

      if (lockUntil) return res.status(423).json({ error: 'Too many failed attempts. Account locked for 15 minutes.' });
      throw new AuthenticationError('Invalid credentials');
    }

    await Admin.findByIdAndUpdate(admin._id, { failedLoginAttempts: 0, lockUntil: null, lastLogin: new Date() });

    logger.info('Admin login successful', {
      security: true,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'],
      email: admin.email,
      adminId: admin._id,
      role: admin.roles?.[0] ?? 'admin',
    });

    const token      = jwt.sign({ id: admin._id, email: admin.email, role: admin.roles?.[0] ?? 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    const csrfToken  = jwt.sign({ type: 'csrf', userId: admin._id.toString() }, JWT_SECRET, { expiresIn: '1h' });

    const cookieOptions = { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax', path: '/' };
    res.cookie('auth_token',  token,     { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 })
       .cookie('csrf_token',  csrfToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 })
       .json({ name: admin.name, success: true, token });
  } catch (err) { next(err); }
});

router.post('/admin/logout', authenticateToken, (req, res) => {
  logger.info('Admin logout successful', {
    security: true,
    ip: getClientIp(req),
    email: req.user?.email,
    adminId: req.user?.id,
  });
  res.clearCookie('auth_token').clearCookie('csrf_token').json({ success: true });
});

router.get('/admin/users', authenticateToken, async (req, res, next) => {
  try {
    const users = await Admin.find().sort({ createdAt: -1 }).select('-password').lean();
    res.json(users);
  } catch (err) { next(err); }
});

router.post('/admin/users', authenticateToken, requireRole('super-admin'), async (req, res, next) => {
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

router.delete('/admin/users/:id', authenticateToken, requireRole('super-admin'), async (req, res, next) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id).lean();
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    await logAudit('ADMIN_DELETE', { email: admin.email }, req);
    logger.info('Admin user deleted successfully', {
      security: true,
      ip: getClientIp(req),
      triggeredByEmail: req.user?.email,
      deletedAdminEmail: admin.email,
      deletedAdminId: admin._id,
    });

    res.json({ message: 'Admin deleted' });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN STATS & ANALYTICS
// ─────────────────────────────────────────────────────────────────

router.get('/stats/revenue', authenticateToken, async (req, res, next) => {
  try {
    const data = await cacheService.getOrSet(CACHE_KEYS.STATS_REVENUE, async () => {
      const yesterday    = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);

      const [[result], [yesterdayResult], weeklyRaw] = await Promise.all([
        Order.aggregate([
          { $match: { status: { $ne: 'Cancelled' } } },
          { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalOrders: { $sum: 1 } } },
        ]),
        Order.aggregate([
          { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: yesterday } } },
          { $group: { _id: null, revenue: { $sum: '$total' } } },
        ]),
        Order.aggregate([
          { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id:     { $dateToString: { format: '%u', date: '$createdAt' } },
              revenue: { $sum: '$total' },
              orders:  { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { dayNum: '$_id', revenue: 1, orders: 1, _id: 0 } },
        ]),
      ]);

      const totalRevenue = result?.totalRevenue ?? 0;
      const yesterdayRev = yesterdayResult?.revenue ?? 0;
      const trend        = yesterdayRev > 0 ? ((totalRevenue - yesterdayRev) / yesterdayRev) * 100 : 0;

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayNames = { '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat', '7': 'Sun' };
      const weekMap = Object.fromEntries(weeklyRaw.map(d => [dayNames[d.dayNum] || 'Mon', d]));
      const weeklyData = days.map(day => {
        const cached = weekMap[day];
        return {
          day,
          revenue: cached?.revenue ?? 0,
          orders: cached?.orders ?? 0,
        };
      });

      return { totalRevenue, trend, weeklyData };
    });
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/stats/orders', authenticateToken, async (req, res, next) => {
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

router.get('/stats/inventory', authenticateToken, async (req, res, next) => {
  try {
    const data = await cacheService.getOrSet(CACHE_KEYS.STATS_INVENTORY, async () => {
      const [total, lowStock, outOfStock, products] = await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ quantity: { $gt: 0, $lt: 5 } }),
        Product.countDocuments({ quantity: 0 }),
        Product.find({}, { id: 1, name: 1, quantity: 1, bucket: 1 }).lean(),
      ]);
      return { total, lowStock, outOfStock, products };
    });
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/admin/analytics', authenticateToken, async (_req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const yesterday     = new Date(Date.now() - 24 * 60 * 60 * 1000);

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
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: yesterday } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: yesterday } }),
      Product.countDocuments(),
      Product.countDocuments({ quantity: 0 }),
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
        { $match: { _id: { $nin: [null, ''] } } },
        { $sort: { revenue: -1 } },
        { $project: { category: '$_id', revenue: 1, units: 1, _id: 0 } },
        { $limit: 8 },
      ]),
      Order.aggregate([
        { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { method: '$_id', count: 1, _id: 0 } },
      ]),
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
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue    = revenueResult[0]?.total  ?? 0;
    const totalOrders     = revenueResult[0]?.count  ?? 0;
    const avgOrderValue   = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const pendingOrders   = ordersResult.find(o => o._id === 'Pending')?.count ?? 0;
    const yesterdayRev    = revenueYesterday[0]?.total ?? 0;
    const revenueTrend = (yesterdayRev > 0 && isFinite(totalRevenue))
      ? ((totalRevenue - yesterdayRev) / yesterdayRev) * 100
      : 0;
    const ordersByStatus  = ordersByStatusArr.reduce((acc, o) => ({ ...acc, [o._id]: o.count }), {});

    res.json({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      pendingOrders,
      revenueTrend,
      ordersTrend: ordersYesterday,
      totalProducts: productCount,
      outOfStock:    outOfStockCount,
      revenueOverTime,
      revenueByCategory,
      paymentMethods,
      bestSellers,
      ordersByStatus,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN PRODUCTS
// ─────────────────────────────────────────────────────────────────

router.get('/admin/products', authenticateToken, async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    const docs = products.map(p => ({
      ...p,
      id: p.id || p._id?.toString() || `GEN-${Math.random().toString(36).substr(2, 9)}`,
    }));
    res.json(docs);
  } catch (err) { next(err); }
});

router.post('/admin/upload', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new ValidationError('No file provided');
    
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'stopshop', resource_type: 'auto' },
      (error, result) => {
        if (error) return next(new AppError('Cloudinary upload failed: ' + error.message, 500));
        
        let url = result.secure_url;
        if (url && url.includes('/upload/')) {
          url = url.replace('/upload/', '/upload/f_auto,q_auto/');
        }
        res.json({ url });
      }
    );
    uploadStream.end(req.file.buffer);
  } catch (err) { next(err); }
});

router.post('/admin/products', authenticateToken, validateRequest(createProductSchema), async (req, res, next) => {
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

    await syncInventory(product, 'INITIAL', 'Product created by admin');
    await logAudit('PRODUCT_CREATE', { id: product.id, name: product.name }, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    return res.status(201).json(product);
  } catch (err) { next(err); }
});

router.patch('/admin/products/:id', authenticateToken, validateRequest(updateProductSchema), async (req, res, next) => {
  try {
    const updateData = { ...req.body };

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

    const prevProduct = await Inventory.findOne({ productId: req.params.id }).lean();
    const prevStock   = prevProduct?.totalStock ?? 0;
    const moveType    = product.quantity > prevStock ? 'RESTOCK' : 'ADMIN_UPDATE';

    await syncInventory(product, moveType, `Admin updated: ${Object.keys(req.body).join(', ')}`);
    await logAudit('PRODUCT_UPDATE', { id: req.params.id, changes: Object.keys(req.body) }, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    res.json(product);
  } catch (err) { next(err); }
});

router.delete('/admin/products/:id', authenticateToken, requireRole('admin', 'super-admin'), async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete(buildIdQuery(req.params.id));
    if (!product) throw new NotFoundError('Product not found');

    await logAudit('PRODUCT_DELETE', { id: req.params.id, name: product.name }, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);
    res.json({ message: 'Product removed' });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN INVENTORY
// ─────────────────────────────────────────────────────────────────

router.get('/admin/inventory', authenticateToken, async (req, res, next) => {
  try {
    const inventory = await Inventory.find().sort({ updatedAt: -1 }).lean();
    res.json(inventory);
  } catch (err) { next(err); }
});

router.get('/admin/inventory/summary', authenticateToken, async (req, res, next) => {
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

    const byCategory = await Inventory.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$totalStock' } } },
      { $sort: { totalStock: -1 } },
    ]);

    res.json({ ...(summary ?? {}), byCategory });
  } catch (err) { next(err); }
});

router.get('/admin/inventory/:productId', authenticateToken, async (req, res, next) => {
  try {
    const entry = await Inventory.findOne({ productId: req.params.productId }).lean();
    if (!entry) throw new NotFoundError('Inventory entry not found');
    res.json(entry);
  } catch (err) { next(err); }
});

router.post('/admin/inventory/:productId/restock', authenticateToken, async (req, res, next) => {
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

router.delete('/admin/inventory/:productId', authenticateToken, requireRole('super-admin'), async (req, res, next) => {
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

// ─────────────────────────────────────────────────────────────────
// ADMIN ORDERS
// ─────────────────────────────────────────────────────────────────

router.get('/orders', authenticateToken, async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) { next(err); }
});

router.patch('/orders/:id', authenticateToken, validateRequest(updateOrderStatusSchema), async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
    if (!order) throw new NotFoundError('Order not found');

    await logAudit('ORDER_STATUS_UPDATE', { id: req.params.id, status }, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_REVENUE, CACHE_KEYS.STATS_ORDERS]);

    // Fire-and-forget: notify customer on fulfilment milestones
    if (status === 'Shipped' || status === 'Delivered') {
      sendOrderStatusEmail(order, status).catch(() => {});
    }

    res.json(order);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN SETTINGS
// ─────────────────────────────────────────────────────────────────

router.get('/settings', authenticateToken, requireRole('admin', 'super-admin'), async (req, res, next) => {
  try {
    const s = await Settings.findOne().lean();
    res.json(s ?? { announcement: 'Welcome to Stop & Shop', logo: '' });
  } catch (err) { next(err); }
});

router.post('/settings', authenticateToken, requireRole('admin', 'super-admin'), validateRequest(updateSettingsSchema), async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true }).lean();
    await logAudit('SETTINGS_UPDATE', { changed: Object.keys(req.body) }, req);
    await cacheService.del(CACHE_KEYS.SETTINGS);
    res.json({ message: 'Settings updated', settings });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN COUPONS
// ─────────────────────────────────────────────────────────────────

router.get('/admin/coupons', authenticateToken, async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json(coupons);
  } catch (err) { next(err); }
});

router.post('/admin/coupons', authenticateToken, async (req, res, next) => {
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

router.patch('/admin/coupons/:id', authenticateToken, async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    await logAudit('COUPON_UPDATE', { id: req.params.id }, req);
    res.json(coupon);
  } catch (err) { next(err); }
});

router.delete('/admin/coupons/:id', authenticateToken, requireRole('admin', 'super-admin'), async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id).lean();
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    await logAudit('COUPON_DELETE', { code: coupon.code }, req);
    res.json({ message: 'Coupon deleted' });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN REVIEWS
// ─────────────────────────────────────────────────────────────────

router.get('/admin/reviews', authenticateToken, async (_req, res, next) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    res.json(reviews);
  } catch (err) { next(err); }
});

router.patch('/admin/reviews/:id', authenticateToken, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: pending, approved, or rejected' });
    }

    const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
    if (!review) return res.status(404).json({ error: 'Review not found' });

    logAudit(`REVIEW_${status.toUpperCase()}`, { reviewId: req.params.id, status }, req).catch(() => {});
    res.json(review);
  } catch (err) { next(err); }
});

router.delete('/admin/reviews/:id', authenticateToken, async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id).lean();
    if (!review) return res.status(404).json({ error: 'Review not found' });

    logAudit('REVIEW_DELETE', { reviewId: req.params.id }, req).catch(() => {});
    res.json({ message: 'Review deleted successfully' });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN AUDIT LOGS
// ─────────────────────────────────────────────────────────────────

router.get('/admin/audits', authenticateToken, async (_req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100).lean();
    res.json({ logs, total: logs.length });
  } catch (err) { next(err); }
});

export default router;
