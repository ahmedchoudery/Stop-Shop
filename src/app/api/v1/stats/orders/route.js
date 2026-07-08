import { withRoute } from '@/lib/api/withRoute';
import Order from '@/models/Order';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';

export const GET = withRoute({
  requiredRole: 'admin',
  handler: async () => {
    const data = await cacheService.getOrSet(CACHE_KEYS.STATS_ORDERS, async () => {
      const counts = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
      const totalOrders = counts.reduce((acc, c) => acc + c.count, 0);
      const pendingOrders = counts.find(c => c._id === 'Pending')?.count ?? 0;
      return { totalOrders, pendingOrders, counts: counts.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {}) };
    });

    return data;
  }
});
