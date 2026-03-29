import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  image: z.string().url().optional().or(z.string().min(1)),
  mediaType: z.enum(['upload', 'url', 'embed']).optional(),
  embedCode: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  bucket: z.string().min(1).optional(),
  subCategory: z.string().optional(),
  specs: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  sizeStock: z.record(z.number()).optional(),
  lifestyleImage: z.string().optional(),
  gallery: z.array(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createAdminSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roles: z.array(z.enum(['admin', 'super-admin', 'auditor'])).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']),
});

export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'Customer name is required'),
    email: z.string().email('Invalid email format'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    zip: z.string().min(1, 'ZIP code is required'),
  }),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
    selectedSize: z.string().optional(),
  })).min(1, 'At least one item is required'),
  total: z.number().positive('Total must be positive'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
});

export const updateSettingsSchema = z.object({
  logo: z.string().optional(),
  announcement: z.string().max(500).optional(),
});

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }
      req.body = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default {
  loginSchema,
  createProductSchema,
  updateProductSchema,
  createAdminSchema,
  updateOrderStatusSchema,
  checkoutSchema,
  updateSettingsSchema,
  validateRequest,
};
