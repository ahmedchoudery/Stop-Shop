import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Review from '../../../../models/Review';
import { requireAdmin } from '../../../../lib/adminAuth';

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    const formatted = reviews.map(r => ({
      ...r,
      _id: r._id?.toString() || null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
