import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/db';
import Order from '../../../../../../models/Order';
import { requireAdmin } from '../../../../../../lib/adminAuth';
import { withAudit } from '../../../../../../lib/audit';
import paymentFactory from '../../../../../../lib/payments/PaymentFactory';
import { cacheService, CACHE_KEYS } from '../../../../../../services/cacheService';
import { sendOrderStatusEmail } from '../../../../../../services/emailService';

export async function POST(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = await requireAdmin(req);
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
    const prevStatus = orderDoc.paymentDetails.status;
    orderDoc.paymentDetails.status = 'Paid';
    if (orderDoc.status === 'Pending') {
      orderDoc.status = 'Paid';
    }
    orderDoc.paymentDetails.gatewayLogs.push({
      action: 'PAYMENT_MANUALLY_VERIFIED',
      details: { verifiedBy: adminPayload.email, timestamp: new Date() }
    });

    await withAudit(
      'ORDER_PAYMENT_VERIFY',
      id,
      req,
      { status: prevStatus },
      { status: 'Paid' },
      async (session) => {
        await orderDoc.save({ session });
      }
    );

    await cacheService.invalidateMany([CACHE_KEYS.STATS_REVENUE, CACHE_KEYS.STATS_ORDERS]);

    const orderObj = orderDoc.toObject();
    sendOrderStatusEmail(orderObj, 'Paid').catch(err => {
      console.error('[AdminVerifyEmail] Failed to send notification:', err.message);
    });

    return NextResponse.json({ message: 'Payment verified successfully', status: 'Paid' });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('required') ? 401 : 403 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
