import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Order from '../../../../models/Order';
import { requireAdmin } from '../../../../lib/adminAuth';
import { updateOrderStatusSchema } from '../../../../schemas/validation';
import { logAudit } from '../../../../lib/audit';
import { cacheService, CACHE_KEYS } from '../../../../services/cacheService';
import { sendOrderStatusEmail } from '../../../../services/emailService';

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const validation = updateOrderStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }

    const { status } = validation.data;

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await logAudit('ORDER_STATUS_UPDATE', { id, status }, adminPayload.email, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_REVENUE, CACHE_KEYS.STATS_ORDERS]);

    if (status === 'Shipped' || status === 'Delivered') {
      sendOrderStatusEmail(order, status).catch(err => {
        console.error('[OrderStatusEmail] Failed:', err.message);
      });
    }

    const formattedOrder = {
      ...order,
      _id: order._id?.toString() || null,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
      updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
