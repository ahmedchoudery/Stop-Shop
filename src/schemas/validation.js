/**
 * @fileoverview Zod validation schemas for all API endpoints
 * Applies: nodejs-best-practices (validate at ALL boundaries, fail fast),
 *          typescript-expert (type inference from schemas), javascript-pro (ES6+ modules)
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────
// PRIMITIVES & REUSABLE VALIDATORS
// ─────────────────────────────────────────────────────────────────

const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .email('Invalid email address')
  .max(254, 'Email too long');

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password too long');

const priceSchema = z
  .number({ invalid_type_error: 'Price must be a number' })
  .positive('Price must be greater than 0')
  .max(1_000_000_000, 'Price exceeds maximum allowed value')
  .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number));

const quantitySchema = z
  .number({ invalid_type_error: 'Quantity must be a number' })
  .int('Quantity must be a whole number')
  .min(0, 'Quantity cannot be negative')
  .max(100_000, 'Quantity too large')
  .or(z.string().regex(/^\d+$/).transform(Number));

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId');

// ─────────────────────────────────────────────────────────────────
// AUTH SCHEMAS
// ─────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password required'),
});

/** @typedef {z.infer<typeof loginSchema>} LoginInput */

// ─────────────────────────────────────────────────────────────────
// PRODUCT SCHEMAS
// ─────────────────────────────────────────────────────────────────

const PRODUCT_BUCKETS = ['Tops', 'Bottoms', 'Footwear', 'Accessories'];
const MEDIA_TYPES = ['upload', 'url', 'embed'];

const sizeStockSchema = z.record(
  z.string().min(1).max(10),
  z.number().int().min(0).max(100_000)
);

export const createProductSchema = z.object({
  id: z.string().optional(),
  name: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name too long'),
  price: priceSchema,
  quantity: quantitySchema.optional().default(0).or(z.literal('').transform(() => 0)),
  stock: quantitySchema.optional().default(0).or(z.literal('').transform(() => 0)),
  image: z.string().url('Invalid image URL').or(z.string().startsWith('data:')).or(z.literal('')).or(z.null()).transform(v => v ?? ''),
  lifestyleImage: z.string().url().or(z.string().startsWith('data:')).or(z.literal('')).or(z.null()).optional().default('').transform(v => v ?? ''),
  mediaType: z.enum(MEDIA_TYPES).optional().default('upload'),
  embedCode: z.string().max(5000).optional().default('').or(z.null()).transform(v => v ?? ''),
  bucket: z.string().transform(v => {
    const t = v.trim().toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }).pipe(z.enum(PRODUCT_BUCKETS)).optional().default('Tops'),
  subCategory: z.string().max(60).optional().default('General').or(z.null()).transform(v => v ?? 'General'),
  rating: z.number().int().min(1).max(5).optional().default(5),
  specs: z.array(z.string().max(200)).max(10).optional().default([]).or(z.null()).transform(v => v ?? []),
  colors: z.array(z.string().max(50)).max(20).optional().default([]).or(z.null()).transform(v => v ?? []),
  sizes: z.array(z.string().max(20)).max(30).optional().default([]).or(z.null()).transform(v => v ?? []),
  sizeStock: sizeStockSchema.optional().default({}).or(z.null()).transform(v => v ?? {}),
  gallery: z.array(z.string().url().or(z.string().startsWith('data:'))).max(20).optional().default([]).or(z.null()).transform(v => v ?? []),
  variantImages: z.record(z.string(), z.string()).optional().default({}).or(z.null()).transform(v => v ?? {}),
});

export const updateProductSchema = createProductSchema.partial().omit({ id: true });

/** @typedef {z.infer<typeof createProductSchema>} CreateProductInput */
/** @typedef {z.infer<typeof updateProductSchema>} UpdateProductInput */

// ─────────────────────────────────────────────────────────────────
// ORDER SCHEMAS
// ─────────────────────────────────────────────────────────────────

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${ORDER_STATUSES.join(', ')}` }),
  }),
});

const customerSchema = z.object({
  name: z.string().trim().min(2, 'Name too short').max(100, 'Name too long'),
  email: emailSchema,
  address: z.string().trim().min(5, 'Address too short').max(300, 'Address too long'),
  city: z.string().trim().min(2, 'City too short').max(100, 'City too long'),
  zip: z.string().trim().max(20, 'ZIP too long').optional().default(''),
});

const orderItemSchema = z.object({
  id: z.string().min(1, 'Product ID required'),
  name: z.string().min(1, 'Product name required').max(120),
  price: priceSchema,
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(1000),
  selectedSize: z.string().max(20).optional().default(''),
});

export const checkoutSchema = z.object({
  customer: customerSchema,
  items: z
    .array(orderItemSchema)
    .min(1, 'Cart cannot be empty')
    .max(50, 'Too many items in cart'),
  total: priceSchema,
  paymentMethod: z.string().trim().min(1, 'Payment method required').max(50),
});

/** @typedef {z.infer<typeof checkoutSchema>} CheckoutInput */

// ─────────────────────────────────────────────────────────────────
// ADMIN USER SCHEMAS
// ─────────────────────────────────────────────────────────────────

const ADMIN_ROLES = ['admin', 'super-admin', 'auditor'];

export const createAdminSchema = z.object({
  name: z.string().trim().min(2, 'Name too short').max(100, 'Name too long'),
  email: emailSchema,
  password: passwordSchema,
  roles: z
    .array(z.enum(ADMIN_ROLES))
    .min(1, 'At least one role required')
    .max(3)
    .optional()
    .default(['admin']),
});

/** @typedef {z.infer<typeof createAdminSchema>} CreateAdminInput */

// ─────────────────────────────────────────────────────────────────
// SETTINGS SCHEMA
// ─────────────────────────────────────────────────────────────────

export const updateSettingsSchema = z.object({
  logo: z.string().url('Invalid logo URL').or(z.literal('')).optional(),
  announcement: z.string().trim().max(500, 'Announcement too long').optional(),
});

// ─────────────────────────────────────────────────────────────────
// VALIDATION MIDDLEWARE FACTORY
// ─────────────────────────────────────────────────────────────────

/**
 * Express middleware factory for Zod schema validation.
 * Validates req.body and returns 400 with structured errors on failure.
 *
 * @param {z.ZodSchema} schema
 * @returns {import('express').RequestHandler}
 */
export const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors,
    });
  }

  // Replace body with parsed/coerced data
  req.body = result.data;
  return next();
};

/**
 * Validate and parse data programmatically (non-HTTP use).
 *
 * @template T
 * @param {z.ZodSchema<T>} schema
 * @param {unknown} data
 * @returns {{ success: true, data: T } | { success: false, errors: Array<{field: string, message: string}> }}
 */
export const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
};
