import { withRoute } from '@/lib/api/withRoute';
import Order from '@/models/Order';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';

// Statuses that mean an order hasn't been shipped/delivered yet
const AWAITING_FULFILLMENT_STATUSES = ['Pending', 'Processing', 'Confirmed'];

export const GET = withRoute({
  requiredRole: 'staff',
  handler: async () => {
    const data = await cacheService.getOrSet(CACHE_KEYS.STATS_ORDERS, async () => {
      const counts = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
      const byStatus = counts.reduce((acc, c) => {
        if (c._id && c._id !== '__proto__' && c._id !== 'constructor' && c._id !== 'prototype') {
          acc[c._id] = c.count;
        }
        return acc;
      }, Object.create(null));
      const totalOrders = counts.reduce((acc, c) => acc + c.count, 0);

      // Awaiting fulfillment = all orders not yet shipped or delivered
      const awaitingFulfillment = AWAITING_FULFILLMENT_STATUSES.reduce(
        (acc, status) => {
          const val = Object.prototype.hasOwnProperty.call(byStatus, status) ? byStatus[status] : 0;
          return acc + val;
        },
        0
      );

      return {
        totalOrders,
        pendingOrders: awaitingFulfillment,   // UI shows this as "awaiting fulfillment"
        awaitingFulfillment,
        counts: byStatus,
      };
    });

    return data;
  }
});
