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

    const data = await cacheService.getOrSet(CACHE_KEYS.STATS_ORDERS, async () => {
      const counts = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
      const totalOrders = counts.reduce((acc, c) => acc + c.count, 0);
      const pendingOrders = counts.find(c => c._id === 'Pending')?.count ?? 0;
      return { totalOrders, pendingOrders, counts: counts.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {}) };
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
