import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import { authenticateCustomer, CUSTOMER_JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
// CUSTOMER REGISTER
// ─────────────────────────────────────────────────────────────────

router.post('/register', async (req, res, next) => {
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
 
// ─────────────────────────────────────────────────────────────────
// CUSTOMER LOGIN
// ─────────────────────────────────────────────────────────────────

router.post('/login', async (req, res, next) => {
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
