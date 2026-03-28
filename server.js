import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
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

mongoose.connect(mongoUri)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ─────────────────────────────────────────────────────────────────
// SCHEMAS & MODELS  (must be defined BEFORE routes that use them)
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
const Order = mongoose.model('Order', orderSchema);

const productSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  price: Number,
  quantity: { type: Number, default: 0 }, // Used for internal logic/inventory table
  stock: { type: Number, default: 0 },    // Used for frontend display/matching static data
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
});

// Keep stock and quantity in sync
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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, getEnv('JWT_SECRET', 'jwt_secret'), (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

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
// AUTH ROUTES
// ─────────────────────────────────────────────────────────────────
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.roles?.[0] || 'admin' },
      getEnv('JWT_SECRET', 'jwt_secret'),
      { expiresIn: '8h' }
    );
    res.json({ token, name: admin.name });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
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
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.patch('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
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
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/admin/products', authenticateToken, async (req, res) => {
  try {
    const productData = req.body;
    const buildId = () => 'PRD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    if (!productData.id) productData.id = buildId();
    try {
      const product = new Product(productData);
      await product.save();
      return res.status(201).json(product);
    } catch (saveError) {
      if (saveError?.code === 11000 && saveError?.keyPattern?.id) {
        const retryData = { ...productData, id: buildId() };
        const retryProduct = new Product(retryData);
        await retryProduct.save();
        return res.status(201).json(retryProduct);
      }
      throw saveError;
    }
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error?.message || 'Failed to create product' });
  }
});

app.patch('/api/admin/products/:id', authenticateToken, async (req, res) => {
  try {
    // Sync quantity/stock if one is provided
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
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/admin/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product removed from system' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ─────────────────────────────────────────────────────────────────
// PUBLIC PRODUCT ROUTE
// ─────────────────────────────────────────────────────────────────
app.get('/api/public/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch public products' });
  }
});

// ─────────────────────────────────────────────────────────────────
// STATS ROUTES
// ─────────────────────────────────────────────────────────────────
app.get(['/api/stats/revenue', '/api/admin/stats/revenue'], authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: 'Cancelled' } });
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    
    // Total Revenue
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Revenue Trend (Today vs Yesterday)
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
    
    // Weekly Data for Chart (Last 7 days)
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

    res.json({ totalRevenue, trend, weeklyData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate revenue' });
  }
});

app.get(['/api/stats/orders', '/api/admin/stats/orders'], authenticateToken, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({ status: { $ne: 'Cancelled' } });
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    res.json({ totalOrders, pendingOrders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order stats' });
  }
});

app.get(['/api/stats/inventory', '/api/admin/stats/inventory'], authenticateToken, async (req, res) => {
  try {
    const products = await Product.find();
    const totalProducts = products.length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    const lowStock = products.filter(p => p.quantity < 5 && p.quantity > 0).length;
    res.json({ totalProducts, outOfStock, lowStock, products });
  } catch (error) {
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
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
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
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Public (no auth needed for storefront)
app.get('/api/public/settings', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings || { announcement: 'Welcome to Stop & Shop', logo: '' });
  } catch (error) {
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
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

app.post('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ error: 'Email already in use' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ name, email, password: hashedPassword });
    await newAdmin.save();
    res.status(201).json({ message: 'Admin account created successfully' });
  } catch (error) {
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
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// ─────────────────────────────────────────────────────────────────
// PUBLIC CHECKOUT ROUTE
// ─────────────────────────────────────────────────────────────────
app.post('/api/checkout', async (req, res) => {
  try {
    const { customer, items, total, paymentMethod } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    const precheckProducts = await Product.find({ id: { $in: items.map(i => i.id) } });
    const byId = new Map(precheckProducts.map(p => [p.id, p]));
     for (const item of items) {
       const orderedQty = Math.max(1, parseInt(item.quantity) || 1);
       const product = byId.get(item.id);
       if (!product) return res.status(400).json({ error: `Product not found: ${item.id}` });
       const size = (item.selectedSize || '').trim();
       
       // Validate that selected size is valid for this product
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

    res.status(201).json({ message: 'Order placed successfully', orderID });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────
app.use(express.static(distPath));

// SPA catch-all - must be last
app.all(/.*/, (req, res) => { res.sendFile(path.join(distPath, "index.html")); });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
