import { NextResponse } from 'next/server';
import argon2 from 'argon2';
import dbConnect from '../../../../lib/db';
import User from '../../../../models/User';
import UserRole from '../../../../models/UserRole';
import { requireAdmin, requireSuperAdmin } from '../../../../lib/adminAuth';
import { withAudit } from '../../../../lib/audit';

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = await requireAdmin(req);

    const users = await User.find().sort({ createdAt: -1 }).lean();

    const formattedUsers = await Promise.all(users.map(async (user) => {
      const rolesDocs = await UserRole.find({ userId: user._id }).lean();
      const roles = rolesDocs.map(r => r.role);
      
      return {
        _id: user._id.toString(),
        name: user.name || user.email.split('@')[0],
        email: user.email,
        roles,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
        twoFactorEnabled: user.twoFactorEnabled
      };
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('required') ? 401 : 403 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const adminPayload = await requireSuperAdmin(req);

    const body = await req.json();
    const { name, email, password, roles } = body;

    const emailKey = (email || '').toLowerCase().trim();
    if (!name || !emailKey || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const roleToAssign = roles?.[0] || 'admin';
    if (!['admin', 'staff', 'customer'].includes(roleToAssign)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: emailKey });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    // Hash password with Argon2id
    const hashed = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    });

    const result = await withAudit(
      'USER_CREATE',
      emailKey,
      req,
      null,
      { email: emailKey, role: roleToAssign },
      async (session) => {
        const user = await User.create([{
          name,
          email: emailKey,
          passwordHash: hashed,
          createdAt: new Date()
        }], { session });

        const userId = user[0]._id;
        
        await UserRole.create([{
          userId,
          role: roleToAssign,
          assignedBy: adminPayload.email,
          assignedAt: new Date()
        }], { session });

        return {
          id: userId.toString(),
          name,
          email: emailKey,
          roles: [roleToAssign]
        };
      }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error.message.includes('Authentication required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('required') ? 401 : 403 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
