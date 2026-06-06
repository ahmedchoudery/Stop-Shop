import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '../../../../lib/db';
import Admin from '../../../../models/Admin';
import { requireAdmin, requireSuperAdmin } from '../../../../lib/adminAuth';
import { logAudit } from '../../../../lib/audit';

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const users = await Admin.find().sort({ createdAt: -1 }).select('-password').lean();

    const formattedUsers = users.map(user => ({
      ...user,
      _id: user._id?.toString() || null,
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
      updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : null,
    }));

    return NextResponse.json(formattedUsers);
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
    const adminPayload = requireSuperAdmin(req);

    const body = await req.json();
    const { name, email, password, roles } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin = await Admin.create({
      name,
      email,
      password: hashed,
      roles: roles ?? ['admin'],
    });

    await logAudit('ADMIN_CREATE', { email: admin.email }, adminPayload.email, req);

    return NextResponse.json({
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      roles: admin.roles,
    }, { status: 201 });
  } catch (error) {
    if (error.message.includes('Authentication required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('required') ? 401 : 403 });
    }
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
