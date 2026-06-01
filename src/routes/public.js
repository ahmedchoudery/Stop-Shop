import express from 'express';
import mongoose from 'mongoose';

import { cacheService, CACHE_KEYS } from '../services/cacheService.js';
import { getClientIp } from '../middleware/security.js';
import {
  validateRequest,
  checkoutSchema,
  couponValidationSchema,
  reviewSchema,
  PAYMENT_METHODS,
} from '../schemas/validation.js';

import { sendEmail, checkAndAlertLowStock } from '../services/emailService.js';
import { syncInventory } from '../services/inventoryService.js';
import { checkoutLimiter, trackingLimiter } from '../middleware/rateLimiters.js';

// Models
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';
import Subscriber from '../models/Subscriber.js';
import Coupon from '../models/Coupon.js';
import Review from '../models/Review.js';
import Settings from '../models/Settings.js';

const router = express.Router();

const getEnv = (...keys) => keys.map(k => process.env[k]).find(Boolean);

const buildIdQuery = (idParam) => {
  return mongoose.isValidObjectId(idParam)
    ? { $or: [{ id: idParam }, { _id: idParam }] }
    : { id: idParam };
};

// ─────────────────────────────────────────────────────────────────
// PUBLIC ORDER TRACKING
// ─────────────────────────────────────────────────────────────────

router.get('/public/track/:orderID', trackingLimiter, async (req, res, next) => {
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

// ─────────────────────────────────────────────────────────────────
// PUBLIC PRODUCTS
// ─────────────────────────────────────────────────────────────────

router.get('/public/products', async (req, res, next) => {
  try {
    const data = await cacheService.getOrSet(CACHE_KEYS.PUBLIC_PRODUCTS, async () => {
      const products = await Product.find().lean();
      return products.map(p => ({
        ...p,
        id:          p.id || p._id?.toString(),
        bucket:      p.bucket || 'Tops',
        subCategory: p.subCategory || 'Tshirt',
      }));
    });
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/public/products/:id', async (req, res, next) => {
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

// ─────────────────────────────────────────────────────────────────
// PUBLIC CHECKOUT
// ─────────────────────────────────────────────────────────────────

router.post('/checkout', checkoutLimiter, validateRequest(checkoutSchema), async (req, res, next) => {
  try {
    const { customer, items, total, paymentMethod } = req.body;
    const clientIp   = getClientIp(req);
    const productIds = [...new Set(items.map(i => i.id))];

    const dbProducts = await Product.find({ id: { $in: productIds } });
    if (dbProducts.length !== productIds.length) {
      const missing = productIds.filter(id => !dbProducts.find(p => p.id === id));
      return res.status(400).json({ error: `Some products in your cart are no longer available: ${missing.join(', ')}` });
    }
    const productMap  = new Map(dbProducts.map(p => [p.id, p]));

    // Stock validation
    for (const item of items) {
      const product  = productMap.get(item.id);
      if (!product)  return res.status(400).json({ error: `Product not found: ${item.id}` });

      const qty      = Math.max(1, parseInt(item.quantity) || 1);
      const size      = (item.selectedSize ?? '').trim();
      const available = (size && product.sizeStock)
        ? (product.sizeStock.get?.(size) ?? product.sizeStock[size] ?? 0)
        : product.quantity;

      if (available < qty) {
        return res.status(400).json({
          error: `Not enough stock for ${product.name}${size ? ` (size ${size})` : ''}. Available: ${available}`,
        });
      }
    }

    const orderID = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Decrement stock + sync inventory per product
    for (const item of items) {
      const qty    = Math.max(1, parseInt(item.quantity) || 1);
      const size   = (item.selectedSize ?? '').trim();
      const sizeKey = size ? `sizeStock.${size}` : null;

      const stockUpdate = sizeKey
        ? { $inc: { quantity: -qty, stock: -qty, [sizeKey]: -qty } }
        : { $inc: { quantity: -qty, stock: -qty } };

      const updatedProduct = await Product.findOneAndUpdate(
        { 
          id: item.id, 
          ...(sizeKey ? { [sizeKey]: { $gte: qty } } : { stock: { $gte: qty } }) 
        },
        stockUpdate,
        { new: true }
      );

      if (updatedProduct) {
        await syncInventory(
          updatedProduct,
          'SALE',
          `Sold ${qty}x ${updatedProduct.name}${size ? ` (${size})` : ''} via order ${orderID}`,
          orderID
        );
      }
    }

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

    const verifiedTotal = enrichedItems.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
    const finalTotal = Math.max(0, verifiedTotal);

    await Order.create({ orderID, customer, items: enrichedItems, total: finalTotal, paymentMethod, ip: clientIp });

    if (req.body.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: req.body.couponCode.trim().toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    await cacheService.invalidateMany([
      CACHE_KEYS.STATS_REVENUE,
      CACHE_KEYS.STATS_ORDERS,
      CACHE_KEYS.STATS_INVENTORY,
      CACHE_KEYS.PUBLIC_PRODUCTS,
    ]);

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

    checkAndAlertLowStock(items);

    res.status(201).json({ message: 'Order placed', orderID, verifiedTotal: finalTotal });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// PUBLIC SETTINGS
// ─────────────────────────────────────────────────────────────────

router.get('/public/settings', async (_req, res, next) => {
  try {
    const data = await cacheService.getOrSet(CACHE_KEYS.SETTINGS, async () => {
      const s = await Settings.findOne().lean();
      return s ?? { announcement: 'Welcome to Stop & Shop', logo: '' };
    });
    res.json(data);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// PUBLIC COUPONS
// ─────────────────────────────────────────────────────────────────

router.post('/public/coupons/validate', validateRequest(couponValidationSchema), async (req, res, next) => {
  try {
    const { code, cartTotal, activeCouponCode } = req.body;
 
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
 
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'This coupon has expired' });
    }
 
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'This coupon has reached its usage limit' });
    }
 
    const orderTotal = parseFloat(cartTotal) || 0;
    if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
      return res.status(400).json({
        error: `This coupon requires a minimum order of Rs. ${coupon.minOrderValue.toLocaleString('en-PK')}`,
      });
    }
 
    let discount;
    if (coupon.type === 'percentage') {
      discount = Math.round((orderTotal * coupon.value) / 100);
    } else {
      discount = Math.min(coupon.value, orderTotal);
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

// ─────────────────────────────────────────────────────────────────
// PUBLIC REVIEWS
// ─────────────────────────────────────────────────────────────────

router.get('/public/reviews/:productId', async (req, res, next) => {
  try {
    const reviews = await Review
      .find({ status: 'approved', productId: req.params.productId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(reviews);
  } catch (err) { next(err); }
});

router.get('/public/reviews', async (req, res, next) => {
  try {
    const { productId } = req.query;
    const filter = { status: 'approved' };
    if (productId) filter.productId = String(productId);

    const reviews = await Review
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(reviews);
  } catch (err) { next(err); }
});

router.post('/public/reviews', validateRequest(reviewSchema), async (req, res, next) => {
  try {
    const { name, email, rating, title, body, productId } = req.body;

    if (productId) {
      const p = await Product.exists({ id: productId });
      if (!p) return res.status(404).json({ error: 'Referenced product not found' });
    }

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

// ─────────────────────────────────────────────────────────────────
// PUBLIC NEWSLETTER / SUBSCRIBERS
// ─────────────────────────────────────────────────────────────────

router.post('/newsletter', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    await Subscriber.findOneAndUpdate({ email }, { email }, { upsert: true });
    res.json({ message: 'Subscribed successfully' });
  } catch (err) { next(err); }
});

router.post('/newsletter/subscribe', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    const trimmed = email.toLowerCase().trim();
    await Subscriber.findOneAndUpdate({ email: trimmed }, { email: trimmed }, { upsert: true });
    res.json({ message: 'Subscribed! Use code CARDINAL20 for 20% off your first order.' });
  } catch (err) { next(err); }
});

export default router;
