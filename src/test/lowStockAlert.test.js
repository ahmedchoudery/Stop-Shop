import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import LowStockAlert from '../models/LowStockAlert.js';
import EmailOutbox from '../models/EmailOutbox.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';
import dbConnect from '../lib/db.js';
import { checkLowStockAlert, getSalesVelocity } from '../services/lowStockService.js';
import { POST as inventoryPOST, GET as inventoryGET } from '../app/api/v1/admin/inventory/route.js';

vi.mock('../lib/adminAuth.js', () => ({
  getAdminFromToken: vi.fn().mockReturnValue({ id: 'admin-id', email: 'admin@stopshop.pk' }),
  hasRole: vi.fn().mockResolvedValue(true),
}));

class MockRequest {
  constructor(url, body = {}, headers = {}) {
    this.url = url;
    this._body = body;
    this.headersList = new Map(Object.entries(headers));
    this.headers = {
      get: (name) => this.headersList.get(name.toLowerCase()) || null,
    };
  }
  async json() {
    return this._body;
  }
}

describe('Low Stock Alert Integration Tests', () => {
  beforeAll(async () => {
    await dbConnect();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await LowStockAlert.deleteMany({});
    await EmailOutbox.deleteMany({});
    await Order.deleteMany({});
    await Settings.deleteMany({});
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  it('calculates 7-day sales velocity correctly using orders', async () => {
    const product = await Product.create({
      id: 'PRD-VEL',
      name: 'Velocity Shirt',
      price: 2000,
      quantity: 10,
      sizes: ['M'],
      colors: ['#ffffff | White'],
      variantMatrix: {
        '#ffffff | White|M': 10
      },
      featuredSection: 'pieces'
    });

    const date3DaysAgo = new Date();
    date3DaysAgo.setDate(date3DaysAgo.getDate() - 3);

    await Order.create({
      orderID: 'STOP-2026-VEL1',
      customer: { name: 'A', email: 'a@a.com', phone: '0300', address: 'a', city: 'a' },
      items: [{
        id: 'PRD-VEL',
        name: 'Velocity Shirt',
        price: 2000,
        quantity: 3,
        selectedSize: 'M',
        selectedColor: '#ffffff | White'
      }],
      total: 6000,
      paymentMethod: 'COD',
      status: 'Confirmed',
      createdAt: date3DaysAgo
    });

    const date10DaysAgo = new Date();
    date10DaysAgo.setDate(date10DaysAgo.getDate() - 10);

    await Order.create({
      orderID: 'STOP-2026-VEL2',
      customer: { name: 'B', email: 'b@b.com', phone: '0300', address: 'b', city: 'b' },
      items: [{
        id: 'PRD-VEL',
        name: 'Velocity Shirt',
        price: 2000,
        quantity: 5,
        selectedSize: 'M',
        selectedColor: '#ffffff | White'
      }],
      total: 10000,
      paymentMethod: 'COD',
      status: 'Confirmed',
      createdAt: date10DaysAgo
    });

    const date1DayAgo = new Date();
    date1DayAgo.setDate(date1DayAgo.getDate() - 1);

    await Order.create({
      orderID: 'STOP-2026-VEL3',
      customer: { name: 'C', email: 'c@c.com', phone: '0300', address: 'c', city: 'c' },
      items: [{
        id: 'PRD-VEL',
        name: 'Velocity Shirt',
        price: 2000,
        quantity: 2,
        selectedSize: 'M',
        selectedColor: '#ffffff | White'
      }],
      total: 4000,
      paymentMethod: 'COD',
      status: 'Confirmed',
      createdAt: date1DayAgo
    });

    const velocity = await getSalesVelocity('PRD-VEL', '#ffffff | White|M');
    expect(velocity).toBe(5);
  });

  it('triggers low stock alert and enqueues outbox email when stock drops below threshold', async () => {
    const product = await Product.create({
      id: 'PRD-LOW',
      name: 'Low Stock Pants',
      price: 3000,
      quantity: 6,
      sizes: ['32'],
      colors: ['#e5e7eb | Beige'],
      variantMatrix: {
        '#e5e7eb | Beige|32': 6
      },
      lowStockThreshold: 5,
      featuredSection: 'pieces'
    });

    product.variantMatrix.set('#e5e7eb | Beige|32', 4);
    await checkLowStockAlert(product, '32', '#e5e7eb | Beige');

    const dateStr = new Date().toISOString().split('T')[0];
    const alert = await LowStockAlert.findOne({
      sku: 'PRD-LOW',
      variantId: '#e5e7eb | Beige|32',
      date: dateStr
    });
    expect(alert).toBeDefined();
    expect(alert.status).toBe('active');

    const email = await EmailOutbox.findOne({
      idempotencyKey: `low-stock:PRD-LOW:#e5e7eb | Beige|32:${dateStr}`
    });
    expect(email).toBeDefined();
    expect(email.template).toBe('low-stock-alert-admin');
    expect(email.data.productName).toBe('Low Stock Pants');
    expect(email.data.currentStock).toBe(4);

    const prevEmailCount = await EmailOutbox.countDocuments({});
    product.variantMatrix.set('#e5e7eb | Beige|32', 3);
    await checkLowStockAlert(product, '32', '#e5e7eb | Beige');
    const newEmailCount = await EmailOutbox.countDocuments({});
    expect(newEmailCount).toBe(prevEmailCount);
  });

  it('supports admin restock, snooze and threshold adjustment actions via API', async () => {
    const dateStr = new Date().toISOString().split('T')[0];

    const product = await Product.create({
      id: 'PRD-API',
      name: 'API Product',
      price: 1500,
      quantity: 3,
      sizes: ['L'],
      colors: ['#000000 | Black'],
      variantMatrix: {
        '#000000 | Black|L': 3
      },
      featuredSection: 'pieces'
    });

    const alert = await LowStockAlert.create({
      sku: 'PRD-API',
      variantId: '#000000 | Black|L',
      date: dateStr,
      status: 'active'
    });

    let req = new MockRequest('http://localhost/api/admin/inventory', {
      action: 'snooze',
      alertId: alert._id.toString()
    });
    let response = await inventoryPOST(req);
    let resJson = await response.json();
    expect(resJson.success).toBe(true);

    let updatedAlert = await LowStockAlert.findById(alert._id);
    expect(updatedAlert.status).toBe('snoozed');
    expect(updatedAlert.snoozedUntil).toBeDefined();

    req = new MockRequest('http://localhost/api/admin/inventory', {
      action: 'restock',
      alertId: alert._id.toString(),
      quantity: 50
    });
    response = await inventoryPOST(req);
    resJson = await response.json();
    expect(resJson.success).toBe(true);

    updatedAlert = await LowStockAlert.findById(alert._id);
    expect(updatedAlert.status).toBe('restocked');

    const updatedProduct = await Product.findOne({ id: 'PRD-API' });
    expect(updatedProduct.variantMatrix.get('#000000 | Black|L')).toBe(53);

    req = new MockRequest('http://localhost/api/admin/inventory', {
      action: 'threshold',
      sku: 'PRD-API',
      threshold: 8
    });
    response = await inventoryPOST(req);
    resJson = await response.json();
    expect(resJson.success).toBe(true);

    const thresholdProduct = await Product.findOne({ id: 'PRD-API' });
    expect(thresholdProduct.lowStockThreshold).toBe(8);

    req = new MockRequest('http://localhost/api/admin/inventory', {
      action: 'global-threshold',
      threshold: 12
    });
    response = await inventoryPOST(req);
    resJson = await response.json();
    expect(resJson.success).toBe(true);

    const settings = await Settings.findOne();
    expect(settings.lowStockThreshold).toBe(12);
  });
});
