/**
 * Shared Pricing & Coupon Discount Utility
 * Calculates discount and final total to ensure consistency across the application.
 *
 * @param {number} total - Subtotal amount before discount
 * @param {Object|null} coupon - Validated coupon object containing code, type, value, and minOrderValue
 * @returns {{ discount: number, finalTotal: number }}
 */
export function calculateDiscount(total, coupon) {
  const cartTotal = parseFloat(total) || 0;
  if (!coupon || coupon.isActive === false) {
    return { discount: 0, finalTotal: Math.max(0, cartTotal) };
  }

  // Check minimum order value requirement
  const minVal = parseFloat(coupon.minOrderValue) || 0;
  if (cartTotal < minVal) {
    return { discount: 0, finalTotal: Math.max(0, cartTotal) };
  }

  // Calculate discount
  let discount = 0;
  const couponValue = parseFloat(coupon.value) || 0;
  if (coupon.type === 'percentage') {
    discount = Math.round((cartTotal * couponValue) / 100);
  } else if (coupon.type === 'fixed') {
    discount = Math.min(couponValue, cartTotal);
  }

  const finalTotal = Math.max(0, cartTotal - discount);
  return { discount, finalTotal };
}
