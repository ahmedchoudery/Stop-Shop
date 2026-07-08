import { withRoute, ApiError } from '@/lib/api/withRoute';
import Review from '@/models/Review';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { updateProductAverageRating } from '@/services/reviewService';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const GET = withRoute({
  requiredRole: 'public',
  schema: {
    query: z.object({
      productId: z.string().optional(),
    })
  },
  handler: async ({ query }) => {
    const { productId } = query;
    const filter = { status: 'Approved' };
    if (productId) {
      filter.productId = productId;
    }

    const reviews = await Review.find(filter)
      .select('customerName customerEmail rating title body productId productName createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = reviews.map((r) => ({
      ...r,
      _id: r._id?.toString() || null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    }));

    return formatted;
  }
});

export const POST = withRoute({
  requiredRole: 'public',
  schema: {
    body: z.object({
      orderId: z.string().min(1),
      productId: z.string().min(1),
      rating: z.number().int().min(1).max(5),
      title: z.string().min(1),
      body: z.string().min(1),
    })
  },
  handler: async ({ body }) => {
    const { orderId, productId, rating, title, body: reviewText } = body;

    const orderDoc = await Order.findOne({ orderID: orderId.toUpperCase() });
    if (!orderDoc) {
      throw new ApiError('NOT_FOUND', 'Order not found', 404);
    }

    const orderedItem = orderDoc.items.find((item) => item.id === productId);
    if (!orderedItem) {
      throw new ApiError('VALIDATION', 'This product was not purchased in the provided order', 400);
    }

    const productDoc = await Product.findOne({ id: productId });
    if (!productDoc) {
      throw new ApiError('NOT_FOUND', 'Product not found', 404);
    }

    const existingReview = await Review.findOne({
      customerEmail: orderDoc.customer.email.toLowerCase(),
      productId,
    });
    if (existingReview) {
      throw new ApiError('CONFLICT', 'You have already reviewed this product', 409);
    }

    const review = await Review.create({
      customerName: orderDoc.customer.name,
      customerEmail: orderDoc.customer.email.toLowerCase(),
      rating,
      title,
      body: reviewText,
      productId,
      productName: productDoc.name,
      status: 'Approved',
    });

    await updateProductAverageRating(productId);

    const formatted = review.toObject();
    if (formatted._id) {
      formatted._id = formatted._id.toString();
    }

    return NextResponse.json(formatted, { status: 201 });
  }
});
