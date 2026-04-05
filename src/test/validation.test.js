import { describe, it, expect } from 'vitest';
import {
  validate,
  loginSchema,
  createProductSchema,
  updateProductSchema,
  checkoutSchema,
  updateOrderStatusSchema,
  createAdminSchema,
  updateSettingsSchema,
} from '../schemas/validation.js';

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

const assertValid = (schema, input) => {
  const result = validate(schema, input);
  expect(result.success, `Expected valid: ${JSON.stringify(result)}`).toBe(true);
  return result.data;
};

const assertInvalid = (schema, input, field) => {
  const result = validate(schema, input);
  expect(result.success, `Expected invalid for field: ${field}`).toBe(false);
  if (field) {
    expect(result.errors.some(e => e.field === field || e.field.startsWith(field + '.'))).toBe(true);
  }
};

// ─────────────────────────────────────────────────────────────────
// LOGIN SCHEMA
// ─────────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts valid email + password', () => {
    const data = assertValid(loginSchema, { email: 'admin@stopshop.pk', password: 'supersecret' });
    expect(data.email).toBe('admin@stopshop.pk');
  });

  it('rejects missing email', () => assertInvalid(loginSchema, { password: 'x' }, 'email'));
  it('rejects invalid email format', () => assertInvalid(loginSchema, { email: 'not-an-email', password: 'x' }, 'email'));
  it('rejects missing password', () => assertInvalid(loginSchema, { email: 'a@b.com' }, 'password'));
  it('trims and lowercases email', () => {
    const data = assertValid(loginSchema, { email: '  ADMIN@StopShop.PK  ', password: 'x' });
    expect(data.email).toBe('admin@stopshop.pk');
  });
});

// ─────────────────────────────────────────────────────────────────
// PRODUCT SCHEMAS
// ─────────────────────────────────────────────────────────────────

describe('createProductSchema', () => {
  const minimal = { name: 'Classic Tee', price: 999 };

  it('accepts minimal valid product', () => {
    const data = assertValid(createProductSchema, minimal);
    expect(data.name).toBe('Classic Tee');
    expect(data.price).toBe(999);
    expect(data.quantity).toBe(0);
    expect(data.rating).toBe(5);
    expect(data.bucket).toBe('Tops');
  });

  it('accepts full product with all fields', () => {
    const full = {
      id: 'PRD-TEST12345',
      name: 'Premium Hoodie',
      price: 2999,
      quantity: 50,
      stock: 50,
      image: 'https://cdn.example.com/hoodie.jpg',
      mediaType: 'url',
      embedCode: '',
      rating: 4,
      bucket: 'Outerwear',
      subCategory: 'Hoodie',
      specs: ['100% Cotton', 'Machine washable'],
      colors: ['Black', 'Navy'],
      sizes: ['S', 'M', 'L', 'XL'],
      sizeStock: { S: 10, M: 20, L: 15, XL: 5 },
      lifestyleImage: '',
      variantImages: { Black: 'https://cdn.example.com/black.jpg' },
      gallery: [],
    };
    const data = assertValid(createProductSchema, full);
    expect(data.id).toBe('PRD-TEST12345');
    expect(data.sizeStock.S).toBe(10);
    expect(data.variantImages.Black).toBe('https://cdn.example.com/black.jpg');
  });

  it('rejects negative price', () => assertInvalid(createProductSchema, { ...minimal, price: -100 }, 'price'));
  it('rejects non-numeric price', () => assertInvalid(createProductSchema, { ...minimal, price: 'free' }, 'price'));
  it('rejects missing name', () => assertInvalid(createProductSchema, { price: 100 }, 'name'));
  it('rejects empty name', () => assertInvalid(createProductSchema, { name: '   ', price: 100 }, 'name'));
  it('rejects rating below 1', () => assertInvalid(createProductSchema, { ...minimal, rating: 0 }, 'rating'));
  it('rejects rating above 5', () => assertInvalid(createProductSchema, { ...minimal, rating: 6 }, 'rating'));
  it('accepts price of 0 (free product)', () => {
    const data = assertValid(createProductSchema, { ...minimal, price: 0 });
    expect(data.price).toBe(0);
  });
  it('rejects sizeStock with negative values', () => assertInvalid(createProductSchema, { ...minimal, sizeStock: { S: -5 } }, 'sizeStock'));
  it('accepts empty optional arrays', () => {
    const data = assertValid(createProductSchema, { ...minimal, colors: [], sizes: [], specs: [] });
    expect(data.colors).toEqual([]);
  });
});

describe('updateProductSchema', () => {
  it('accepts partial updates', () => {
    const data = assertValid(updateProductSchema, { price: 1499 });
    expect(data.price).toBe(1499);
    expect(data.name).toBeUndefined();
  });

  it('accepts empty object (no changes)', () => {
    const result = validate(updateProductSchema, {});
    expect(result.success).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────
// CHECKOUT SCHEMA
// ─────────────────────────────────────────────────────────────────

const validCustomer = { name: 'Ahmed Khan', email: 'ahmed@example.pk', address: '123 Main Street Lahore', city: 'Lahore', zip: '54000' };
const validItem = { id: 'PRD-TEST12345', name: 'Classic Tee', price: 999, quantity: 1, selectedSize: 'M', selectedColor: 'Navy', category: 'Tops', subCategory: 'T-Shirt' };

describe('checkoutSchema', () => {
  it('accepts valid checkout payload', () => {
    const payload = {
      customer: validCustomer,
      items: [validItem],
      total: 999,
      paymentMethod: 'COD',
    };
    const data = assertValid(checkoutSchema, payload);
    expect(data.total).toBe(999);
    expect(data.paymentMethod).toBe('COD');
  });

  it('accepts all valid payment methods', () => {
    const methods = ['COD', 'ATM Card', 'Bank Transfer', 'Easypaisa', 'JazzCash'];
    for (const method of methods) {
      const data = assertValid(checkoutSchema, { customer: validCustomer, items: [validItem], total: 999, paymentMethod: method });
      expect(data.paymentMethod).toBe(method);
    }
  });

  it('rejects invalid payment method', () => assertInvalid(checkoutSchema, { customer: validCustomer, items: [validItem], total: 999, paymentMethod: 'Bitcoin' }, 'paymentMethod'));

  it('rejects empty cart', () => assertInvalid(checkoutSchema, { customer: validCustomer, items: [], total: 0, paymentMethod: 'COD' }, 'items'));

  it('rejects cart with more than 50 items', () => {
    const items = Array.from({ length: 51 }, (_, i) => ({ ...validItem, id: `item-${i}` }));
    assertInvalid(checkoutSchema, { customer: validCustomer, items, total: 999, paymentMethod: 'COD' }, 'items');
  });

  it('rejects quantity less than 1', () => assertInvalid(checkoutSchema, { customer: validCustomer, items: [{ ...validItem, quantity: 0 }], total: 999, paymentMethod: 'COD' }, 'items.0.quantity'));

  it('rejects quantity over 1000', () => assertInvalid(checkoutSchema, { customer: validCustomer, items: [{ ...validItem, quantity: 1001 }], total: 999, paymentMethod: 'COD' }, 'items.0.quantity'));

  it('rejects negative price on item', () => assertInvalid(checkoutSchema, { customer: validCustomer, items: [{ ...validItem, price: -100 }], total: 999, paymentMethod: 'COD' }, 'items.0.price'));

  it('rejects customer name too short', () => assertInvalid(checkoutSchema, { customer: { ...validCustomer, name: 'X' }, items: [validItem], total: 999, paymentMethod: 'COD' }, 'customer.name'));

  it('rejects customer address too short', () => assertInvalid(checkoutSchema, { customer: { ...validCustomer, address: 'abc' }, items: [validItem], total: 999, paymentMethod: 'COD' }, 'customer.address'));

  it('rejects missing required customer fields', () => {
    assertInvalid(checkoutSchema, { customer: {}, items: [validItem], total: 999, paymentMethod: 'COD' }, 'customer.name');
  });

  it('accepts missing optional fields on item (enriched server-side)', () => {
    const minimalItem = { id: 'PRD-TEST', name: 'Tee', price: 500, quantity: 1 };
    const data = assertValid(checkoutSchema, { customer: validCustomer, items: [minimalItem], total: 500, paymentMethod: 'COD' });
    expect(data.items[0].selectedSize).toBe('');
    expect(data.items[0].category).toBe('');
  });

  it('rejects total exceeding max price', () => assertInvalid(checkoutSchema, { customer: validCustomer, items: [validItem], total: 99999999999, paymentMethod: 'COD' }, 'total'));
});

// ─────────────────────────────────────────────────────────────────
// ORDER STATUS SCHEMA
// ─────────────────────────────────────────────────────────────────

describe('updateOrderStatusSchema', () => {
  it('accepts all valid statuses', () => {
    const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    for (const status of statuses) {
      const result = validate(updateOrderStatusSchema, { status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status', () => assertInvalid(updateOrderStatusSchema, { status: 'Refunded' }, 'status'));
  it('rejects missing status', () => assertInvalid(updateOrderStatusSchema, {}, 'status'));
});

// ─────────────────────────────────────────────────────────────────
// ADMIN SCHEMA
// ─────────────────────────────────────────────────────────────────

describe('createAdminSchema', () => {
  const base = { name: 'New Admin', email: 'admin2@stopshop.pk', password: 'securepass123' };

  it('accepts valid admin input', () => {
    const data = assertValid(createAdminSchema, base);
    expect(data.roles).toEqual(['admin']);
  });

  it('accepts custom roles', () => {
    const data = assertValid(createAdminSchema, { ...base, roles: ['super-admin'] });
    expect(data.roles).toEqual(['super-admin']);
  });

  it('rejects password shorter than 6 chars', () => assertInvalid(createAdminSchema, { ...base, password: '12345' }, 'password'));
  it('rejects invalid email', () => assertInvalid(createAdminSchema, { ...base, email: 'not-email' }, 'email'));
  it('rejects invalid role', () => assertInvalid(createAdminSchema, { ...base, roles: ['hacker'] }, 'roles'));
  it('rejects empty roles array', () => assertInvalid(createAdminSchema, { ...base, roles: [] }, 'roles'));
  it('rejects name too short', () => assertInvalid(createAdminSchema, { ...base, name: 'X' }, 'name'));
});

// ─────────────────────────────────────────────────────────────────
// SETTINGS SCHEMA
// ─────────────────────────────────────────────────────────────────

describe('updateSettingsSchema', () => {
  it('accepts valid logo URL', () => {
    const data = assertValid(updateSettingsSchema, { logo: 'https://cdn.example.com/logo.png' });
    expect(data.logo).toBe('https://cdn.example.com/logo.png');
  });

  it('accepts empty logo string', () => {
    const data = assertValid(updateSettingsSchema, { logo: '' });
    expect(data.logo).toBe('');
  });

  it('rejects invalid logo URL', () => assertInvalid(updateSettingsSchema, { logo: 'not-a-url' }, 'logo'));
  it('rejects announcement exceeding 500 chars', () => {
    const data = { announcement: 'A'.repeat(501) };
    assertInvalid(updateSettingsSchema, data, 'announcement');
  });
  it('accepts valid announcement', () => {
    const data = assertValid(updateSettingsSchema, { announcement: 'Big sale this weekend!' });
    expect(data.announcement).toBe('Big sale this weekend!');
  });
});
