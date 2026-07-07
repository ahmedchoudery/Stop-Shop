import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';
import UserRole from '../models/UserRole';

let JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET;
let CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === 'stopshop-admin-secret-2024') {
  throw new Error('FATAL: JWT_SECRET is unset or using a compromised fallback secret key');
}
if (!CUSTOMER_JWT_SECRET || CUSTOMER_JWT_SECRET === 'stopshop-customer-secret-2024') {
  throw new Error('FATAL: CUSTOMER_JWT_SECRET is unset or using a compromised fallback secret key');
}

export { JWT_SECRET, CUSTOMER_JWT_SECRET };

/**
 * Checks if a user has a specific role.
 * @param {string} userId 
 * @param {string} role 
 * @returns {Promise<boolean>}
 */
export async function hasRole(userId, role) {
  try {
    const UserRoleModel = mongoose.models.UserRole || mongoose.model('UserRole');
    const uRole = await UserRoleModel.findOne({ userId, role });
    return !!uRole;
  } catch (err) {
    console.error('[Auth] hasRole check failed:', err.message);
    return false;
  }
}

/**
 * Extract token and decode payload.
 */
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

/**
 * Requires 'admin' or 'staff' role for endpoint access.
 */
export async function requireAdmin(req) {
  const payload = getAdminFromToken(req);
  if (!payload || !payload.id) {
    throw new Error('Authentication required');
  }

  const UserModel = mongoose.models.User || mongoose.model('User');
  const user = await UserModel.findById(payload.id);
  if (!user) {
    throw new Error('Authentication required');
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error('Account locked');
  }

  // User must be either 'admin' or 'staff'
  const isAdmin = await hasRole(user._id, 'admin');
  const isStaff = await hasRole(user._id, 'staff');

  if (!isAdmin && !isStaff) {
    throw new Error('Access denied');
  }

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name || user.email.split('@')[0],
    role: isAdmin ? 'admin' : 'staff'
  };
}

/**
 * Requires 'admin' role specifically.
 */
export async function requireSuperAdmin(req) {
  const admin = await requireAdmin(req);
  const isAdmin = await hasRole(admin.id, 'admin');
  if (!isAdmin) {
    throw new Error('Access denied');
  }
  return admin;
}
