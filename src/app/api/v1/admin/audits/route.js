import { withRoute } from '@/lib/api/withRoute';
import AuditLog from '@/models/AuditLog';
import '@/models/User';

export const GET = withRoute({
  requiredRole: 'admin',
  handler: async () => {
    const logs = await AuditLog.find()
      .populate('actorUserId', 'email')
      .sort({ at: -1 })
      .limit(100)
      .lean();

    const formatted = logs.map((l) => ({
      ...l,
      _id: l._id?.toString() || null,
      adminEmail: l.actorUserId?.email || 'system',
      timestamp: l.at ? new Date(l.at).toISOString() : null,
      details: l.after, // Fallback details/target
      severity: l.action.includes('DELETE') ? 'critical' : l.action.includes('UPDATE') ? 'warning' : 'info'
    }));

    return { logs: formatted, total: formatted.length };
  }
});
