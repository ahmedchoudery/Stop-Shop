import { withRoute, ApiError } from '@/lib/api/withRoute';
import Order from '@/models/Order';
import { withAudit } from '@/lib/audit';
import paymentFactory from '@/lib/payments/PaymentFactory';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';
import { sendOrderStatusEmail } from '@/services/emailService';
import { z } from 'zod';

export const POST = withRoute({
  requiredRole: 'admin',
  schema: {
    params: z.object({
      id: z.string().min(1)
    })
  },
  handler: async ({ req, params, user }) => {
    const { id } = params;
    const orderDoc = await Order.findById(id);
    if (!orderDoc) {
      throw new ApiError('NOT_FOUND', 'Order not found', 404);
    }

    const tid = orderDoc.paymentDetails?.transactionID;
    if (!tid) {
      throw new ApiError('VALIDATION', 'No transaction ID is associated with this order', 400);
    }

    const gateway = paymentFactory.get(orderDoc.paymentMethod);
    const verifyResult = await gateway.verify(orderDoc, tid);

    if (!verifyResult.success) {
      throw new ApiError('VALIDATION', verifyResult.error || 'Verification failed', 400);
    }

    // Update payment details and status
    const prevStatus = orderDoc.paymentDetails.status;
    orderDoc.paymentDetails.status = 'Paid';
    if (orderDoc.status === 'Pending') {
      orderDoc.status = 'Paid';
    }
    orderDoc.paymentDetails.gatewayLogs.push({
      action: 'PAYMENT_MANUALLY_VERIFIED',
      details: { verifiedBy: user?.email || '', timestamp: new Date() }
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

    return { message: 'Payment verified successfully', status: 'Paid' };
  }
});
