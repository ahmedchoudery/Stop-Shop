import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Coupon from '../../../../../models/Coupon';
import { couponValidationSchema } from '../../../../../schemas/validation';
import { calculateDiscount } from '../../../../../utils/pricing';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = couponValidationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }

    const { code, cartTotal, activeCouponCode } = validation.data;

    if (activeCouponCode && activeCouponCode !== code?.trim().toUpperCase()) {
      return NextResponse.json({
        error: `Coupon "${activeCouponCode}" is already applied. Remove it before adding another.`
      }, { status: 400 });
    }

    if (!code?.trim()) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const coupon = await Coupon.findOne({
      code:     code.trim().toUpperCase(),
      isActive: true,
    }).lean();

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid or inactive coupon code' }, { status: 404 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 });
    }

    const orderTotal = parseFloat(cartTotal) || 0;
    if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
      return NextResponse.json({
        error: `This coupon requires a minimum order of Rs. ${coupon.minOrderValue.toLocaleString('en-PK')}`
      }, { status: 400 });
    }

    const { discount, finalTotal } = calculateDiscount(orderTotal, coupon);

    return NextResponse.json({
      code:       coupon.code,
      type:       coupon.type,
      value:      coupon.value,
      isActive:   true,
      discount,
      finalTotal,
      message:    coupon.type === 'percentage'
        ? `${coupon.value}% discount applied — you save Rs. ${discount.toLocaleString('en-PK')}`
        : `Rs. ${discount.toLocaleString('en-PK')} discount applied`,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
