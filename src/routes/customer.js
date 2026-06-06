import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import { authenticateCustomer, CUSTOMER_JWT_SECRET } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { getClientIp } from '../middleware/security.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { validateRequest, createCustomerSchema, loginSchema } from '../schemas/validation.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
// CUSTOMER REGISTER
// ─────────────────────────────────────────────────────────────────

router.post('/register', authLimiter, validateRequest(createCustomerSchema), async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
 
    const exists = await Customer.findOne({ email }).lean();
    if (exists) {
      logger.warn('Customer registration failed: Email already exists', {
        security: true,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
        email,
      });
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
 
    const hashed  = await bcrypt.hash(password, 12);
    const customer = await Customer.create({
      name,
      email,
      password: hashed,
      phone,
    });
 
    const token = jwt.sign(
      { id: customer._id, email: customer.email, type: 'customer' },
      CUSTOMER_JWT_SECRET,
      { expiresIn: '30d' }
    );
 
    logger.info('Customer registration successful', {
      security: true,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'],
      email: customer.email,
      customerId: customer._id,
    });

    const { password: _, ...safe } = customer.toObject();
    res.status(201).json({ token, customer: safe });
  } catch (err) { next(err); }
});
 
// ─────────────────────────────────────────────────────────────────
// CUSTOMER LOGIN
// ─────────────────────────────────────────────────────────────────

router.post('/login', authLimiter, validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
 
    const customer = await Customer.findOne({ email });
    if (!customer) {
      logger.warn('Customer login failed: Account not found', {
        security: true,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
        email,
      });
      return res.status(401).json({ error: 'No account found with this email' });
    }
 
    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) {
      logger.warn('Customer login failed: Incorrect password', {
        security: true,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
        email,
      });
      return res.status(401).json({ error: 'Incorrect password' });
    }
 
    const token = jwt.sign(
      { id: customer._id, email: customer.email, type: 'customer' },
      CUSTOMER_JWT_SECRET,
      { expiresIn: '30d' }
    );
 
    logger.info('Customer login successful', {
      security: true,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'],
      email: customer.email,
      customerId: customer._id,
    });

    const { password: _, ...safe } = customer.toObject();
    res.json({ token, customer: safe });
  } catch (err) { next(err); }
});
 
// ─────────────────────────────────────────────────────────────────
// CUSTOMER GET PROFILE
// ─────────────────────────────────────────────────────────────────

router.get('/profile', authenticateCustomer, async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customer.id).select('-password').lean();
    if (!customer) return res.status(404).json({ error: 'Account not found' });
    res.json(customer);
  } catch (err) { next(err); }
});
 
// ─────────────────────────────────────────────────────────────────
// CUSTOMER UPDATE PROFILE
// ─────────────────────────────────────────────────────────────────

router.patch('/profile', authenticateCustomer, async (req, res, next) => {
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
 
// ─────────────────────────────────────────────────────────────────
// CUSTOMER ORDERS HISTORY
// ─────────────────────────────────────────────────────────────────

router.get('/orders', authenticateCustomer, async (req, res, next) => {
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

export default router;
