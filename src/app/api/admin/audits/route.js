import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import AuditLog from '../../../../models/AuditLog';
import { requireAdmin } from '../../../../lib/adminAuth';

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100).lean();
    const formatted = logs.map(l => ({
      ...l,
      _id: l._id?.toString() || null,
      timestamp: l.timestamp ? new Date(l.timestamp).toISOString() : null,
    }));

    return NextResponse.json({ logs: formatted, total: formatted.length });
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
