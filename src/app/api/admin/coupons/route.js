import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Coupon from '../../../../models/Coupon';
import { requireAdmin } from '../../../../lib/adminAuth';
import { logAudit } from '../../../../lib/audit';

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    const formatted = coupons.map(c => ({
      ...c,
      _id: c._id?.toString() || null,
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
      updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { code, type, value, minOrderValue, maxUses, expiresAt } = body;

    if (!code || value === undefined) {
      return NextResponse.json({ error: 'Code and value are required' }, { status: 400 });
    }

    const coupon = await Coupon.create({
      code:          code.trim().toUpperCase(),
      type:          type ?? 'percentage',
      value:         parseFloat(value),
      minOrderValue: parseFloat(minOrderValue) || 0,
      maxUses:       maxUses ? parseInt(maxUses) : null,
      expiresAt:     expiresAt ? new Date(expiresAt) : null,
      isActive:      true,
    });

    await logAudit('COUPON_CREATE', { code: coupon.code, type: coupon.type, value: coupon.value }, adminPayload.email, req);

    const formatted = coupon.toObject();
    if (formatted._id) {
      formatted._id = formatted._id.toString();
    }

    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
