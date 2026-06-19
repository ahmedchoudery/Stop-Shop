import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Review from '../../../../../models/Review';
import { requireAdmin } from '../../../../../lib/adminAuth';
import { logAudit } from '../../../../../lib/audit';
import { cacheService, CACHE_KEYS } from '../../../../../services/cacheService';
import { updateProductAverageRating } from '../../../../../services/reviewService';

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { status } = body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be: pending, approved, or rejected' }, { status: 400 });
    }

    const review = await Review.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.productId) {
      await updateProductAverageRating(review.productId);
    }

    await logAudit(`REVIEW_${status.toUpperCase()}`, { reviewId: id, status }, adminPayload.email, req);
    await cacheService.invalidateMany([CACHE_KEYS.PUBLIC_REVIEWS]);

    if (review._id) {
      review._id = review._id.toString();
    }

    return NextResponse.json(review);
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;

    const review = await Review.findByIdAndDelete(id).lean();
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.productId) {
      await updateProductAverageRating(review.productId);
    }

    await logAudit('REVIEW_DELETE', { reviewId: id }, adminPayload.email, req);
    await cacheService.invalidateMany([CACHE_KEYS.PUBLIC_REVIEWS]);

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
