import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Order from '../../../../models/Order';
import { requireAdmin } from '../../../../lib/adminAuth';
import { updateOrderStatusSchema } from '../../../../schemas/validation';
import { logAudit } from '../../../../lib/audit';
import { cacheService, CACHE_KEYS } from '../../../../services/cacheService';
import { sendOrderStatusEmail } from '../../../../services/emailService';
import paymentFactory from '../../../../lib/payments/PaymentFactory';

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

    const { status, paymentStatus } = validation.data;

    // Fetch order first to check business rules and gateway capabilities
    const orderDoc = await Order.findById(id);
    if (!orderDoc) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Process refund logic if transitioning to 'Refunded' status
    if (status === 'Refunded' && orderDoc.status !== 'Refunded') {
      try {
        const gateway = paymentFactory.get(orderDoc.paymentMethod);
        const refundResult = await gateway.refund(orderDoc, 'Admin initiated refund');
        if (!refundResult.success) {
          return NextResponse.json({ error: refundResult.error || 'Refund failed' }, { status: 400 });
        }

        orderDoc.status = 'Refunded';
        orderDoc.paymentDetails.status = 'Refunded';
        orderDoc.paymentDetails.refundedAt = new Date();
        orderDoc.paymentDetails.refundReason = 'Admin initiated refund';
        orderDoc.paymentDetails.gatewayLogs.push({
          action: 'PAYMENT_REFUNDED',
          details: { message: 'Refund completed successfully', transactionID: refundResult.transactionID },
        });
      } catch (err) {
        return NextResponse.json({ error: `Gateway error: ${err.message}` }, { status: 400 });
      }
    } else {
      if (status) {
        orderDoc.status = status;
      }
      if (paymentStatus) {
        orderDoc.paymentDetails.status = paymentStatus;
        orderDoc.paymentDetails.gatewayLogs.push({
          action: 'PAYMENT_STATUS_UPDATED',
          details: { message: `Payment status updated manually to ${paymentStatus}` },
        });
      }
    }

    const updatedOrder = await orderDoc.save();
    const order = updatedOrder.toObject();

    await logAudit('ORDER_STATUS_UPDATE', { id, status, paymentStatus }, adminPayload.email, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_REVENUE, CACHE_KEYS.STATS_ORDERS]);

    if (status === 'Shipped' || status === 'Delivered' || status === 'Refunded' || status === 'Failed') {
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
