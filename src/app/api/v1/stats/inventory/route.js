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

    const products = await Product.find({})
      .select('id name price discount quantity sizeStock colorStock variantMatrix bucket subCategory')
      .lean();

    let totalItems = 0;
    let outOfStock = 0;
    let lowStock = 0;

    const items = products.map((p) => {
      const stock = p.quantity ?? 0;
      totalItems += stock;
      if (stock === 0) outOfStock++;
      else if (stock < 5) lowStock++;

      return {
        id: p.id,
        name: p.name,
        stock,
        category: p.bucket || 'Tops',
        price: p.price,
      };
    });

    const totalProducts = products.length;
    const outOfStockRate = totalProducts > 0 ? (outOfStock / totalProducts) * 100 : 0;

    const responseBody = {
      summary: {
        totalProducts,
        totalItems,
        outOfStock,
        lowStock,
        outOfStockRate,
      },
      items,
    };

    await cacheService.set(CACHE_KEYS.STATS_INVENTORY, responseBody, 300); // 5 minutes cache

    return responseBody;
  }
});
