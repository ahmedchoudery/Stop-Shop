import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Subscriber from '../../../../models/Subscriber';
import Coupon from '../../../../models/Coupon';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email } = body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    const trimmed = email.toLowerCase().trim();
    await Subscriber.findOneAndUpdate({ email: trimmed }, { email: trimmed }, { upsert: true });

    const coupon = await Coupon.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
    let message = 'Subscribed!';
    if (coupon) {
      const discountText = coupon.type === 'percentage' ? `${coupon.value}%` : `Rs. ${coupon.value}`;
      message = `Subscribed! Use code ${coupon.code} for ${discountText} off your first order.`;
    }
    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
