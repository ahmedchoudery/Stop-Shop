import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  userEmail: String,
  resource: String,
  resourceId: String,
  details: mongoose.Schema.Types.Mixed,
  ip: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  CREATE_PRODUCT: 'CREATE_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  CREATE_ORDER: 'CREATE_ORDER',
  UPDATE_ORDER: 'UPDATE_ORDER',
  CREATE_ADMIN: 'CREATE_ADMIN',
  DELETE_ADMIN: 'DELETE_ADMIN',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
};

export const createAuditLog = async (action, userId, userEmail, resource, resourceId, details, req) => {
  try {
    const log = new AuditLog({
      action,
      userId,
      userEmail,
      resource,
      resourceId,
      details,
      ip: req?.ip || req?.connection?.remoteAddress || 'unknown',
      userAgent: req?.headers?.['user-agent'] || 'unknown'
    });
    await log.save();
    return log;
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
};

export const getAuditLogs = async (filters = {}, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.action) query.action = filters.action;
  if (filters.userId) query.userId = filters.userId;
  if (filters.resource) query.resource = filters.resource;
  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
    if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(query)
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
};

export const auditMiddleware = (action, resource, resourceIdExtractor) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const resourceId = resourceIdExtractor ? resourceIdExtractor(req, body) : null;
        await createAuditLog(
          action,
          req.user.id,
          req.user.email,
          resource,
          resourceId,
          { method: req.method, path: req.path, body: req.body },
          req
        );
      }
      return originalJson(body);
    };

    next();
  };
};

export default AuditLog;
