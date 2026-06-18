import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Order from '../../../../models/Order';
import Product from '../../../../models/Product';
import { requireAdmin } from '../../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const yesterday     = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      revenueResult,
      revenueYesterday,
      ordersResult,
      ordersYesterday,
      productCount,
      outOfStockCount,
      revenueOverTime,
      revenueByCategory,
      paymentMethods,
      bestSellers,
      ordersByStatusArr,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Failed', 'Refunded'] } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Failed', 'Refunded'] }, createdAt: { $gte: yesterday } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: yesterday } }),
      Product.countDocuments(),
      Product.countDocuments({ quantity: 0 }),
      Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Failed', 'Refunded'] }, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%m/%d', date: '$createdAt' }
            },
            revenue: { $sum: '$total' },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', revenue: 1, orders: 1, _id: 0 } },
      ]),
      Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Failed', 'Refunded'] } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.category',
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            units:   { $sum: '$items.quantity' },
          },
        },
        { $match: { _id: { $nin: [null, ''] } } },
        { $sort: { revenue: -1 } },
        { $project: { category: '$_id', revenue: 1, units: 1, _id: 0 } },
        { $limit: 8 },
      ]),
      Order.aggregate([
        { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { method: '$_id', count: 1, _id: 0 } },
      ]),
      Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Failed', 'Refunded'] } } },
        { $unwind: '$items' },
        {
          $group: {
            _id:      '$items.id',
            name:     { $first: '$items.name' },
            category: { $first: '$items.category' },
            unitsSold:{ $sum: '$items.quantity' },
            revenue:  { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 10 },
        { $project: { productId: '$_id', name: 1, category: 1, unitsSold: 1, revenue: 1, _id: 0 } },
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue    = revenueResult[0]?.total  ?? 0;
    const totalOrders     = revenueResult[0]?.count  ?? 0;
    const avgOrderValue   = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const pendingOrders   = ordersResult.find(o => o._id === 'Pending')?.count ?? 0;
    const yesterdayRev    = revenueYesterday[0]?.total ?? 0;
    const revenueTrend = (yesterdayRev > 0 && isFinite(totalRevenue))
      ? ((totalRevenue - yesterdayRev) / yesterdayRev) * 100
      : 0;
    const ordersByStatus  = ordersByStatusArr.reduce((acc, o) => ({ ...acc, [o._id]: o.count }), {});

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      pendingOrders,
      revenueTrend,
      ordersTrend: ordersYesterday,
      totalProducts: productCount,
      outOfStock:    outOfStockCount,
      revenueOverTime,
      revenueByCategory,
      paymentMethods,
      bestSellers,
      ordersByStatus,
    });
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
