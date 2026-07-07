import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import User from '../../../../../models/User';
import UserRole from '../../../../../models/UserRole';
import { requireSuperAdmin } from '../../../../../lib/adminAuth';
import { withAudit } from '../../../../../lib/audit';

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = await requireSuperAdmin(req);
    const { id } = params;

    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await withAudit(
      'USER_DELETE',
      user.email,
      req,
      { email: user.email },
      null,
      async (session) => {
        await User.findByIdAndDelete(id, { session });
        await UserRole.deleteMany({ userId: id }, { session });
      }
    );

    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    if (error.message.includes('Authentication required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('required') ? 401 : 403 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
