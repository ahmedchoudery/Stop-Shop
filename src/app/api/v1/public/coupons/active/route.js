import { withRoute } from '@/lib/api/withRoute';
import Coupon from '@/models/Coupon';

export const GET = withRoute({
  requiredRole: 'public',
  handler: async () => {
    const coupon = await Coupon.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    if (!coupon) {
      return { coupon: null };
    }

    return {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue ?? 0,
      isActive: coupon.isActive ?? true,
    };
  }
});
