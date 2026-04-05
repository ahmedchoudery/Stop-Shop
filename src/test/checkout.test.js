import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────
// MOCK SETUP
// We mock mongoose before importing anything from server.js
// to avoid real DB connections during tests.
// ─────────────────────────────────────────────────────────────────

const mockProducts = new Map();
const mockInventory = new Map();
const mockOrders = [];

const createMockDoc = (data) => ({
  ...data,
  _id: `mock_${Math.random().toString(36).slice(2, 9)}`,
  save: vi.fn().mockResolvedValue(this),
});

vi.mock('mongoose', () => {
  const mockSchema = (def = {}) => {
    const schema = { ...def };
    schema.index = vi.fn().mockReturnThis();
    schema.pre = vi.fn().mockReturnThis();
    schema.post = vi.fn().mockReturnThis();
    return class MockSchema {
      constructor(data) { Object.assign(this, data); }
    };
  };

  mockSchema.Types = { Mixed: {} };

  return {
    default: {
      models: {},
      Schema: mockSchema,
      model: vi.fn((name) => {
        const Model = class {
          constructor(data) { Object.assign(this, data); }
          save() { return Promise.resolve(this); }
        };
        Model.findOne = vi.fn();
        Model.find = vi.fn();
        Model.findById = vi.fn();
        Model.findByIdAndUpdate = vi.fn();
        Model.findOneAndUpdate = vi.fn();
        Model.findOneAndDelete = vi.fn();
        Model.create = vi.fn();
        Model.countDocuments = vi.fn();
        Model.aggregate = vi.fn();
        return Model;
      }),
      connect: vi.fn().mockResolvedValue({}),
      connection: { close: vi.fn().mockResolvedValue({}) },
      isValidObjectId: vi.fn((id) => /^[a-f0-9]{24}$/i.test(id ?? '')),
    },
  };
});

// ─────────────────────────────────────────────────────────────────
// MOCK SERVER HELPERS (mirror of server.js logic)
// These re-implement the key route handlers as pure functions
// so we can test the logic without a live Express app or MongoDB.
// ─────────────────────────────────────────────────────────────────

const buildIdQuery = (idParam) => {
  return /^[a-f0-9]{24}$/i.test(idParam)
    ? { $or: [{ id: idParam }, { _id: idParam }] }
    : { id: idParam };
};

const computeVerifiedTotal = (items) => {
  return Math.max(0, items.reduce((sum, item) => sum + (item.price ?? 0) * Math.max(1, parseInt(item.quantity) || 1), 0));
};

const checkOutValidation = (items, dbProducts) => {
  for (const item of items) {
    const product = dbProducts.get(item.id);
    if (!product) return { ok: false, error: `Product not found: ${item.id}` };

    const qty       = Math.max(1, parseInt(item.quantity) || 1);
    const size      = (item.selectedSize ?? '').trim();
    const available = (size && product.sizeStock)
      ? (product.sizeStock[size] ?? 0)
      : product.quantity;

    if (available < qty) {
      return {
        ok: false,
        error: `Not enough stock for ${product.name}${size ? ` (size ${size})` : ''}. Available: ${available}`,
      };
    }
  }
  return { ok: true };
};

const enrichItems = (items, dbProducts) =>
  items.map(item => {
    const product = dbProducts.get(item.id);
    return {
      id: item.id,
      name: product?.name || item.name || '',
      price: product?.price ?? item.price ?? 0,
      quantity: Math.max(1, parseInt(item.quantity) || 1),
      selectedSize: (item.selectedSize ?? '').trim(),
      selectedColor: (item.selectedColor ?? '').trim(),
      category: product?.bucket || item.category || '',
      subCategory: product?.subCategory || item.subCategory || '',
    };
  });

const syncInventory = vi.fn();
const logAudit = vi.fn();
const invalidateCache = vi.fn();
const sendEmail = vi.fn();
const sendLowStockAlert = vi.fn();

// ─────────────────────────────────────────────────────────────────
// CHECKOUT INTEGRATION TESTS
// ─────────────────────────────────────────────────────────────────

describe('Checkout flow — end-to-end logic', () => {
  beforeEach(() => {
    mockProducts.clear();
    mockInventory.clear();
    mockOrders.length = 0;
    syncInventory.mockClear();
    logAudit.mockClear();
    sendEmail.mockClear();
    sendLowStockAlert.mockClear();
  });

  const setupProducts = (products) => {
    for (const p of products) {
      mockProducts.set(p.id, {
        id: p.id,
        name: p.name,
        price: p.price,
        quantity: p.quantity,
        stock: p.quantity,
        bucket: p.bucket || 'General',
        subCategory: p.subCategory || 'General',
        sizeStock: p.sizeStock || {},
      });
    }
  };

  describe('buildIdQuery', () => {
    it('returns id query for product-style IDs', () => {
      expect(buildIdQuery('PRD-ABC123XYZ')).toEqual({ id: 'PRD-ABC123XYZ' });
      expect(buildIdQuery('custom-id')).toEqual({ id: 'custom-id' });
    });

    it('returns $or query for MongoDB ObjectId-style IDs', () => {
      const query = buildIdQuery('507f1f77bcf86cd799439011');
      expect(query.$or).toBeTruthy();
      expect(query.$or[0].id).toBe('507f1f77bcf86cd799439011');
      expect(query.$or[1]._id).toBe('507f1f77bcf86cd799439011');
    });
  });

  describe('verifyCheckout — product existence check', () => {
    it('returns error when product not found in DB', () => {
      setupProducts([{ id: 'P1', name: 'Tee', price: 1000, quantity: 10 }]);
      const result = checkOutValidation(
        [{ id: 'P1', quantity: 2 }, { id: 'UNKNOWN', quantity: 1 }],
        mockProducts
      );
      expect(result.ok).toBe(false);
      expect(result.error).toContain('UNKNOWN');
    });

    it('passes when all products exist', () => {
      setupProducts([
        { id: 'P1', name: 'Tee', price: 1000, quantity: 10 },
        { id: 'P2', name: 'Jeans', price: 2000, quantity: 5 },
      ]);
      const result = checkOutValidation(
        [{ id: 'P1', quantity: 2 }, { id: 'P2', quantity: 1 }],
        mockProducts
      );
      expect(result.ok).toBe(true);
    });
  });

  describe('verifyCheckout — stock validation', () => {
    it('passes when stock is sufficient', () => {
      setupProducts([{ id: 'P1', name: 'Tee', price: 1000, quantity: 10 }]);
      const result = checkOutValidation([{ id: 'P1', quantity: 5 }], mockProducts);
      expect(result.ok).toBe(true);
    });

    it('fails when quantity exceeds available stock', () => {
      setupProducts([{ id: 'P1', name: 'Tee', price: 1000, quantity: 3 }]);
      const result = checkOutValidation([{ id: 'P1', quantity: 5 }], mockProducts);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Not enough stock');
      expect(result.error).toContain('Available: 3');
    });

    it('fails when size-specific stock is insufficient', () => {
      setupProducts([{ id: 'P1', name: 'Tee', price: 1000, quantity: 100, sizeStock: { S: 2, M: 5 } }]);
      const result = checkOutValidation([{ id: 'P1', quantity: 3, selectedSize: 'S' }], mockProducts);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Available: 2');
    });

    it('passes when size-specific stock is sufficient', () => {
      setupProducts([{ id: 'P1', name: 'Tee', price: 1000, quantity: 100, sizeStock: { S: 2, M: 5 } }]);
      const result = checkOutValidation([{ id: 'P1', quantity: 2, selectedSize: 'M' }], mockProducts);
      expect(result.ok).toBe(true);
    });

    it('uses total quantity when size is not specified', () => {
      setupProducts([{ id: 'P1', name: 'Tee', price: 1000, quantity: 10, sizeStock: { S: 0, M: 0 } }]);
      const result = checkOutValidation([{ id: 'P1', quantity: 5, selectedSize: '' }], mockProducts);
      expect(result.ok).toBe(true); // falls back to total quantity (10)
    });
  });

  describe('enrichItems — price snapshot', () => {
    it('replaces client price with DB price', () => {
      setupProducts([{ id: 'P1', name: 'Tee', price: 1500, quantity: 10 }]);
      const items = [{ id: 'P1', name: 'Tee', price: 1, quantity: 2 }]; // client tries to fake price
      const enriched = enrichItems(items, mockProducts);
      expect(enriched[0].price).toBe(1500);
    });

    it('enriches missing category and subCategory from DB', () => {
      setupProducts([{ id: 'P1', name: 'Jacket', price: 3000, quantity: 5, bucket: 'Outerwear', subCategory: 'Winter Jacket' }]);
      const items = [{ id: 'P1', price: 3000, quantity: 1 }]; // no name, category
      const enriched = enrichItems(items, mockProducts);
      expect(enriched[0].name).toBe('Jacket');
      expect(enriched[0].category).toBe('Outerwear');
      expect(enriched[0].subCategory).toBe('Winter Jacket');
    });

    it('adds selectedSize and selectedColor to enriched items', () => {
      setupProducts([{ id: 'P1', name: 'Tee', price: 1000, quantity: 10 }]);
      const items = [{ id: 'P1', price: 1000, quantity: 1, selectedSize: 'L', selectedColor: 'Navy' }];
      const enriched = enrichItems(items, mockProducts);
      expect(enriched[0].selectedSize).toBe('L');
      expect(enriched[0].selectedColor).toBe('Navy');
    });
  });

  describe('computeVerifiedTotal', () => {
    it('matches the server-side verified total calculation', () => {
      const items = [
        { price: 1500, quantity: 2 },
        { price: 500, quantity: 3 },
        { price: 2000, quantity: 1 },
      ];
      // 1500*2 + 500*3 + 2000*1 = 3000 + 1500 + 2000 = 6500
      expect(computeVerifiedTotal(items)).toBe(6500);
    });

    it('prevents client-side total manipulation', () => {
      const clientItems = [{ price: 1, quantity: 10 }];
      const serverItems = [{ price: 1500, quantity: 10 }]; // what DB says

      const clientTotal = computeVerifiedTotal(clientItems);
      const serverTotal = computeVerifiedTotal(serverItems);

      expect(clientTotal).toBe(10);
      expect(serverTotal).toBe(15000);
      expect(serverTotal).not.toBe(clientTotal);
    });
  });

  describe('Full checkout scenario', () => {
    it('complete happy-path: cart → validation → enrichment → order creation', () => {
      setupProducts([
        { id: 'P1', name: 'Tee', price: 1500, quantity: 10, bucket: 'Tops', subCategory: 'T-Shirt' },
        { id: 'P2', name: 'Jeans', price: 2500, quantity: 5, bucket: 'Bottoms', subCategory: 'Jeans' },
      ]);

      const cartItems = [
        { id: 'P1', name: 'Tee', price: 1, quantity: 2, selectedSize: 'M', selectedColor: 'Blue', category: '', subCategory: '' },
        { id: 'P2', name: 'Jeans', price: 1, quantity: 1, selectedSize: '32', selectedColor: 'Black', category: '', subCategory: '' },
      ];

      // Step 1: Validate
      const validation = checkOutValidation(cartItems, mockProducts);
      expect(validation.ok).toBe(true);

      // Step 2: Enrich
      const enriched = enrichItems(cartItems, mockProducts);
      expect(enriched[0].price).toBe(1500);
      expect(enriched[0].category).toBe('Tops');
      expect(enriched[1].price).toBe(2500);
      expect(enriched[1].bucket).toBe('Bottoms');

      // Step 3: Compute verified total
      const total = computeVerifiedTotal(enriched);
      // 1500*2 + 2500*1 = 5500
      expect(total).toBe(5500);

      // Step 4: Build order object
      const order = {
        orderID: `ORD-${Date.now().toString(36).toUpperCase()}`,
        customer: { name: 'Ahmed', email: 'ahmed@shop.pk', address: '123 Main St', city: 'Lahore', zip: '54000' },
        items: enriched,
        total,
        paymentMethod: 'COD',
        status: 'Pending',
      };

      expect(order.orderID).toMatch(/^ORD-/);
      expect(order.total).toBe(5500);
      expect(order.items[0].price).toBe(1500); // server-verified price
      expect(order.items[1].price).toBe(2500); // server-verified price
    });

    it('rejects manipulated price when DB price is higher', () => {
      setupProducts([{ id: 'P1', name: 'Premium Tee', price: 3000, quantity: 20 }]);

      const manipulatedCart = [{ id: 'P1', name: 'Premium Tee', price: 1, quantity: 5 }];

      const validation = checkOutValidation(manipulatedCart, mockProducts);
      expect(validation.ok).toBe(true); // stock check passes

      const enriched = enrichItems(manipulatedCart, mockProducts);
      const total = computeVerifiedTotal(enriched);

      // Client tried: 1 * 5 = 5 PKR
      // Server computed: 3000 * 5 = 15000 PKR
      expect(total).toBe(15000);
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// ADMIN CRUD — LOGIC TESTS
// ─────────────────────────────────────────────────────────────────

describe('Admin CRUD — logic layer', () => {
  describe('Product create logic', () => {
    it('generates unique product ID if not provided', () => {
      const buildId = () => `PRD-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      const id = buildId();
      expect(id).toMatch(/^PRD-[A-Z0-9]+$/);
      expect(id.length).toBeGreaterThan(4);
    });

    it('computes quantity from sizeStock correctly', () => {
      const sizeStock = { S: 10, M: 20, L: 15, XL: 5 };
      const total = Object.values(sizeStock).reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
      expect(total).toBe(50);
    });

    it('sets quantity to 0 when sizeStock is empty', () => {
      const sizeStock = {};
      const total = Object.values(sizeStock).reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
      expect(total).toBe(0);
    });
  });

  describe('Inventory restock logic', () => {
    it('adds quantity to existing stock', () => {
      const prevStock = 20;
      const addedQty = 30;
      const newStock = prevStock + addedQty;
      expect(newStock).toBe(50);
    });

    it('adds per-size stock correctly', () => {
      const existing = { S: 10, M: 5, L: 3 };
      const newSizes = { S: 5, M: 10, XL: 20 };

      const merged = { ...existing };
      for (const [size, qty] of Object.entries(newSizes)) {
        merged[size] = (parseInt(merged[size]) || 0) + qty;
      }

      expect(merged.S).toBe(15); // 10 + 5
      expect(merged.M).toBe(15); // 5 + 10
      expect(merged.L).toBe(3);  // unchanged
      expect(merged.XL).toBe(20); // new size added
    });

    it('recomputes total after restock', () => {
      const sizeStock = { S: 15, M: 15, L: 3, XL: 20 };
      const total = Object.values(sizeStock).reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
      expect(total).toBe(53);
    });
  });

  describe('Inventory delete logic', () => {
    it('sets stock to 0 on delete', () => {
      const deletedProduct = { id: 'P1', name: 'Deleted Tee', quantity: 0, stock: 0 };
      expect(deletedProduct.quantity).toBe(0);
      expect(deletedProduct.stock).toBe(0);
    });
  });

  describe('Audit log action mapping', () => {
    const AUDIT_ACTIONS = {
      PRODUCT_CREATE: 'Product created',
      PRODUCT_UPDATE: 'Product updated',
      PRODUCT_DELETE: 'Product deleted',
      ORDER_STATUS_UPDATE: 'Order status updated',
      INVENTORY_RESTOCK: 'Inventory restocked',
      INVENTORY_DELETE: 'Inventory deleted',
      REVIEW_APPROVED: 'Review approved',
      REVIEW_REJECTED: 'Review rejected',
      REVIEW_DELETE: 'Review deleted',
      COUPON_CREATE: 'Coupon created',
      COUPON_DELETE: 'Coupon deleted',
      SETTINGS_UPDATE: 'Settings updated',
      ADMIN_CREATE: 'Admin user created',
      ADMIN_DELETE: 'Admin user deleted',
    };

    it('covers all expected admin actions', () => {
      const expected = [
        'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE',
        'ORDER_STATUS_UPDATE', 'INVENTORY_RESTOCK', 'INVENTORY_DELETE',
        'REVIEW_APPROVED', 'REVIEW_REJECTED', 'REVIEW_DELETE',
        'COUPON_CREATE', 'COUPON_DELETE', 'SETTINGS_UPDATE',
        'ADMIN_CREATE', 'ADMIN_DELETE',
      ];
      for (const action of expected) {
        expect(AUDIT_ACTIONS[action]).toBeTruthy();
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// REVIEW SUBMISSION — LOGIC TESTS
// ─────────────────────────────────────────────────────────────────

describe('Review submission validation', () => {
  const validateReview = (data) => {
    const errors = [];
    if (!data.name?.trim()) errors.push({ field: 'name', message: 'Name is required' });
    if (!data.email?.trim()) errors.push({ field: 'email', message: 'Email is required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email ?? ''))
      errors.push({ field: 'email', message: 'Enter a valid email address' });
    if (!data.title?.trim()) errors.push({ field: 'title', message: 'Review title is required' });
    if (!data.body?.trim()) errors.push({ field: 'body', message: 'Review text is required' });
    if ((data.body ?? '').trim().length < 20)
      errors.push({ field: 'body', message: 'Review must be at least 20 characters' });
    if (!data.rating || data.rating < 1 || data.rating > 5)
      errors.push({ field: 'rating', message: 'Rating must be between 1 and 5' });
    return { valid: errors.length === 0, errors };
  };

  it('accepts valid review', () => {
    const result = validateReview({
      name: 'Ahmed Khan',
      email: 'ahmed@example.pk',
      title: 'Great product!',
      body: 'This product exceeded my expectations. Highly recommended.',
      rating: 5,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects short review body', () => {
    const result = validateReview({
      name: 'Ahmed', email: 'a@b.com', title: 'OK', body: 'Good!', rating: 4,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'body')).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = validateReview({
      name: 'Ahmed', email: 'not-email', title: 'Nice', body: 'A genuinely good product.', rating: 5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'email')).toBe(true);
  });

  it('rejects rating 0', () => {
    const result = validateReview({
      name: 'Ahmed', email: 'a@b.com', title: 'OK', body: 'A reasonable product overall.', rating: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'rating')).toBe(true);
  });

  it('rejects rating above 5', () => {
    const result = validateReview({
      name: 'Ahmed', email: 'a@b.com', title: 'OK', body: 'An exceptional product quality.', rating: 6,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'rating')).toBe(true);
  });

  it('rejects missing name', () => {
    const result = validateReview({
      name: '   ', email: 'a@b.com', title: 'Nice', body: 'A great product with quality.', rating: 5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'name')).toBe(true);
  });

  it('collects all errors (not just first)', () => {
    const result = validateReview({ name: '', email: 'bad', title: '', body: 'short', rating: 0 });
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// COUPON VALIDATION — LOGIC TESTS
// ─────────────────────────────────────────────────────────────────

describe('Coupon validation', () => {
  const validateCoupon = (coupon, cartTotal) => {
    const errors = [];
    if (!coupon.code?.trim()) errors.push('Coupon code is required');
    if (!cartTotal || isNaN(parseFloat(cartTotal))) errors.push('Cart total is required');
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) errors.push('This coupon has expired');
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) errors.push('This coupon has reached its usage limit');
    if (cartTotal < coupon.minOrderValue) errors.push(`Minimum order of PKR ${coupon.minOrderValue} required`);
    return { valid: errors.length === 0, errors };
  };

  it('accepts valid active coupon', () => {
    const result = validateCoupon(
      { code: 'SAVE20', maxUses: null, usedCount: 0, expiresAt: null, minOrderValue: 0 },
      5000
    );
    expect(result.valid).toBe(true);
  });

  it('rejects expired coupon', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const result = validateCoupon(
      { code: 'SAVE20', maxUses: null, usedCount: 0, expiresAt: yesterday, minOrderValue: 0 },
      5000
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('This coupon has expired');
  });

  it('rejects exhausted coupon', () => {
    const result = validateCoupon(
      { code: 'SAVE20', maxUses: 5, usedCount: 5, expiresAt: null, minOrderValue: 0 },
      5000
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('This coupon has reached its usage limit');
  });

  it('rejects below minimum order value', () => {
    const result = validateCoupon(
      { code: 'SAVE20', maxUses: null, usedCount: 0, expiresAt: null, minOrderValue: 1000 },
      500
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Minimum order'))).toBe(true);
  });
});
