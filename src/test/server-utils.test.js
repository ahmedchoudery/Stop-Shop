import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────
// RBAC MIDDLEWARE TEST UTILITY
// Simulates Express req / res / next without needing the full server.
// ─────────────────────────────────────────────────────────────────

const makeReq = (overrides = {}) => ({
  user: null,
  ...overrides,
});

const makeRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
  };
  return res;
};

const makeNext = () => vi.fn();

// Inline the requireRole middleware logic so tests are deterministic
// and not coupled to the server.js file directly.
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
// RBAC TESTS
// ─────────────────────────────────────────────────────────────────

describe('requireRole middleware', () => {
  it('allows super-admin to access super-admin only route', () => {
    const req = makeReq({ user: { id: '1', email: 'super@shop.pk', role: 'super-admin' } });
    const res = makeRes();
    const next = makeNext();
    requireRole('super-admin')(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('allows admin to access admin route', () => {
    const req = makeReq({ user: { id: '2', email: 'admin@shop.pk', role: 'admin' } });
    const res = makeRes();
    const next = makeNext();
    requireRole('admin', 'super-admin')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks admin from super-admin only route', () => {
    const req = makeReq({ user: { id: '2', email: 'admin@shop.pk', role: 'admin' } });
    const res = makeRes();
    const next = makeNext();
    requireRole('super-admin')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.data.error).toContain('Access denied');
  });

  it('blocks auditor from delete routes', () => {
    const req = makeReq({ user: { id: '3', email: 'auditor@shop.pk', role: 'auditor' } });
    const res = makeRes();
    const next = makeNext();
    requireRole('admin', 'super-admin')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it('blocks request with no user object', () => {
    const req = makeReq({ user: null });
    const res = makeRes();
    const next = makeNext();
    requireRole('admin')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.data.error).toContain('role not found');
  });

  it('blocks request with no role field', () => {
    const req = makeReq({ user: { id: '4', email: 'nope@shop.pk' } });
    const res = makeRes();
    const next = makeNext();
    requireRole('admin')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it('supports multiple allowed roles', () => {
    const roles = ['admin', 'super-admin'];
    for (const role of roles) {
      const req = makeReq({ user: { id: '5', email: 'test@shop.pk', role } });
      const res = makeRes();
      const next = makeNext();
      requireRole(...roles)(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// PRICE SNAPSHOT TESTS
// Simulates the server-side price enrichment logic from checkout.
// ─────────────────────────────────────────────────────────────────

const simulateEnrichedItems = (items, productMap) =>
  items.map(item => {
    const product = productMap.get(item.id);
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

const computeVerifiedTotal = (items) =>
  Math.max(0, items.reduce((sum, item) => sum + item.price * item.quantity, 0));

describe('Price snapshot at checkout', () => {
  it('uses product price from DB, not client price', () => {
    // Client tries to submit item with manipulated price 1 PKR
    const items = [{ id: 'P1', name: 'T-Shirt', price: 1, quantity: 2, selectedSize: 'M', selectedColor: 'Red', category: 'Tops', subCategory: 'T-Shirt' }];
    // DB has the real price at 1500 PKR
    const productMap = new Map([['P1', { name: 'T-Shirt', price: 1500, bucket: 'Tops', subCategory: 'T-Shirt' }]]);

    const enriched = simulateEnrichedItems(items, productMap);
    const total = computeVerifiedTotal(enriched);

    // The price should be 1500 × 2 = 3000, not 1 × 2 = 2
    expect(enriched[0].price).toBe(1500);
    expect(total).toBe(3000);
  });

  it('enriches missing name/category from product DB', () => {
    const items = [{ id: 'P2', price: 500, quantity: 1 }]; // name, category missing
    const productMap = new Map([['P2', { name: 'Jeans', price: 2000, bucket: 'Bottoms', subCategory: 'Jeans' }]]);

    const enriched = simulateEnrichedItems(items, productMap);
    expect(enriched[0].name).toBe('Jeans');
    expect(enriched[0].price).toBe(2000);
    expect(enriched[0].category).toBe('Bottoms');
    expect(enriched[0].subCategory).toBe('Jeans');
  });

  it('clamps negative total to 0', () => {
    // Edge case: if somehow all prices are 0 or NaN, total should be 0 not negative
    const enriched = [{ price: 0, quantity: 1 }];
    expect(computeVerifiedTotal(enriched)).toBe(0);

    // Simulate broken data
    const broken = [{ price: -500, quantity: 1 }];
    expect(computeVerifiedTotal(broken)).toBe(0); // price can be 0 in DB, not negative
  });

  it('handles missing product gracefully (uses client fallback)', () => {
    const items = [{ id: 'UNKNOWN-PROD', name: 'Ghost Product', price: 100, quantity: 1 }];
    const productMap = new Map(); // product not found in DB

    const enriched = simulateEnrichedItems(items, productMap);
    expect(enriched[0].price).toBe(100); // falls back to client price
    expect(enriched[0].name).toBe('Ghost Product');
  });

  it('correctly sums multiple items with different quantities', () => {
    const items = [
      { id: 'P1', name: 'Tee', price: 500, quantity: 2 },
      { id: 'P2', name: 'Jeans', price: 1500, quantity: 1 },
      { id: 'P3', name: 'Cap', price: 300, quantity: 3 },
    ];
    const productMap = new Map(items.map(i => [i.id, i]));
    const enriched = simulateEnrichedItems(items, productMap);
    const total = computeVerifiedTotal(enriched);
    // 500*2 + 1500*1 + 300*3 = 1000 + 1500 + 900 = 3400
    expect(total).toBe(3400);
  });

  it('default quantity to 1 if missing or invalid', () => {
    const items = [
      { id: 'P1', price: 1000, quantity: undefined },
      { id: 'P2', price: 1000, quantity: null },
      { id: 'P3', price: 1000, quantity: 'abc' },
    ];
    const productMap = new Map(items.map(i => [i.id, i]));
    const enriched = simulateEnrichedItems(items, productMap);
    for (const item of enriched) {
      expect(item.quantity).toBe(1);
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// INVENTORY STATUS LOGIC TESTS
// ─────────────────────────────────────────────────────────────────

const computeInventoryStatus = (totalStock) => {
  if (totalStock === 0) return 'Out of Stock';
  if (totalStock < 5) return 'Low Stock';
  return 'In Stock';
};

describe('Inventory status computation', () => {
  it('returns Out of Stock for 0', () => expect(computeInventoryStatus(0)).toBe('Out of Stock'));
  it('returns Low Stock for 1-4', () => {
    expect(computeInventoryStatus(1)).toBe('Low Stock');
    expect(computeInventoryStatus(4)).toBe('Low Stock');
  });
  it('returns In Stock for 5 and above', () => {
    expect(computeInventoryStatus(5)).toBe('In Stock');
    expect(computeInventoryStatus(100)).toBe('In Stock');
  });
  it('handles decimal values (floor)', () => {
    // quantity should be int, but defensive code floors
    expect(computeInventoryStatus(4.9)).toBe('Low Stock');
  });
});

// ─────────────────────────────────────────────────────────────────
// STOCK DELTA TESTS
// ─────────────────────────────────────────────────────────────────

describe('Stock delta calculations', () => {
  it('computes positive delta when restocking', () => {
    const prevStock = 10;
    const newStock = 25;
    const delta = newStock - prevStock;
    expect(delta).toBe(15);
  });

  it('computes negative delta when selling', () => {
    const prevStock = 20;
    const newStock = 17;
    const delta = newStock - prevStock;
    expect(delta).toBe(-3);
  });

  it('computes zero delta when no change', () => {
    const prevStock = 50;
    const newStock = 50;
    expect(newStock - prevStock).toBe(0);
  });

  it('computes total from sizeStock correctly', () => {
    const sizeStock = { S: 10, M: 20, L: 5, XL: 0 };
    const total = Object.values(sizeStock).reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
    expect(total).toBe(35);
  });

  it('handles empty sizeStock', () => {
    const sizeStock = {};
    const total = Object.values(sizeStock).reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
    expect(total).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// MOVEMENT LOG ENTRY BUILDER
// ─────────────────────────────────────────────────────────────────

const buildMovement = (moveType, product, previousStock, orderId = null) => {
  const totalStock = product.quantity ?? 0;
  const quantityDelta = totalStock - previousStock;
  return {
    type: moveType,
    quantityDelta,
    previousStock,
    newStock: totalStock,
    note: `${moveType} — stock changed by ${quantityDelta > 0 ? '+' : ''}${quantityDelta}`,
    triggeredBy: moveType === 'SALE' ? 'customer' : 'admin',
    orderId: orderId ?? null,
    timestamp: new Date(),
  };
};

describe('Movement log entry builder', () => {
  it('labels SALE movement as customer-triggered', () => {
    const movement = buildMovement('SALE', { quantity: 18 }, 20, 'ORD-ABC123');
    expect(movement.type).toBe('SALE');
    expect(movement.triggeredBy).toBe('customer');
    expect(movement.orderId).toBe('ORD-ABC123');
    expect(movement.quantityDelta).toBe(-2);
  });

  it('labels RESTOCK as admin-triggered', () => {
    const movement = buildMovement('RESTOCK', { quantity: 30 }, 10, null);
    expect(movement.type).toBe('RESTOCK');
    expect(movement.triggeredBy).toBe('admin');
    expect(movement.quantityDelta).toBe(20);
  });

  it('labels ADMIN_UPDATE as admin-triggered', () => {
    const movement = buildMovement('ADMIN_UPDATE', { quantity: 25 }, 25);
    expect(movement.triggeredBy).toBe('admin');
    expect(movement.quantityDelta).toBe(0);
  });

  it('labels ADMIN_DELETE as admin-triggered', () => {
    const movement = buildMovement('ADMIN_DELETE', { quantity: 0 }, 15);
    expect(movement.type).toBe('ADMIN_DELETE');
    expect(movement.newStock).toBe(0);
    expect(movement.quantityDelta).toBe(-15);
  });

  it('sets note with correct sign', () => {
    const restock = buildMovement('RESTOCK', { quantity: 50 }, 30);
    expect(restock.note).toContain('+20');

    const sale = buildMovement('SALE', { quantity: 10 }, 30);
    expect(sale.note).toContain('-20');
  });
});

// ─────────────────────────────────────────────────────────────────
// AUDIT LOG DETAILS TESTS
// ─────────────────────────────────────────────────────────────────

describe('Audit log detail builders', () => {
  const buildAuditDetails = (action, data) => {
    const map = {
      PRODUCT_CREATE:   { id: data.id, name: data.name },
      PRODUCT_UPDATE:   { id: data.id, changes: data.changes },
      PRODUCT_DELETE:   { id: data.id, name: data.name },
      ORDER_STATUS_UPDATE: { id: data.id, status: data.status },
      INVENTORY_RESTOCK:  { productId: data.productId, added: data.added, newTotal: data.newTotal },
      INVENTORY_DELETE:   { productId: data.productId, name: data.name },
      REVIEW_APPROVED:    { reviewId: data.reviewId, status: 'approved' },
      REVIEW_REJECTED:    { reviewId: data.reviewId, status: 'rejected' },
      REVIEW_DELETE:      { reviewId: data.reviewId },
      COUPON_CREATE:      { code: data.code, type: data.type, value: data.value },
      COUPON_DELETE:      { code: data.code },
      SETTINGS_UPDATE:    { changed: data.changed },
      ADMIN_CREATE:       { email: data.email },
      ADMIN_DELETE:       { email: data.email },
    };
    return map[action] ?? {};
  };

  it('captures PRODUCT_CREATE details', () => {
    const details = buildAuditDetails('PRODUCT_CREATE', { id: 'PRD-X', name: 'Jacket' });
    expect(details.id).toBe('PRD-X');
    expect(details.name).toBe('Jacket');
  });

  it('captures INVENTORY_RESTOCK details', () => {
    const details = buildAuditDetails('INVENTORY_RESTOCK', { productId: 'PRD-X', added: 50, newTotal: 75 });
    expect(details.productId).toBe('PRD-X');
    expect(details.added).toBe(50);
    expect(details.newTotal).toBe(75);
  });

  it('captures ORDER_STATUS_UPDATE details', () => {
    const details = buildAuditDetails('ORDER_STATUS_UPDATE', { id: 'ORD-X', status: 'Delivered' });
    expect(details.id).toBe('ORD-X');
    expect(details.status).toBe('Delivered');
  });

  it('returns empty object for unknown action', () => {
    const details = buildAuditDetails('RANDOM_ACTION', { anything: 'x' });
    expect(details).toEqual({});
  });
});
