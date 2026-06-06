import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth.js';

export function getAdminFromToken(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  let token = null;

  const match = cookieHeader.match(/auth_token=([^;]+)/);
  if (match) {
    token = match[1];
  }

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

export function requireAdmin(req) {
  const admin = getAdminFromToken(req);
  if (!admin) {
    throw new Error('Authentication required');
  }
  return admin;
}

export function requireSuperAdmin(req) {
  const admin = requireAdmin(req);
  const isSuper = admin.role === 'super-admin' || (admin.roles && admin.roles.includes('super-admin'));
  if (!isSuper) {
    throw new Error('Access denied — super-admin role required');
  }
  return admin;
}
