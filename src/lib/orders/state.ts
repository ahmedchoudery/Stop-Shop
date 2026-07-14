import OrderEvent from '@/models/OrderEvent';
import EmailOutbox from '@/models/EmailOutbox';
import Order from '@/models/Order';

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

const TEMPLATE_STATUS_MAP: Record<string, string> = {
  'Confirmed': 'confirmed',
  'Paid': 'paid',
  'Shipped': 'shipped',
  'Delivered': 'delivered',
  'Cancelled': 'cancelled',
  'Failed': 'payment-failed',
  'Refunded': 'refunded',
};

export async function enqueueOutboxEmails(order: any, status: string, session?: any) {
  const templateName = TEMPLATE_STATUS_MAP[status];
  if (!templateName) {
    return; // No email template for this status
  }

  const customerEmail = order?.customer?.email;
  if (!customerEmail) {
    return;
  }

  const orderObj = order.toObject ? order.toObject() : order;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@stopandshop.pk';

  // Count past orders for this customer (excluding the current one)
  const pastCountQuery = Order.countDocuments({
    'customer.email': customerEmail,
    orderID: { $ne: order.orderID },
  });
  const customerPastOrderCount = session
    ? await pastCountQuery.session(session)
    : await pastCountQuery;

  // Queue customer email outbox row
  await EmailOutbox.create(
    [
      {
        idempotencyKey: `${order.orderID}:${status}`,
        template: `order-${templateName}-customer`,
        to: customerEmail,
        data: { order: orderObj },
        status: 'pending',
        attempts: 0,
      },
    ],
    session ? { session } : {}
  );

  // Queue admin email outbox row
  await EmailOutbox.create(
    [
      {
        idempotencyKey: `${order.orderID}:${status}:admin`,
        template: `order-${templateName}-admin`,
        to: adminEmail,
        data: {
          order: orderObj,
          customerPastOrderCount,
        },
        status: 'pending',
        attempts: 0,
      },
    ],
    session ? { session } : {}
  );

  console.info(`📧 [Outbox] Customer and Admin emails queued for ${order.orderID} (${status})`);
}

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

  // Enqueue email notifications via outbox
  await enqueueOutboxEmails(order, toStatus, session);

  return order;
}
