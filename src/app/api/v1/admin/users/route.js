import { withRoute, ApiError } from '@/lib/api/withRoute';
import argon2 from 'argon2';
import User from '@/models/User';
import UserRole from '@/models/UserRole';
import { withAudit } from '@/lib/audit';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const GET = withRoute({
  requiredRole: 'staff',
  handler: async () => {
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

    return formattedUsers;
  }
});

export const POST = withRoute({
  requiredRole: 'admin',
  schema: {
    body: z.object({
      name: z.string().min(1),
      email: z.string().trim().email(),
      password: z.string().min(6),
      roles: z.array(z.enum(['admin', 'staff', 'customer'])).min(1),
    })
  },
  handler: async ({ req, body, user }) => {
    const { name, email, password, roles } = body;
    const emailKey = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: emailKey });
    if (existingUser) {
      throw new ApiError('CONFLICT', 'Email already exists', 409);
    }

    const hashed = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    });

    const roleToAssign = roles[0];

    const result = await withAudit(
      'USER_CREATE',
      emailKey,
      req,
      null,
      { email: emailKey, role: roleToAssign },
      async (session) => {
        const createdUsers = await User.create([{
          name,
          email: emailKey,
          passwordHash: hashed,
          createdAt: new Date()
        }], { session });

        const userId = createdUsers[0]._id;
        
        await UserRole.create([{
          userId,
          role: roleToAssign,
          assignedBy: user?.email || '',
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
  }
});
