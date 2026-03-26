import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from './config.js';
import { rbacGate, requireRole, requireStage } from './rbacGate.js';
import { AuditRepository } from './repositories/AuditRepository.js';

const app = express();
const auditRepo = new AuditRepository();

app.use(cors());
app.use(bodyParser.json());

// Public healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: config.environment });
});

// Admin lean endpoints
app.get('/api/admin/metrics', rbacGate, (req, res) => {
  res.json({
    metrics: { revenue: 5000, users: 42, activeSessions: 12 },
    context: `Accessed by ${req.user.email || req.user.role}`
  });
});

// Phase 12 Granularity Tests: Endpoints strictly fenced inside constrained stages demanding explicit super-admin execution structures natively
app.post('/api/admin/metrics/reset', rbacGate, requireRole('super-admin'), requireStage('dev', 'staging'), (req, res) => {
  res.json({ status: 'RESET_SUCCESS', details: 'Core metrics destroyed under elevated command execution.' });
});

// Phase 14 Telemetry: Filterable Audit streams strictly protected to internal auditors
app.get('/api/admin/audits', rbacGate, requireRole('super-admin', 'auditor'), async (req, res) => {
  try {
    const filters = req.query;
    const audits = await auditRepo.findAll(filters);
    res.json(audits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to access remote audit logs.' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`Admin API (Lean RBAC Gate) running on port ${config.port}`);
  });
}

export default app;
