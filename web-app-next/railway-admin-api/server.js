import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { getDb } from './db.js';
import { rbacGate, requireRole, requireStage } from './rbacGate.js';
import { AuditRepository } from './repositories/AuditRepository.js';
import { OrderRepository } from './repositories/OrderRepository.js';
import { ProductRepository } from './repositories/ProductRepository.js';

const app = express();
const auditRepo = new AuditRepository();
const orderRepo = new OrderRepository();
const productRepo = new ProductRepository();

app.use(cors());
app.use(bodyParser.json());

// Public healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: config.environment });
});

// Phase 17: Admin Authentication
app.get('/api/admin/auth/check', rbacGate, (req, res) => {
  res.json({ authenticated: true, user: req.user });
});

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = await getDb();
    const admin = await db.collection('admins').findOne({ email });
    
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.roles?.[0] || 'super-admin' },
      process.env.JWT_SECRET || config.jwtSecret,
      { expiresIn: '8h' }
    );
    
    res.json({ token, name: admin.name });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin lean endpoints
app.get('/api/admin/metrics', rbacGate, (req, res) => {
  res.json({
    metrics: { revenue: 5000, users: 42, activeSessions: 12 },
    context: `Accessed by ${req.user.email || req.user.role}`
  });
});

// Phase 12 Granularity Tests: Endpoints strictly fenced inside constrained stages demanding explicit super-admin execution structures natively
app.post('/api/admin/metrics/reset', rbacGate, requireRole('super-admin'), requireStage('dev', 'staging'), (req, res) => {
  res.json({ status: 'RESET_SUCCESS', details: 'Core metrics destroyed under elevated command execution.' });
});

// Phase 14 Telemetry: Filterable Audit streams strictly protected to internal auditors
app.get('/api/admin/audits', rbacGate, requireRole('super-admin', 'auditor'), async (req, res) => {
  try {
    const filters = req.query;
    const audits = await auditRepo.findAll(filters);
    res.json(audits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to access remote audit logs.' });
  }
});

// Phase 17: Admin Order Management
app.get('/api/admin/orders', rbacGate, requireRole('super-admin', 'auditor'), async (req, res) => {
  try {
    const orders = await orderRepo.findAll(req.query);
    res.json(orders);
  } catch (error) {
    console.error('Admin Orders Fetch Error:', error);
    res.status(500).json({ error: 'Failed to retrieve administrative order history.' });
  }
});

app.get('/api/admin/orders/:id', rbacGate, requireRole('super-admin', 'auditor'), async (req, res) => {
  try {
    const order = await orderRepo.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve order details.' });
  }
});

// Phase 17: Admin Stats & Business Intelligence
app.get('/api/admin/stats/orders', rbacGate, requireRole('super-admin', 'auditor'), async (req, res) => {
  try {
    const orders = await orderRepo.findAll();
    const totalOrders = orders.filter(o => o.status !== 'Cancelled').length;
    const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'PENDING').length;
    res.json({ totalOrders, pendingOrders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order statistics.' });
  }
});

app.get('/api/admin/stats/inventory', rbacGate, requireRole('super-admin', 'auditor'), async (req, res) => {
  try {
    const totalProducts = await productRepo.countTotal();
    const outOfStock = await productRepo.findOutOfStock();
    const lowStock = await productRepo.findLowStock(5);
    const products = await productRepo.findAll();
    res.json({ totalProducts, outOfStock, lowStock, products });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory analytics.' });
  }
});

app.get('/api/admin/stats/revenue', rbacGate, requireRole('super-admin', 'auditor'), async (req, res) => {
  try {
    const orders = await orderRepo.findAll();
    const validOrders = orders.filter(o => o.status !== 'Cancelled');
    
    // Calculate total revenue (assuming conversion to PKR for now, or just plain sum)
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    // Group by day for the last 7 days
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayOrders = validOrders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString());
      const dayRev = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      weeklyData.push({ day: dayStr, revenue: dayRev, orders: dayOrders.length });
    }

    res.json({ totalRevenue, trend: 12, weeklyData }); // Trend is mocked for now
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate revenue intelligence.' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`Admin API (Lean RBAC Gate) running on port ${config.port}`);
  });
}

export default app;
