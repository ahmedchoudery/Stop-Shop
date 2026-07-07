import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Review from '../../../../../models/Review';
import { requireAdmin } from '../../../../../lib/adminAuth';
import { withAudit } from '../../../../../lib/audit';
import { cacheService, CACHE_KEYS } from '../../../../../services/cacheService';
import { updateProductAverageRating } from '../../../../../services/reviewService';

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = await requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { status } = body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be: pending, approved, or rejected' }, { status: 400 });
    }

    const prevReview = await Review.findById(id).lean();
    if (!prevReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
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

    return NextResponse.json(formattedReview);
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('required') ? 401 : 403 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = await requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;

    const prevReview = await Review.findById(id).lean();
    if (!prevReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
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

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('required') ? 401 : 403 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
