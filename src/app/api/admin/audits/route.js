import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import AuditLog from '../../../../models/AuditLog';
import User from '../../../../models/User';
import { requireAdmin } from '../../../../lib/adminAuth';

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = await requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const logs = await AuditLog.find()
      .populate('actorUserId', 'email')
      .sort({ at: -1 })
      .limit(100)
      .lean();

    const formatted = logs.map(l => ({
      ...l,
      _id: l._id?.toString() || null,
      adminEmail: l.actorUserId?.email || 'system',
      timestamp: l.at ? new Date(l.at).toISOString() : null,
      details: l.after, // Fallback details/target
      severity: l.action.includes('DELETE') ? 'critical' : l.action.includes('UPDATE') ? 'warning' : 'info'
    }));

    return NextResponse.json({ logs: formatted, total: formatted.length });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('required') ? 401 : 403 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
