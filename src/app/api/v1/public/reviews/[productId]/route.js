import { withRoute } from '@/lib/api/withRoute';
import Review from '@/models/Review';
import { z } from 'zod';

export const GET = withRoute({
  requiredRole: 'public',
  schema: {
    params: z.object({
      productId: z.string().min(1)
    })
  },
  handler: async ({ params }) => {
    const { productId } = params;

    const reviews = await Review.find({ productId, status: 'Approved' })
      .select('customerName customerEmail rating title body createdAt')
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
