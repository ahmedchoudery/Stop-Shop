/**
 * @fileoverview Audit log service
 * Applies: nodejs-best-practices (service layer, repository pattern, fail-safe logging),
 *          javascript-pro (async/await, proper error handling)
 */

import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────────────

const auditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
      trim: true,
      maxlength: 200,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      trim: true,
      maxlength: 254,
    },
    resourceType: {
      type: String,
      enum: ['order', 'product', 'admin', 'settings', 'auth', 'system'],
      default: 'system',
    },
    resourceId: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt automatically
    versionKey: false,
  }
);

// Compound index for admin + time queries
auditSchema.index({ adminId: 1, createdAt: -1 });
auditSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.models.AuditLog ?? mongoose.model('AuditLog', auditSchema);

// ─────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────

/**
 * Log an admin action. Never throws — audit failures must not break operations.
 *
 * @param {Object} params
 * @param {string} params.action - What happened (e.g., 'product.create', 'order.status.update')
 * @param {string} params.adminId - MongoDB ObjectId of the admin
 * @param {string} [params.adminEmail] - Admin's email
 * @param {string} [params.resourceType] - Type of resource affected
 * @param {string} [params.resourceId] - ID of resource affected
 * @param {Record<string, unknown>} [params.details] - Additional context
 * @param {string} [params.ip] - Request IP
 * @param {string} [params.userAgent] - Request user agent
 * @param {'info'|'warning'|'critical'} [params.severity]
 * @returns {Promise<void>}
 */
const logAction = async ({
  action,
  adminId,
  adminEmail = '',
  resourceType = 'system',
  resourceId = '',
  details = {},
  ip = '',
  userAgent = '',
  severity = 'info',
}) => {
  try {
    await AuditLog.create({
      action,
      adminId,
      adminEmail,
      resourceType,
      resourceId,
      details,
      ip,
      userAgent,
      severity,
    });
  } catch (err) {
    // Never let audit logging break the main operation
    console.error('[Audit] Failed to log action:', action, err.message);
  }
};

/**
 * Fetch audit logs with pagination and filtering.
 *
 * @param {Object} [options]
 * @param {string} [options.adminId] - Filter by admin
 * @param {string} [options.action] - Filter by action (partial match)
 * @param {string} [options.resourceType] - Filter by resource type
 * @param {Date} [options.from] - Start date
 * @param {Date} [options.to] - End date
 * @param {number} [options.page=1]
 * @param {number} [options.limit=50]
 * @returns {Promise<{ logs: Array, total: number, page: number, pages: number }>}
 */
const getLogs = async ({
  adminId,
  action,
  resourceType,
  from,
  to,
  page = 1,
  limit = 50,
} = {}) => {
  const query = {};

  if (adminId) query.adminId = adminId;
  if (resourceType) query.resourceType = resourceType;
  if (action) query.action = { $regex: action, $options: 'i' };
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = from;
    if (to) query.createdAt.$lte = to;
  }

  const safePage = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const skip = (safePage - 1) * safeLimit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit),
  };
};

/**
 * Delete audit logs older than a given date.
 * Useful for GDPR compliance / storage management.
 *
 * @param {Date} before
 * @returns {Promise<number>} Count of deleted documents
 */
const pruneOldLogs = async (before) => {
  const result = await AuditLog.deleteMany({ createdAt: { $lt: before } });
  return result.deletedCount ?? 0;
};

export const auditService = { logAction, getLogs, pruneOldLogs };
