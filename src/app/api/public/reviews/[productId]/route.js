import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Review from '../../../../../models/Review';
import { cacheService, CACHE_KEYS } from '../../../../../services/cacheService';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { productId } = params;
    const cacheKey = `${CACHE_KEYS.PUBLIC_REVIEWS_PRODUCT}:${productId}`;

    const reviews = await cacheService.getOrSet(cacheKey, async () => {
      return Review.find({ status: 'approved', productId })
        .select('customerName rating title body createdAt')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
    }, 300);

    const formatted = reviews.map(r => ({
      ...r,
      _id: r._id?.toString() || null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
