import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from './config.js';
import { rbacGate } from './rbacGate.js';

const app = express();

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

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`Admin API (Lean RBAC Gate) running on port ${config.port}`);
  });
}

export default app;
