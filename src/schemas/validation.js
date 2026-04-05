/**
 * @fileoverview Zod validation schemas — Stop & Shop
 * Updated: orderItemSchema now captures selectedColor, category, subCategory
 *          paymentMethod validated against the 5 supported Pakistan payment methods
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────

const emailSchema = z
  .string()
  .trim()
  .email('Invalid email address')
  .max(254, 'Email too long')
  .transform(v => v.toLowerCase());

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password too long');

const priceSchema = z
  .number({ invalid_type_error: 'Price must be a number' })
  .nonnegative('Price cannot be negative')
  .max(10_000_000, 'Price too large');

// ─────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email:    emailSchema,
  password: z.string().min(1, 'Password required').max(128),
});

/** @typedef {z.infer<typeof loginSchema>} LoginInput */

// ─────────────────────────────────────────────────────────────────
// PRODUCT SCHEMAS
// ─────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  id:            z.string().trim().max(50).optional(),
  name:          z.string().trim().min(1, 'Product name required').max(200),
  price:         priceSchema,
  quantity:      z.number().int().nonnegative().optional().default(0),
  stock:         z.number().int().nonnegative().optional().default(0),
  image:         z.string().max(2000).optional().default(''),
  mediaType:     z.enum(['upload', 'url', 'embed']).optional().default('upload'),
  embedCode:     z.string().max(5000).optional().default(''),
  rating:        z.number().min(1).max(5).optional().default(5),
  bucket:        z.string().trim().max(100).optional().default('Tops'),
  subCategory:   z.string().trim().max(100).optional().default('General'),
  specs:         z.array(z.string().max(200)).optional().default([]),
  colors:        z.array(z.string().max(100)).optional().default([]),
  sizes:         z.array(z.string().max(20)).optional().default([]),
  sizeStock:     z.record(z.string(), z.number().nonnegative()).optional().default({}),
  lifestyleImage: z.string().max(2000).optional().default(''),
  variantImages: z.record(z.string(), z.string()).optional().default({}),
  gallery:       z.array(z.string().max(2000)).optional().default([]),
});

/** @typedef {z.infer<typeof createProductSchema>} CreateProductInput */

export const updateProductSchema = createProductSchema.partial();

/** @typedef {z.infer<typeof updateProductSchema>} UpdateProductInput */

export const updateOrderStatusSchema = z.object({
  status: z.enum(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']),
});

/** @typedef {z.infer<typeof updateOrderStatusSchema>} UpdateOrderStatusInput */

// ─────────────────────────────────────────────────────────────────
// CHECKOUT SCHEMA
// ─────────────────────────────────────────────────────────────────

const customerSchema = z.object({
  name:    z.string().trim().min(2, 'Name too short').max(100, 'Name too long'),
  email:   emailSchema,
  address: z.string().trim().min(5, 'Address too short').max(300, 'Address too long'),
  city:    z.string().trim().min(2, 'City too short').max(100, 'City too long'),
  zip:     z.string().trim().max(20, 'ZIP too long').optional().default(''),
});

/**
 * Order item schema — captures a full product snapshot at time of purchase.
 * selectedColor, category, subCategory are optional (enriched server-side if missing).
 */
const orderItemSchema = z.object({
  id:            z.string().min(1, 'Product ID required'),
  name:          z.string().min(1, 'Product name required').max(200),
  price:         priceSchema,
  quantity:      z.number().int().min(1, 'Quantity must be at least 1').max(1000),
  selectedSize:  z.string().max(20).optional().default(''),
  selectedColor: z.string().max(100).optional().default(''),   // Color variant chosen at checkout
  category:      z.string().max(100).optional().default(''),   // Product bucket (enriched server-side)
  subCategory:   z.string().max(100).optional().default(''),   // Sub-category (enriched server-side)
});

/** Supported Pakistan payment methods */
export const PAYMENT_METHODS = ['COD', 'ATM Card', 'Bank Transfer', 'Easypaisa', 'JazzCash'];

export const checkoutSchema = z.object({
  customer:      customerSchema,
  items: z
    .array(orderItemSchema)
    .min(1, 'Cart cannot be empty')
    .max(50, 'Too many items in cart'),
  total:         priceSchema,
  paymentMethod: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}` }),
  }),
});

/** @typedef {z.infer<typeof checkoutSchema>} CheckoutInput */

// ─────────────────────────────────────────────────────────────────
// ADMIN USER SCHEMAS
// ─────────────────────────────────────────────────────────────────

const ADMIN_ROLES = ['admin', 'super-admin', 'auditor'];

export const createAdminSchema = z.object({
  name:     z.string().trim().min(2, 'Name too short').max(100, 'Name too long'),
  email:    emailSchema,
  password: passwordSchema,
  roles:    z.array(z.enum(ADMIN_ROLES)).min(1).max(3).optional().default(['admin']),
});

/** @typedef {z.infer<typeof createAdminSchema>} CreateAdminInput */

// ─────────────────────────────────────────────────────────────────
// SETTINGS SCHEMA
// ─────────────────────────────────────────────────────────────────

export const updateSettingsSchema = z.object({
  logo:         z.string().url('Invalid logo URL').or(z.literal('')).optional(),
  announcement: z.string().trim().max(500, 'Announcement too long').optional(),
});

// ─────────────────────────────────────────────────────────────────
// REVIEW SCHEMA
// ─────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  name:      z.string().trim().min(1, 'Name required').max(100),
  email:     emailSchema,
  rating:    z.number().int().min(1).max(5),
  title:     z.string().trim().min(2, 'Title too short').max(120),
  body:      z.string().trim().min(5, 'Review content too short').max(2000),
  productId: z.string().max(100).optional().default(''),
});

/** @typedef {z.infer<typeof reviewSchema>} ReviewInput */

// ─────────────────────────────────────────────────────────────────
// COUPON VALIDATION SCHEMA
// ─────────────────────────────────────────────────────────────────

export const couponValidationSchema = z.object({
  code:      z.string().trim().min(1, 'Coupon code required').transform(v => v.toUpperCase()),
  cartTotal: z.number().nonnegative('Total must be positive'),
  activeCouponCode: z.string().optional().default(''),
});

/** @typedef {z.infer<typeof couponValidationSchema>} CouponValidationInput */

// ─────────────────────────────────────────────────────────────────
// VALIDATION MIDDLEWARE FACTORY
// ─────────────────────────────────────────────────────────────────

/**
 * Express middleware: validate req.body against a Zod schema.
 * Returns 400 with structured { field, message } error list on failure.
 *
 * @param {import('zod').ZodSchema} schema
 * @returns {import('express').RequestHandler}
 */
export const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      field:   err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({ status: 'fail', message: 'Validation failed', errors });
  }
  req.body = result.data;
  return next();
};

/**
 * Programmatic validation (non-HTTP use).
 *
 * @template T
 * @param {import('zod').ZodSchema<T>} schema
 * @param {unknown} data
 * @returns {{ success: true, data: T } | { success: false, errors: Array<{field: string, message: string}> }}
 */
export const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    errors: result.error.errors.map(err => ({ field: err.path.join('.'), message: err.message })),
  };
};