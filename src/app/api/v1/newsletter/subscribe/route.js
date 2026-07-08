import { withRoute } from '@/lib/api/withRoute';
import Subscriber from '@/models/Subscriber';
import Coupon from '@/models/Coupon';
import { z } from 'zod';

export const POST = withRoute({
  requiredRole: 'public',
  schema: {
    body: z.object({
      email: z.string().trim().email('Valid email is required')
    })
  },
  handler: async ({ body }) => {
    const trimmed = body.email.toLowerCase().trim();
    await Subscriber.findOneAndUpdate({ email: trimmed }, { email: trimmed }, { upsert: true });

    const coupon = await Coupon.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
    let message = 'Subscribed!';
    if (coupon) {
      const discountText = coupon.type === 'percentage' ? `${coupon.value}%` : `Rs. ${coupon.value}`;
      message = `Subscribed! Use code ${coupon.code} for ${discountText} off your first order.`;
    }
    return { message };
  }
});
