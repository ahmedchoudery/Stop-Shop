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

    const now = new Date();
    const yesterday    = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const dayBefore    = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Build per-day buckets for the last 7 days (keyed by YYYY-MM-DD in UTC)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [[result], [yesterdayResult], [dayBeforeResult], weeklyRaw] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Failed', 'Refunded'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalOrders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Failed', 'Refunded'] }, createdAt: { $gte: yesterday } } },
        { $group: { _id: null, revenue: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Failed', 'Refunded'] }, createdAt: { $gte: dayBefore, $lt: yesterday } } },
        { $group: { _id: null, revenue: { $sum: '$total' } } },
      ]),
      // Group by calendar date (YYYY-MM-DD) to avoid ISO weekday number ambiguity
      Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Failed', 'Refunded'] }, createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { dateStr: '$_id', revenue: 1, orders: 1, _id: 0 } },
      ]),
    ]);

    const totalRevenue = result?.totalRevenue ?? 0;
    const yesterdayRev = yesterdayResult?.revenue ?? 0;
    const dayBeforeRev = dayBeforeResult?.revenue ?? 0;
    const trend        = dayBeforeRev > 0 ? ((yesterdayRev - dayBeforeRev) / dayBeforeRev) * 100 : 0;

    // Build a 7-day window: today and the 6 days before it
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Map YYYY-MM-DD → { revenue, orders }
    const dateMap = {};
    for (const row of weeklyRaw) {
      dateMap[row.dateStr] = { revenue: row.revenue, orders: row.orders };
    }

    // Build 7 day slots from sevenDaysAgo to today inclusive
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const dayName = DAY_NAMES[d.getUTCDay()];
      const match = (dateStr && Object.prototype.hasOwnProperty.call(dateMap, dateStr)) ? dateMap[dateStr] : undefined;
      weeklyData.push({
        day: dayName,
        revenue: match?.revenue ?? 0,
        orders: match?.orders ?? 0,
      });
    }

    // Channel-segmented revenue (Web vs POS)
    const channelRaw = await Order.aggregate([
      { $match: { status: { $nin: ['Cancelled', 'Failed', 'Refunded'] } } },
      { $group: {
        _id: { $ifNull: ['$salesChannel', 'Web'] },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      }},
    ]);
    const channelData = {};
    for (const ch of channelRaw) {
      channelData[ch._id] = { revenue: ch.revenue, orders: ch.orders };
    }

    const responseBody = { totalRevenue, trend, weeklyData, channelData };

    await cacheService.set(CACHE_KEYS.STATS_REVENUE, responseBody, 60); // 1 minute cache

    return responseBody;
  }
});
