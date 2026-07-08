import { withRoute, ApiError } from '@/lib/api/withRoute';
import Order from '@/models/Order';
import { updateOrderStatusSchema } from '@/schemas/validation';
import { logAudit } from '@/lib/audit';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';
import { sendOrderStatusEmail, sendAdminOrderStatusNotification } from '@/services/emailService';
import paymentFactory from '@/lib/payments/PaymentFactory';
import { z } from 'zod';

export const PATCH = withRoute({
  requiredRole: 'staff',
  schema: {
    params: z.object({
      id: z.string().min(1)
    }),
    body: updateOrderStatusSchema
  },
  handler: async ({ req, body, params, user }) => {
    const { id } = params;
    const { status, paymentStatus, courier, trackingNumber } = body;

    const orderDoc = await Order.findById(id);
    if (!orderDoc) {
      throw new ApiError('NOT_FOUND', 'Order not found', 404);
    }

    const statusChanged = status && status !== orderDoc.status;
    const trackingUpdated = (courier !== undefined && courier !== orderDoc.courier) ||
                            (trackingNumber !== undefined && trackingNumber !== orderDoc.trackingNumber);

    // Process refund logic if transitioning to 'Refunded' status
    if (status === 'Refunded' && orderDoc.status !== 'Refunded') {
      try {
        const gateway = paymentFactory.get(orderDoc.paymentMethod);
        const refundResult = await gateway.refund(orderDoc, 'Admin initiated refund');
        if (!refundResult.success) {
          throw new ApiError('VALIDATION', refundResult.error || 'Refund failed', 400);
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
        if (err instanceof ApiError) throw err;
        throw new ApiError('VALIDATION', `Gateway error: ${err.message}`, 400);
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

    if (courier !== undefined) {
      orderDoc.courier = courier;
    }
    if (trackingNumber !== undefined) {
      orderDoc.trackingNumber = trackingNumber;
    }

    const updatedOrder = await orderDoc.save();
    const order = updatedOrder.toObject();

    await logAudit('ORDER_STATUS_UPDATE', { id, status, paymentStatus, courier, trackingNumber }, user?.email || '', req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_REVENUE, CACHE_KEYS.STATS_ORDERS]);

    const triggerStatuses = ['Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Failed', 'Refunded', 'Paid'];
    const activeStatus = status || orderDoc.status;

    if (triggerStatuses.includes(activeStatus)) {
      if (statusChanged || (trackingUpdated && activeStatus === 'Shipped')) {
        // Send email to customer
        sendOrderStatusEmail(order, activeStatus).catch(err => {
          console.error('[OrderStatusEmail] Failed to notify customer:', err.message);
        });

        // Send email to admin
        sendAdminOrderStatusNotification(order, activeStatus).catch(err => {
          console.error('[AdminOrderStatusNotification] Failed to notify admin:', err.message);
        });
      }
    }

    const formattedOrder = {
      ...order,
      _id: order._id?.toString() || null,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
      updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
    };

    return formattedOrder;
  }
});
