import { withRoute, ApiError } from '@/lib/api/withRoute';
import Review from '@/models/Review';
import { withAudit } from '@/lib/audit';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';
import { updateProductAverageRating } from '@/services/reviewService';
import { z } from 'zod';

export const PATCH = withRoute({
  requiredRole: 'admin',
  schema: {
    params: z.object({
      id: z.string().min(1)
    }),
    body: z.object({
      status: z.enum(['pending', 'approved', 'rejected'])
    })
  },
  handler: async ({ req, body, params }) => {
    const { id } = params;
    const { status } = body;

    const prevReview = await Review.findById(id).lean();
    if (!prevReview) {
      throw new ApiError('NOT_FOUND', 'Review not found', 404);
    }

    const review = await withAudit(
      `REVIEW_${status.toUpperCase()}`,
      id,
      req,
      prevReview,
      { status },
      async (session) => {
        const r = await Review.findByIdAndUpdate(id, { status }, { new: true, session }).lean();
        if (r && r.productId) {
          await updateProductAverageRating(r.productId);
        }
        return r;
      }
    );

    await cacheService.invalidateMany([CACHE_KEYS.PUBLIC_REVIEWS]);

    const formattedReview = review.toObject ? review.toObject() : review;
    if (formattedReview._id) {
      formattedReview._id = formattedReview._id.toString();
    }

    return formattedReview;
  }
});

export const DELETE = withRoute({
  requiredRole: 'admin',
  schema: {
    params: z.object({
      id: z.string().min(1)
    })
  },
  handler: async ({ req, params }) => {
    const { id } = params;

    const prevReview = await Review.findById(id).lean();
    if (!prevReview) {
      throw new ApiError('NOT_FOUND', 'Review not found', 404);
    }

    await withAudit(
      'REVIEW_DELETE',
      id,
      req,
      prevReview,
      null,
      async (session) => {
        await Review.findByIdAndDelete(id, { session });
        if (prevReview.productId) {
          await updateProductAverageRating(prevReview.productId);
        }
      }
    );

    await cacheService.invalidateMany([CACHE_KEYS.PUBLIC_REVIEWS]);

    return { message: 'Review deleted successfully' };
  }
});
