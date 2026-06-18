import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/db';
import Order from '../../../../../../models/Order';
import { requireAdmin } from '../../../../../../lib/adminAuth';
import paymentFactory from '../../../../../../lib/payments/PaymentFactory';
import { cacheService, CACHE_KEYS } from '../../../../../../services/cacheService';
import { sendOrderStatusEmail } from '../../../../../../services/emailService';

export async function POST(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const orderDoc = await Order.findById(id);
    if (!orderDoc) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const tid = orderDoc.paymentDetails?.transactionID;
    if (!tid) {
      return NextResponse.json({ error: 'No transaction ID is associated with this order' }, { status: 400 });
    }

    const gateway = paymentFactory.get(orderDoc.paymentMethod);
    const verifyResult = await gateway.verify(orderDoc, tid);

    if (!verifyResult.success) {
      return NextResponse.json({ error: verifyResult.error || 'Verification failed' }, { status: 400 });
    }

    // Update payment details and status
    orderDoc.paymentDetails.status = 'Paid';
    if (orderDoc.status === 'Pending') {
      orderDoc.status = 'Paid';
    }
    orderDoc.paymentDetails.gatewayLogs.push({
      action: 'PAYMENT_MANUALLY_VERIFIED',
      details: { verifiedBy: adminPayload.email, timestamp: new Date() }
    });

    await orderDoc.save();
    await cacheService.invalidateMany([CACHE_KEYS.STATS_REVENUE, CACHE_KEYS.STATS_ORDERS]);

    const orderObj = orderDoc.toObject();
    sendOrderStatusEmail(orderObj, 'Paid').catch(err => {
      console.error('[AdminVerifyEmail] Failed to send notification:', err.message);
    });

    return NextResponse.json({ message: 'Payment verified successfully', status: 'Paid' });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
