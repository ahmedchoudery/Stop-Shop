import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export const dynamic = 'force-dynamic';
import EmailOutbox from '@/models/EmailOutbox';
import providerManager from '@/lib/email/emailProvider';
import { render } from '@react-email/render';
import React from 'react';

// Import templates
import OrderConfirmedCustomer from '@/emails/order-confirmed-customer';
import OrderConfirmedAdmin from '@/emails/order-confirmed-admin';
import OrderPaidCustomer from '@/emails/order-paid-customer';
import OrderPaidAdmin from '@/emails/order-paid-admin';
import OrderShippedCustomer from '@/emails/order-shipped-customer';
import OrderShippedAdmin from '@/emails/order-shipped-admin';
import OrderDeliveredCustomer from '@/emails/order-delivered-customer';
import OrderDeliveredAdmin from '@/emails/order-delivered-admin';
import OrderCancelledCustomer from '@/emails/order-cancelled-customer';
import OrderCancelledAdmin from '@/emails/order-cancelled-admin';
import OrderPaymentFailedCustomer from '@/emails/order-payment-failed-customer';
import OrderPaymentFailedAdmin from '@/emails/order-payment-failed-admin';
import OrderRefundedCustomer from '@/emails/order-refunded-customer';
import OrderRefundedAdmin from '@/emails/order-refunded-admin';

const TEMPLATES = {
  'order-confirmed-customer': OrderConfirmedCustomer,
  'order-confirmed-admin': OrderConfirmedAdmin,
  'order-paid-customer': OrderPaidCustomer,
  'order-paid-admin': OrderPaidAdmin,
  'order-shipped-customer': OrderShippedCustomer,
  'order-shipped-admin': OrderShippedAdmin,
  'order-delivered-customer': OrderDeliveredCustomer,
  'order-delivered-admin': OrderDeliveredAdmin,
  'order-cancelled-customer': OrderCancelledCustomer,
  'order-cancelled-admin': OrderCancelledAdmin,
  'order-payment-failed-customer': OrderPaymentFailedCustomer,
  'order-payment-failed-admin': OrderPaymentFailedAdmin,
  'order-refunded-customer': OrderRefundedCustomer,
  'order-refunded-admin': OrderRefundedAdmin,
};

const SUBJECT_MAPPING = {
  'order-confirmed-customer': (data) => `Order Confirmed — ${data.order.orderID}`,
  'order-confirmed-admin': (data) => `[ADMIN] New Order Placed — ${data.order.orderID}`,
  'order-paid-customer': (data) => `💳 Payment Verified — ${data.order.orderID}`,
  'order-paid-admin': (data) => `[ADMIN] Order Paid — ${data.order.orderID}`,
  'order-shipped-customer': (data) => `📦 Your order ${data.order.orderID} has been dispatched`,
  'order-shipped-admin': (data) => `[ADMIN] Order Shipped — ${data.order.orderID}`,
  'order-delivered-customer': (data) => `✅ Your order ${data.order.orderID} has arrived`,
  'order-delivered-admin': (data) => `[ADMIN] Order Delivered — ${data.order.orderID}`,
  'order-cancelled-customer': (data) => `❌ Order Cancelled — ${data.order.orderID}`,
  'order-cancelled-admin': (data) => `[ADMIN] Order Cancelled — ${data.order.orderID}`,
  'order-payment-failed-customer': (data) => `❌ Order payment failed — ${data.order.orderID}`,
  'order-payment-failed-admin': (data) => `[ADMIN] Order Payment Failed — ${data.order.orderID}`,
  'order-refunded-customer': (data) => `💵 Order Refunded — ${data.order.orderID}`,
  'order-refunded-admin': (data) => `[ADMIN] Order Refunded — ${data.order.orderID}`,
};

const BACKOFF_DELAY_MS = [
  30 * 1000,          // 30s
  2 * 60 * 1000,       // 2m
  10 * 60 * 1000,      // 10m
  60 * 60 * 1000,      // 1h
  6 * 60 * 60 * 1000,  // 6h
];

export async function GET(req) {
  try {
    // 1. Cron Authorization Check
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const url = new URL(req.url);
    const isBypass = url.searchParams.get('bypass') === 'true';

    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isBypass && process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
      return new Response('Unauthorized', { status: 401 });
    }

    await dbConnect();

    // 2. Query batch of 50 pending/failed records
    const now = new Date();
    const batch = await EmailOutbox.find({
      status: { $in: ['pending', 'failed'] },
      nextAttemptAt: { $lte: now },
    })
      .limit(50)
      .exec();

    const processed = [];

    for (const item of batch) {
      const TemplateComponent = TEMPLATES[item.template];
      if (!TemplateComponent) {
        item.status = 'dlq';
        item.lastError = `Template ${item.template} not found in TEMPLATES map.`;
        await item.save();
        processed.push({ id: item.idempotencyKey, status: 'dlq', error: item.lastError });
        continue;
      }

      // Generate subject
      const subjectFn = SUBJECT_MAPPING[item.template] || (() => `Stop & Shop Notification — ${item.idempotencyKey}`);
      const subject = subjectFn(item.data);

      try {
        // Render JSX template to HTML and plain text
        const html = render(React.createElement(TemplateComponent, item.data));
        const text = render(React.createElement(TemplateComponent, item.data), { plainText: true });

        // Dispatch via Provider Manager
        const sendResult = await providerManager.sendEmail({
          to: item.to,
          cc: item.cc,
          subject,
          html,
          text,
        });

        if (sendResult?.skipped) {
          item.status = 'sent';
          item.lastError = 'Skipped: recipient is on the suppression list.';
        } else {
          item.status = 'sent';
        }
        item.attempts += 1;
        item.sentAt = new Date();
        await item.save();
        processed.push({ id: item.idempotencyKey, status: 'sent' });
      } catch (err) {
        console.error(`❌ [Outbox Worker] Failed to process ${item.idempotencyKey}:`, err.message);
        
        item.attempts += 1;
        item.lastError = err.message;

        if (item.attempts >= 5) {
          item.status = 'dlq';
        } else {
          item.status = 'failed';
          const delay = BACKOFF_DELAY_MS[item.attempts - 1] || 6 * 60 * 60 * 1000;
          item.nextAttemptAt = new Date(Date.now() + delay);
        }

        await item.save();
        processed.push({ id: item.idempotencyKey, status: item.status, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: processed.length,
      processed,
    });
  } catch (err) {
    console.error(`❌ [Outbox Worker] Unexpected error:`, err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
