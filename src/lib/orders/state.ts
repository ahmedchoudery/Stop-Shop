import OrderEvent from '@/models/OrderEvent';
// @ts-ignore
import { sendOrderStatusEmail } from '@/services/emailService';

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'Pending': ['Paid', 'Failed', 'Cancelled', 'Confirmed', 'Processing'],
  'Paid': ['Confirmed', 'Processing', 'Cancelled'],
  'Confirmed': ['Shipped', 'Cancelled'],
  'Processing': ['Shipped', 'Cancelled'],
  'Shipped': ['Delivered', 'Returned', 'Cancelled'],
  'Delivered': ['Refunded', 'Returned', 'Partially Returned'],
  'Returned': ['Refunded'],
  'Partially Returned': ['Refunded'],
};

export async function transitionOrder(
  order: any,
  toStatus: string,
  actorUserId: string,
  meta: any = {},
  session?: any
) {
  const fromStatus = order.status;
  if (fromStatus === toStatus) {
    return order;
  }

  const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
  if (!allowed.includes(toStatus)) {
    throw new Error(`Invalid transition from ${fromStatus} to ${toStatus}`);
  }

  order.status = toStatus;
  
  // Save order status update
  if (session) {
    await order.save({ session });
  } else {
    await order.save();
  }

  // Log transition to order_events
  await OrderEvent.create(
    [
      {
        orderId: order.orderID,
        from: fromStatus,
        to: toStatus,
        actorUserId: actorUserId || 'system',
        at: new Date(),
        meta: meta || {},
      },
    ],
    session ? { session } : {}
  );

  // Enqueue email notification via outbox
  await sendOrderStatusEmail(order, toStatus, session);

  return order;
}
