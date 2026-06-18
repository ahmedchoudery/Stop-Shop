import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Order from '../../../../models/Order';
import { cacheService, CACHE_KEYS } from '../../../../services/cacheService';
import { sendOrderStatusEmail } from '../../../../services/emailService';

// Basic security token verification for the webhook
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'stop_shop_payment_secret_2026';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const signature = req.headers.get('x-payment-signature') || req.headers.get('x-signature');
    if (signature && signature !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized signature validation failed' }, { status: 401 });
    }

    const { event, orderID, transactionID, status, error } = body;

    if (!orderID) {
      return NextResponse.json({ error: 'orderID is required in webhook payload' }, { status: 400 });
    }

    const orderDoc = await Order.findOne({ orderID: orderID.toUpperCase() });
    if (!orderDoc) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Process event types
    if (event === 'payment.captured' || event === 'payment.success') {
      orderDoc.paymentDetails.status = 'Paid';
      if (orderDoc.status === 'Pending') {
        orderDoc.status = 'Paid';
      }
      orderDoc.paymentDetails.transactionID = transactionID || orderDoc.paymentDetails.transactionID;
      orderDoc.paymentDetails.gatewayLogs.push({
        action: 'WEBHOOK_PAYMENT_CAPTURED',
        details: { webhookPayload: body, timestamp: new Date() },
      });
    } else if (event === 'payment.failed') {
      orderDoc.paymentDetails.status = 'Failed';
      orderDoc.status = 'Failed';
      orderDoc.paymentDetails.gatewayLogs.push({
        action: 'WEBHOOK_PAYMENT_FAILED',
        details: { error: error || 'Payment declined by gateway', webhookPayload: body, timestamp: new Date() },
      });
    } else if (event === 'payment.refunded') {
      orderDoc.paymentDetails.status = 'Refunded';
      orderDoc.status = 'Refunded';
      orderDoc.paymentDetails.refundedAt = new Date();
      orderDoc.paymentDetails.gatewayLogs.push({
        action: 'WEBHOOK_PAYMENT_REFUNDED',
        details: { webhookPayload: body, timestamp: new Date() },
      });
    }

    await orderDoc.save();
    await cacheService.invalidateMany([CACHE_KEYS.STATS_REVENUE, CACHE_KEYS.STATS_ORDERS]);

    const orderObj = orderDoc.toObject();
    if (['Paid', 'Failed', 'Refunded'].includes(orderObj.status)) {
      sendOrderStatusEmail(orderObj, orderObj.status).catch(err => {
        console.error('[WebhookEmail] Failed to send notification:', err.message);
      });
    }

    return NextResponse.json({ received: true, orderID: orderDoc.orderID, status: orderDoc.status });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Webhook internal error' }, { status: 500 });
  }
}
