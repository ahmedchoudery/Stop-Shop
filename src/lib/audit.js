import AuditLog from '../models/AuditLog.js';

export async function logAudit(action, details, adminEmail, req) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  try {
    await AuditLog.create({
      action,
      details,
      adminEmail: adminEmail || 'system',
      ip,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error(`[Audit] Failed to log audit event: ${err.message}`);
  }
}
