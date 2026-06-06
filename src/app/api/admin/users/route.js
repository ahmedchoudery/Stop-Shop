import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import Admin from '../../../../models/Admin';
import { JWT_SECRET } from '../../../../middleware/auth';

function getAdminFromToken(req) {
  // Check auth_token cookie or Authorization header
  const cookieHeader = req.headers.get('cookie') || '';
  let token = null;

  // Simple parsing of auth_token from cookie
  const match = cookieHeader.match(/auth_token=([^;]+)/);
  if (match) {
    token = match[1];
  }

  // Fallback to Authorization header
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) return null;

  try {
    return jwt.verify(decodeURIComponent(token), JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = getAdminFromToken(req);
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
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
