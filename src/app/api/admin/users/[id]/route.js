import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Admin from '../../../../../models/Admin';
import { requireSuperAdmin } from '../../../../../lib/adminAuth';
import { logAudit } from '../../../../../lib/audit';

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = requireSuperAdmin(req);
    const { id } = params;

    const admin = await Admin.findByIdAndDelete(id).lean();
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    await logAudit('ADMIN_DELETE', { email: admin.email }, adminPayload.email, req);

    return NextResponse.json({ message: 'Admin deleted' });
  } catch (error) {
    if (error.message.includes('Authentication required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('required') ? 401 : 403 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
