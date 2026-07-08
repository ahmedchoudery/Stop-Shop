import { withRoute } from '@/lib/api/withRoute';
import Order from '@/models/Order';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';

export const GET = withRoute({
  requiredRole: 'staff',
  handler: async () => {
    const cached = await cacheService.get(CACHE_KEYS.STATS_REVENUE);
    if (cached) {
      return cached;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await Order.find({
      status: { $nin: ['Cancelled', 'Failed'] },
      createdAt: { $gte: thirtyDaysAgo }
    })
      .select('total salesChannel createdAt')
      .lean();

    // 1. Total & Daily Revenue
    let totalRevenue = 0;
    const dailyMap = new Map();

    // Preset last 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyMap.set(dateStr, 0);
    }

    // Accumulate
    for (const order of orders) {
      totalRevenue += order.total;
      const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
      if (dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, dailyMap.get(dateStr) + order.total);
      }
    }

    const dailyRevenue = Array.from(dailyMap.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));

    // 2. Sales Channel Breakdown
    const channelMap = new Map();
    for (const order of orders) {
      const channel = order.salesChannel || 'Web';
      channelMap.set(channel, (channelMap.get(channel) || 0) + order.total);
    }

    const channels = Array.from(channelMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // 3. Weekly Revenue
    const weeklyMap = new Map();
    const dayNames = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
    };

    // Initialize days of week
    for (let i = 0; i < 7; i++) {
      const dayName = Reflect.get(dayNames, i.toString());
      weeklyMap.set(dayName, 0);
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const order of orders) {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= sevenDaysAgo) {
        const dayOfWeek = orderDate.getDay();
        const dayName = Reflect.get(dayNames, dayOfWeek.toString());
        if (weeklyMap.has(dayName)) {
          weeklyMap.set(dayName, weeklyMap.get(dayName) + order.total);
        }
      }
    }

    const weeklyRevenue = Array.from(weeklyMap.entries()).map(([day, amount]) => ({
      day,
      amount,
    }));

    const responseBody = {
      totalRevenue,
      dailyRevenue,
      channels,
      weeklyRevenue,
    };

    await cacheService.set(CACHE_KEYS.STATS_REVENUE, responseBody, 600); // 10 minutes cache

    return responseBody;
  }
});
