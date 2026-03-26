import request from 'supertest';
import app from '../server.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

describe('Admin API Integration', () => {
  
  it('GET /api/health should be public', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/admin/metrics should reject without token', async () => {
    const res = await request(app).get('/api/admin/metrics');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/admin/metrics should return data for admin', async () => {
    const token = jwt.sign({ role: 'admin', email: 'boss@store.com' }, config.jwtSecret);
    const res = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.metrics.revenue).toBeDefined();
    expect(res.body.context).toContain('boss@store.com');
  });
});
