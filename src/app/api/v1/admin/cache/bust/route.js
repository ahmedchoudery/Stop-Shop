import { withRoute } from '@/lib/api/withRoute';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';

/**
 * POST /api/v1/admin/cache/bust
 * Clears all stats caches. Admin-only.
 */
export const POST = withRoute({
  requiredRole: 'admin',
  handler: async () => {
    await cacheService.invalidateMany([
      CACHE_KEYS.STATS_REVENUE,
      CACHE_KEYS.STATS_ORDERS,
      CACHE_KEYS.STATS_INVENTORY,
      CACHE_KEYS.PRODUCTS,
      CACHE_KEYS.PUBLIC_PRODUCTS,
    ]);

    return { success: true, message: 'Stats caches cleared. Fresh data will be loaded on next request.' };
  }
});
