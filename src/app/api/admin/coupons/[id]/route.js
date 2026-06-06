import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Coupon from '../../../../../models/Coupon';
import { requireAdmin } from '../../../../../lib/adminAuth';
import { logAudit } from '../../../../../lib/audit';

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const coupon = await Coupon.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    await logAudit('COUPON_UPDATE', { id }, adminPayload.email, req);

    if (coupon._id) {
      coupon._id = coupon._id.toString();
    }

    return NextResponse.json(coupon);
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;

    const coupon = await Coupon.findByIdAndDelete(id).lean();
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    await logAudit('COUPON_DELETE', { code: coupon.code }, adminPayload.email, req);

    return NextResponse.json({ message: 'Coupon deleted' });
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
