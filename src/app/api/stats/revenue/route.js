import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Order from '../../../../models/Order';
import { requireAdmin } from '../../../../lib/adminAuth';
import { cacheService, CACHE_KEYS } from '../../../../services/cacheService';

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const data = await cacheService.getOrSet(CACHE_KEYS.STATS_REVENUE, async () => {
      const yesterday    = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dayBefore    = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);

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
        Order.aggregate([
          { $match: { status: { $nin: ['Cancelled', 'Failed', 'Refunded'] }, createdAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id:     { $dateToString: { format: '%u', date: '$createdAt' } },
              revenue: { $sum: '$total' },
              orders:  { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { dayNum: '$_id', revenue: 1, orders: 1, _id: 0 } },
        ]),
      ]);

      const totalRevenue = result?.totalRevenue ?? 0;
      const yesterdayRev = yesterdayResult?.revenue ?? 0;
      const dayBeforeRev = dayBeforeResult?.revenue ?? 0;
      const trend        = dayBeforeRev > 0 ? ((yesterdayRev - dayBeforeRev) / dayBeforeRev) * 100 : 0;

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayNames = { '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat', '7': 'Sun' };
      const weekMap = Object.fromEntries(weeklyRaw.map(d => [dayNames[d.dayNum] || 'Mon', d]));
      const weeklyData = days.map(day => {
        const cached = weekMap[day];
        return {
          day,
          revenue: cached?.revenue ?? 0,
          orders: cached?.orders ?? 0,
        };
      });

      return { totalRevenue, trend, weeklyData };
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
