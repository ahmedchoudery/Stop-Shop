import { withRoute } from '@/lib/api/withRoute';
import Product from '@/models/Product';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';

export const GET = withRoute({
  requiredRole: 'staff',
  handler: async () => {
    const cached = await cacheService.get(CACHE_KEYS.STATS_INVENTORY);
    if (cached) {
      return cached;
    }

    const [total, lowStock, outOfStock, rawProducts] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ quantity: { $gt: 0, $lte: 5 } }),
      Product.countDocuments({ quantity: 0 }),
      Product.find({}, { id: 1, name: 1, quantity: 1, bucket: 1, stock: 1 }).lean(),
    ]);

    const inStock = total - outOfStock;

    // Normalize each product — use quantity field (stock and quantity should match)
    const products = rawProducts.map(p => ({
      ...p,
      _id: p._id?.toString() || null,
      quantity: p.quantity ?? p.stock ?? 0,
    }));

    const responseBody = { total, inStock, lowStock, outOfStock, products };

    await cacheService.set(CACHE_KEYS.STATS_INVENTORY, responseBody, 60); // 1 minute cache

    return responseBody;
  }
});
