import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Order from '../../../models/Order';
import { requireAdmin } from '../../../lib/adminAuth';

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '100', 10)));
    const skip = (page - 1) * limit;

    const totalCount = await Order.countDocuments({});
    const orders = await Order.find({})
      .select('orderID customer total status paymentMethod paymentDetails items createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formatted = orders.map(order => ({
      ...order,
      _id: order._id?.toString() || null,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
      updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
    }));

    return NextResponse.json(formatted, {
      headers: {
        'X-Total-Count': totalCount.toString(),
        'X-Total-Pages': Math.ceil(totalCount / limit).toString(),
        'X-Current-Page': page.toString(),
        'X-Limit': limit.toString(),
      }
    });
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
