import { z } from 'zod';

// Email validator
const emailSchema = z
  .string()
  .trim()
  .email('Invalid email address')
  .max(254, 'Email too long')
  .transform(v => v.toLowerCase());

// Password validator
const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password too long');

// Price validator
const priceSchema = z
  .number({ invalid_type_error: 'Price must be a number' })
  .nonnegative('Price cannot be negative')
  .max(10_000_000, 'Price too large');

// 1. Customer Login Schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password required').max(128),
});

// 2. Customer Registration Schema
export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: emailSchema,
  password: passwordSchema,
  phone: z.string().max(30).optional().default(''),
});

// 3. Checkout Schema
const customerSchema = z.object({
  name: z.string().trim().min(2, 'Name too short').max(100, 'Name too long'),
  email: emailSchema,
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number cannot exceed 15 digits'),
  address: z.string().trim().min(5, 'Address too short').max(300, 'Address too long'),
  city: z.string().trim().min(2, 'City too short').max(100, 'City too long'),
  zip: z.string().trim().max(20, 'ZIP too long').optional().default(''),
});

const orderItemSchema = z.object({
  id: z.string().min(1, 'Product ID required'),
  name: z.string().min(1, 'Product name required').max(200),
  price: priceSchema,
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(1000),
  selectedSize: z.string().max(20).optional().default(''),
  selectedColor: z.string().max(100).optional().default(''),
  category: z.string().max(100).optional().default(''),
  subCategory: z.string().max(100).optional().default(''),
});

export const PAYMENT_METHODS = ['COD', 'ATM Card', 'Bank Transfer', 'Easypaisa', 'JazzCash'];

export const checkoutSchema = z.object({
  customer: customerSchema,
  items: z.array(orderItemSchema).min(1, 'Cart cannot be empty').max(50, 'Too many items in cart'),
  total: priceSchema,
  paymentMethod: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}` }),
  }),
  couponCode: z.string().trim().toUpperCase().optional().default(''),
  paymentDetails: z.object({
    easypaisaMode: z.enum(['direct', 'manual']).optional(),
    easypaisaNumber: z.string().trim().optional(),
    easypaisaTid: z.string().trim().optional(),
    cardholderName: z.string().trim().optional(),
    cardNumber: z.string().trim().optional(),
    cardExpiry: z.string().trim().optional(),
    cardCvv: z.string().trim().optional(),
  }).optional(),
  cartUserId: z.string().optional(),
});

// 4. Product Review Schema
export const reviewSchema = z.object({
  name: z.string().trim().min(1, 'Name required').max(100),
  email: emailSchema,
  rating: z.number().int().min(1).max(5).optional().default(5),
  title: z.string().trim().max(120).optional().default(''),
  body: z.string().trim().min(20, 'Review must be at least 20 characters').max(2000),
  productId: z.string().max(100).optional().default(''),
  productName: z.string().max(200).optional().default(''),
});

// 5. Back-in-Stock Notification Schema
export const notifyMeSchema = z.object({
  email: emailSchema,
  productId: z.string().trim().min(1, 'Product ID is required').max(100),
  selectedSize: z.string().max(20).optional().default(''),
  selectedColor: z.string().max(100).optional().default(''),
});

// 6. Newsletter Subscription Schema
export const newsletterSchema = z.object({
  email: emailSchema,
});

// 7. Coupon Validation Schema
export const couponValidationSchema = z.object({
  code: z.string().trim().min(1, 'Coupon code required').transform(v => v.toUpperCase()),
  cartTotal: z.number().nonnegative('Total must be positive'),
  activeCouponCode: z.string().nullable().optional().default(''),
});
