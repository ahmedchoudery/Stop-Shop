import { withRoute, ApiError } from '@/lib/api/withRoute';
import ProductNotification from '@/models/ProductNotification';
import Product from '@/models/Product';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const POST = withRoute({
  requiredRole: 'public',
  schema: {
    body: z.object({
      email: z.string({ required_error: 'Email is required' })
        .trim()
        .min(1, 'Email is required')
        .email('Enter a valid email address'),
      name: z.string().optional(),
      productId: z.string({ required_error: 'Product ID is required' })
        .min(1, 'Product ID is required'),
      selectedSize: z.string().optional(),
      selectedColor: z.string().optional(),
    })
  },
  handler: async ({ body }) => {
    const { email, name, productId, selectedSize, selectedColor } = body;
    const emailKey = email.toLowerCase().trim();

    const productExists = await Product.exists({ id: productId });
    if (!productExists) {
      throw new ApiError('NOT_FOUND', 'Product not found', 404);
    }

    try {
      await ProductNotification.create({
        email: emailKey,
        name: name || '',
        productId,
        selectedSize: selectedSize || '',
        selectedColor: selectedColor || '',
        notified: false,
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return { success: true, message: 'already on the notification list' };
      }
      throw dbErr;
    }

    return NextResponse.json({ success: true, message: 'Notification request saved' }, { status: 201 });
  }
});
