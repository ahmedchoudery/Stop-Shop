import { withRoute } from '@/lib/api/withRoute';
import Product from '@/models/Product';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';

export const GET = withRoute({
  requiredRole: 'public',
  handler: async () => {
    const cached = await cacheService.get(CACHE_KEYS.PUBLIC_PRODUCTS + '_featured');
    if (cached) {
      return cached;
    }

    const featuredProducts = await Product.find({
      featuredSection: { $in: ['drop', 'attitude', 'pieces'] }
    })
      .select('id name price discount image colors sizes bucket subCategory quantity isNew createdAt specs sizeStock colorStock variantMatrix lifestyleImage variantImages gallery featuredSection displayOrder description careInstructions')
      .lean();

    const formatted = featuredProducts.map((p) => ({
      ...p,
      _id: p._id?.toString() || null,
      id: p.id || p._id?.toString() || `GEN-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
    }));

    await cacheService.set(CACHE_KEYS.PUBLIC_PRODUCTS + '_featured', formatted, 600); // cache for 10m

    return formatted;
  }
});
