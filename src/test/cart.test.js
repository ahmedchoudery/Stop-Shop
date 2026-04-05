import { describe, it, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────────
// CART CALCULATION TESTS
// Mirrors the actual cart context logic used in the frontend.
// ─────────────────────────────────────────────────────────────────

describe('Cart calculations', () => {
  const computeCartCount = (items) =>
    items.reduce((sum, item) => sum + Math.max(1, parseInt(item.quantity) || 1), 0);

  const computeCartTotal = (items) =>
    items.reduce((sum, item) => sum + (item.price || 0) * Math.max(1, parseInt(item.quantity) || 1), 0);

  describe('Cart count', () => {
    it('sums item quantities correctly', () => {
      const cart = [
        { id: 'P1', quantity: 2 },
        { id: 'P2', quantity: 3 },
        { id: 'P3', quantity: 1 },
      ];
      expect(computeCartCount(cart)).toBe(6);
    });

    it('defaults missing quantity to 1', () => {
      const cart = [
        { id: 'P1' },
        { id: 'P2', quantity: undefined },
        { id: 'P3', quantity: null },
        { id: 'P4', quantity: 'abc' },
      ];
      expect(computeCartCount(cart)).toBe(4);
    });

    it('handles empty cart', () => expect(computeCartCount([])).toBe(0));
    it('handles zero quantity as 1', () => {
      expect(computeCartCount([{ id: 'P1', quantity: 0 }])).toBe(1);
    });
  });

  describe('Cart total', () => {
    it('computes correct total for single item', () => {
      const cart = [{ id: 'P1', price: 1500, quantity: 2 }];
      expect(computeCartTotal(cart)).toBe(3000);
    });

    it('computes correct total for multiple items', () => {
      const cart = [
        { id: 'P1', price: 1000, quantity: 2 },
        { id: 'P2', price: 500, quantity: 3 },
        { id: 'P3', price: 250, quantity: 4 },
      ];
      // 1000*2 + 500*3 + 250*4 = 2000 + 1500 + 1000 = 4500
      expect(computeCartTotal(cart)).toBe(4500);
    });

    it('treats missing price as 0', () => {
      const cart = [{ id: 'P1' }, { id: 'P2', price: 1000, quantity: 1 }];
      expect(computeCartTotal(cart)).toBe(1000);
    });

    it('handles empty cart', () => expect(computeCartTotal([])).toBe(0));
    it('handles all-zero prices', () => {
      expect(computeCartTotal([{ price: 0, quantity: 100 }])).toBe(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// COUPON DISCOUNT CALCULATION TESTS
// Mirrors the server-side coupon validation logic.
// ─────────────────────────────────────────────────────────────────

describe('Coupon discount calculations', () => {
  const applyDiscount = (cartTotal, coupon) => {
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return null; // expired
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return null; // exhausted
    if (cartTotal < coupon.minOrderValue) return null; // below minimum

    const discount = coupon.type === 'percentage'
      ? Math.round((cartTotal * coupon.value) / 100)
      : Math.min(coupon.value, cartTotal);

    return { discount, finalTotal: Math.max(0, cartTotal - discount) };
  };

  it('applies percentage discount correctly', () => {
    const result = applyDiscount(5000, { type: 'percentage', value: 20, maxUses: null, usedCount: 0, expiresAt: null, minOrderValue: 0 });
    expect(result.discount).toBe(1000); // 20% of 5000
    expect(result.finalTotal).toBe(4000);
  });

  it('applies fixed PKR discount correctly', () => {
    const result = applyDiscount(3000, { type: 'fixed', value: 500, maxUses: null, usedCount: 0, expiresAt: null, minOrderValue: 0 });
    expect(result.discount).toBe(500);
    expect(result.finalTotal).toBe(2500);
  });

  it('caps fixed discount at cart total (no negative total)', () => {
    const result = applyDiscount(200, { type: 'fixed', value: 500, maxUses: null, usedCount: 0, expiresAt: null, minOrderValue: 0 });
    expect(result.discount).toBe(200);
    expect(result.finalTotal).toBe(0);
  });

  it('rejects expired coupon', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const result = applyDiscount(5000, { type: 'percentage', value: 20, maxUses: null, usedCount: 0, expiresAt: yesterday, minOrderValue: 0 });
    expect(result).toBeNull();
  });

  it('rejects exhausted coupon', () => {
    const result = applyDiscount(5000, { type: 'percentage', value: 50, maxUses: 10, usedCount: 10, expiresAt: null, minOrderValue: 0 });
    expect(result).toBeNull();
  });

  it('rejects when below minimum order value', () => {
    const result = applyDiscount(300, { type: 'percentage', value: 20, maxUses: null, usedCount: 0, expiresAt: null, minOrderValue: 1000 });
    expect(result).toBeNull();
  });

  it('accepts coupon at exactly minimum order value', () => {
    const result = applyDiscount(1000, { type: 'percentage', value: 10, maxUses: null, usedCount: 0, expiresAt: null, minOrderValue: 1000 });
    expect(result.discount).toBe(100);
    expect(result.finalTotal).toBe(900);
  });

  it('handles 100% percentage discount (free order)', () => {
    const result = applyDiscount(5000, { type: 'percentage', value: 100, maxUses: null, usedCount: 0, expiresAt: null, minOrderValue: 0 });
    expect(result.discount).toBe(5000);
    expect(result.finalTotal).toBe(0);
  });

  it('rounds percentage discount (no decimals)', () => {
    const result = applyDiscount(999, { type: 'percentage', value: 20, maxUses: null, usedCount: 0, expiresAt: null, minOrderValue: 0 });
    expect(result.discount).toBe(200); // Math.round(199.8) = 200
    expect(Number.isInteger(result.discount)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// STOCK VALIDATION TESTS
// Simulates the server-side stock-check logic from checkout.
// ─────────────────────────────────────────────────────────────────

describe('Stock validation', () => {
  const checkStock = (product, requestedQty, requestedSize) => {
    const size      = (requestedSize ?? '').trim();
    const available = (size && product.sizeStock)
      ? (product.sizeStock[size] ?? 0)
      : product.quantity;

    if (available < requestedQty) {
      return {
        available,
        requested: requestedQty,
        shortfall: requestedQty - available,
        ok: false,
      };
    }
    return { available, requested: requestedQty, ok: true };
  };

  it('passes when sufficient stock (no size)', () => {
    const result = checkStock({ quantity: 10 }, 3, '');
    expect(result.ok).toBe(true);
    expect(result.available).toBe(10);
  });

  it('passes when sufficient stock (with size)', () => {
    const result = checkStock({ quantity: 10, sizeStock: { S: 5, M: 3, L: 2 } }, 2, 'M');
    expect(result.ok).toBe(true);
    expect(result.available).toBe(3);
  });

  it('fails when insufficient total stock', () => {
    const result = checkStock({ quantity: 2 }, 5, '');
    expect(result.ok).toBe(false);
    expect(result.shortfall).toBe(3);
  });

  it('fails when insufficient size stock', () => {
    const result = checkStock({ quantity: 100, sizeStock: { S: 1, M: 0, L: 5 } }, 2, 'M');
    expect(result.ok).toBe(false);
    expect(result.available).toBe(0);
    expect(result.shortfall).toBe(2);
  });

  it('fails when requested size not in sizeStock map', () => {
    const result = checkStock({ quantity: 50, sizeStock: { S: 10, M: 10 } }, 3, 'XXL');
    expect(result.ok).toBe(false);
    expect(result.available).toBe(0); // not found → 0
  });

  it('handles undefined sizeStock gracefully', () => {
    const result = checkStock({ quantity: 5, sizeStock: undefined }, 3, 'M');
    expect(result.ok).toBe(true);
    expect(result.available).toBe(5); // falls back to total quantity
  });

  it('handles exact stock match (available === requested)', () => {
    const result = checkStock({ quantity: 5 }, 5, '');
    expect(result.ok).toBe(true);
    expect(result.shortfall).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────
// ORDER ID FORMAT TESTS
// ─────────────────────────────────────────────────────────────────

describe('Order ID format', () => {
  const isValidOrderId = (id) => /^ORD-[A-Z0-9]+$/i.test(id ?? '');

  it('accepts valid order IDs', () => {
    expect(isValidOrderId('ORD-ABC123XYZ')).toBe(true);
    expect(isValidOrderId('ORD-abc123xyz')).toBe(true);
    expect(isValidOrderId('ORD-M3K9L2P7Q1')).toBe(true);
  });

  it('rejects invalid order IDs', () => {
    expect(isValidOrderId('ORD-')).toBe(false);     // empty after prefix
    expect(isValidOrderId('ORDER-123')).toBe(false); // wrong prefix
    expect(isValidOrderId('123456789')).toBe(false); // no prefix
    expect(isValidOrderId('')).toBe(false);
    expect(isValidOrderId(null)).toBe(false);
    expect(isValidOrderId(undefined)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// PRODUCT ID FORMAT TESTS
// ─────────────────────────────────────────────────────────────────

describe('Product ID format', () => {
  const isValidProductId = (id) => /^PRD-[A-Z0-9]{4,}$/i.test(id ?? '');

  it('accepts valid product IDs', () => {
    expect(isValidProductId('PRD-ABC12345')).toBe(true);
    expect(isValidProductId('PRD-TEST0000')).toBe(true);
  });

  it('rejects invalid product IDs', () => {
    expect(isValidProductId('PRD-XYZ')).toBe(false); // too short (< 4 chars after prefix)
    expect(isValidProductId('PRD-')).toBe(false);
    expect(isValidProductId('ITEM-12345')).toBe(false);
    expect(isValidProductId('')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// PAYMENT METHOD VALIDATION TESTS
// ─────────────────────────────────────────────────────────────────

describe('Payment method validation', () => {
  const VALID_METHODS = ['COD', 'ATM Card', 'Bank Transfer', 'Easypaisa', 'JazzCash'];
  const isValidPaymentMethod = (method) => VALID_METHODS.includes(method);

  it('accepts all valid payment methods', () => {
    for (const method of VALID_METHODS) {
      expect(isValidPaymentMethod(method)).toBe(true);
    }
  });

  it('rejects invalid payment methods', () => {
    const invalid = ['Cash', 'Credit Card', 'PayPal', 'Stripe', 'Bitcoin', '', null, undefined];
    for (const method of invalid) {
      expect(isValidPaymentMethod(method)).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// EMAIL VALIDATION TESTS
// ─────────────────────────────────────────────────────────────────

describe('Email validation', () => {
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '');

  it('accepts valid emails', () => {
    const valid = ['test@example.com', 'user.name@domain.pk', 'admin@stopshop.pk', 'a@b.co'];
    for (const email of valid) {
      expect(validateEmail(email)).toBe(true);
    }
  });

  it('rejects invalid emails', () => {
    const invalid = ['not-email', 'missing@domain', '@nodomain.com', 'spaces in@email.com', '', null, undefined];
    for (const email of invalid) {
      expect(validateEmail(email)).toBe(false);
    }
  });
});
