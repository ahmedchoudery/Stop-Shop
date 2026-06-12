import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Coupon from '../../../../../models/Coupon';

export async function GET(req) {
  try {
    await dbConnect();
    
    // Find the latest active coupon
    const coupon = await Coupon.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    if (!coupon) {
      return NextResponse.json({ coupon: null });
    }

    return NextResponse.json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue ?? 0,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
