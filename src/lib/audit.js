import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import { getAdminFromToken } from './adminAuth.js';

/**
 * Transaction-safe audit log wrapper for all write operations.
 * Performs the write operation and logs it in the same transaction.
 * Falls back gracefully to non-transaction execution if MongoDB topology doesn't support replica sets.
 * 
 * @param {string} action - e.g. 'PRODUCT_CREATE'
 * @param {string} target - e.g. product ID, coupon code
 * @param {Request} req - Request object to parse IP/UA and actor ID
 * @param {any} before - State before write
 * @param {any} after - State after write
 * @param {Function} operationFn - Async function performing the write (accepts session parameter)
 * @returns {Promise<any>} Result of operationFn
 */
export async function withAudit(action, target, req, before, after, operationFn) {
  const adminPayload = getAdminFromToken(req);
  const actorUserId = adminPayload?.id ? new mongoose.Types.ObjectId(adminPayload.id) : null;
  const ip = req ? (req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1') : '127.0.0.1';
  const userAgent = req ? (req.headers.get('user-agent') || 'Unknown') : 'Unknown';

  if (!actorUserId) {
    throw new Error('Audit Log failed: Actor user ID not found in session');
  }

  const db = mongoose.connection;
  const session = await db.startSession();
  let result;

  try {
    try {
      session.startTransaction();

      // Perform operation passing transaction session
      result = await operationFn(session);

      // Create Audit log in the same transaction
      await AuditLog.create([{
        actorUserId,
        action,
        target: target || 'N/A',
        before,
        after,
        ip,
        userAgent,
        at: new Date()
      }], { session });

      await session.commitTransaction();
    } catch (txError) {
      const msg = txError.message || '';
      // If transactions are not supported (e.g. local standalone MongoDB)
      if (msg.includes('transaction') || txError.code === 20 || msg.includes('replica set') || msg.includes('topology')) {
        await session.abortTransaction();
        
        // Execute without transaction
        result = await operationFn(null);

        // Save log normally
        await AuditLog.create({
          actorUserId,
          action,
          target: target || 'N/A',
          before,
          after,
          ip,
          userAgent,
          at: new Date()
        });
      } else {
        await session.abortTransaction();
        throw txError;
      }
    }
  } finally {
    session.endSession();
  }

  return result;
}

/**
 * Legacy logAudit helper to prevent breaking imports during migration.
 */
export async function logAudit(action, details, adminEmail, req) {
  const ip = req ? (req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1') : '127.0.0.1';
  const userAgent = req ? (req.headers.get('user-agent') || 'Unknown') : 'Unknown';
  try {
    const User = mongoose.models.User || mongoose.model('User');
    let user = await User.findOne({ email: adminEmail });
    if (!user) {
      // Fetch any user or use system placeholder
      user = await User.findOne();
    }
    await AuditLog.create({
      actorUserId: user ? user._id : new mongoose.Types.ObjectId(),
      action,
      target: details?.id || details?.email || 'N/A',
      before: null,
      after: details,
      ip,
      userAgent,
      at: new Date()
    });
  } catch (err) {
    console.error(`[Audit] Legacy logAudit failed: ${err.message}`);
  }
}
