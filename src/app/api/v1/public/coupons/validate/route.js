import { withRoute, ApiError } from '@/lib/api/withRoute';
import Coupon from '@/models/Coupon';
import { couponValidationSchema } from '@/schemas/validation';
import { calculateDiscount } from '@/utils/pricing';

export const POST = withRoute({
  requiredRole: 'public',
  schema: {
    body: couponValidationSchema
  },
  handler: async ({ body }) => {
    const { code, cartTotal, activeCouponCode } = body;

    if (activeCouponCode && activeCouponCode !== code?.trim().toUpperCase()) {
      throw new ApiError('VALIDATION', `Coupon "${activeCouponCode}" is already applied. Remove it before adding another.`, 400);
    }

    if (!code?.trim()) {
      throw new ApiError('VALIDATION', 'Coupon code is required', 400);
    }

    const coupon = await Coupon.findOne({
      code:     code.trim().toUpperCase(),
      isActive: true,
    }).lean();

    if (!coupon) {
      throw new ApiError('NOT_FOUND', 'Invalid or inactive coupon code', 404);
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new ApiError('VALIDATION', 'This coupon has expired', 400);
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new ApiError('VALIDATION', 'This coupon has reached its usage limit', 400);
    }

    const orderTotal = parseFloat(cartTotal) || 0;
    if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
      throw new ApiError('VALIDATION', `This coupon requires a minimum order of Rs. ${coupon.minOrderValue.toLocaleString('en-PK')}`, 400);
    }

    const { discount, finalTotal } = calculateDiscount(orderTotal, coupon);

    return {
      code:       coupon.code,
      type:       coupon.type,
      value:      coupon.value,
      isActive:   true,
      discount,
      finalTotal,
      message:    coupon.type === 'percentage'
        ? `${coupon.value}% discount applied — you save Rs. ${discount.toLocaleString('en-PK')}`
        : `Rs. ${discount.toLocaleString('en-PK')} discount applied`,
    };
  }
});
