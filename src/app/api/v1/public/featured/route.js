import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/withRoute';
import Product from '@/models/Product';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';

export const GET = withRoute({
  requiredRole: 'public',
  handler: async ({ query }) => {
    const section = query?.section;
    const cacheKey = CACHE_KEYS.PUBLIC_PRODUCTS + `_featured_${section || 'all'}`;

    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    };

    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers });
    }

    const filter = {};
    if (section) {
      filter.featuredSection = section;
    } else {
      filter.featuredSection = { $in: ['drop', 'attitude', 'pieces'] };
    }

    const featuredProducts = await Product.find(filter)
      .select('id name price discount image colors sizes bucket subCategory quantity isNew createdAt specs sizeStock colorStock variantMatrix lifestyleImage variantImages gallery featuredSection displayOrder description materials careInstructions outfitProductIds')
      .lean();

    const formatted = featuredProducts.map((p) => ({
      ...p,
      _id: p._id?.toString() || null,
      id: p.id || p._id?.toString() || `GEN-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
    }));

    await cacheService.set(cacheKey, formatted, 600); // cache for 10m

    return NextResponse.json(formatted, { headers });
  }
});
