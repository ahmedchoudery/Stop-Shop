import { withRoute, ApiError } from '@/lib/api/withRoute';
import crypto from 'crypto';
import Order from '@/models/Order';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';
import { transitionOrder } from '@/lib/orders/state';
import { z } from 'zod';

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'stop_shop_payment_secret_2026';

function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    crypto.timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

import { withIdempotency } from '@/utils/idempotency.js';

export const POST = withIdempotency(withRoute({
  requiredRole: 'public',
  schema: {
    body: z.object({
      event: z.enum(['payment.captured', 'payment.success', 'payment.failed', 'payment.refunded']),
      orderID: z.string().min(1),
      transactionID: z.string().optional(),
      status: z.string().optional(),
      error: z.string().optional(),
    })
  },
  handler: async ({ req, body }) => {
    const signature = req.headers.get('x-payment-signature') || req.headers.get('x-signature');
    if (!signature) {
      throw new ApiError('UNAUTHENTICATED', 'Webhook signature is required', 401);
    }

    if (!safeCompare(signature, WEBHOOK_SECRET)) {
      throw new ApiError('UNAUTHENTICATED', 'Unauthorized signature validation failed', 401);
    }

    const { event, orderID, transactionID, error } = body;

    const orderDoc = await Order.findOne({ orderID: orderID.toUpperCase() });
    if (!orderDoc) {
      throw new ApiError('NOT_FOUND', 'Order not found', 404);
    }

    let targetStatus = orderDoc.status;
    if (event === 'payment.captured' || event === 'payment.success') {
      orderDoc.paymentDetails.status = 'Paid';
      if (orderDoc.status === 'Pending') {
        targetStatus = 'Paid';
      }
      orderDoc.paymentDetails.transactionID = transactionID || orderDoc.paymentDetails.transactionID;
      orderDoc.paymentDetails.gatewayLogs.push({
        action: 'WEBHOOK_PAYMENT_CAPTURED',
        details: { webhookPayload: body, timestamp: new Date() },
      });
    } else if (event === 'payment.failed') {
      orderDoc.paymentDetails.status = 'Failed';
      targetStatus = 'Failed';
      orderDoc.paymentDetails.gatewayLogs.push({
        action: 'WEBHOOK_PAYMENT_FAILED',
        details: { error: error || 'Payment declined by gateway', webhookPayload: body, timestamp: new Date() },
      });
    } else if (event === 'payment.refunded') {
      orderDoc.paymentDetails.status = 'Refunded';
      targetStatus = 'Refunded';
      orderDoc.paymentDetails.refundedAt = new Date();
      orderDoc.paymentDetails.gatewayLogs.push({
        action: 'WEBHOOK_PAYMENT_REFUNDED',
        details: { webhookPayload: body, timestamp: new Date() },
      });
    }

    if (targetStatus !== orderDoc.status) {
      await transitionOrder(orderDoc, targetStatus, 'system', { webhookEvent: event });
    } else {
      await orderDoc.save();
    }
    await cacheService.invalidateMany([CACHE_KEYS.STATS_REVENUE, CACHE_KEYS.STATS_ORDERS]);



    return { received: true, orderID: orderDoc.orderID, status: orderDoc.status };
  }
}));

