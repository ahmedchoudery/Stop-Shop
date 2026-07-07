import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Coupon from '../../../../../models/Coupon';
import { requireAdmin } from '../../../../../lib/adminAuth';
import { withAudit } from '../../../../../lib/audit';

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = await requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const prevCoupon = await Coupon.findById(id).lean();
    if (!prevCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const coupon = await withAudit(
      'COUPON_UPDATE',
      id,
      req,
      prevCoupon,
      body,
      async (session) => {
        return Coupon.findByIdAndUpdate(id, body, { new: true, session }).lean();
      }
    );

    if (coupon._id) {
      coupon._id = coupon._id.toString();
    }

    return NextResponse.json(coupon);
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('required') ? 401 : 403 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = await requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;

    const prevCoupon = await Coupon.findById(id).lean();
    if (!prevCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    await withAudit(
      'COUPON_DELETE',
      prevCoupon.code,
      req,
      prevCoupon,
      null,
      async (session) => {
        await Coupon.findByIdAndDelete(id, { session });
      }
    );

    return NextResponse.json({ message: 'Coupon deleted' });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('required') ? 401 : 403 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
