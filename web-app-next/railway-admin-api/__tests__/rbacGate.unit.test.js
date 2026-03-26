import jwt from 'jsonwebtoken';
import { rbacGate } from '../rbacGate.js';
import { config } from '../config.js';

describe('rbacGate Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('rejects requests without authorization header', () => {
    rbacGate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Missing or malformed token' });
  });

  it('rejects invalid tokens', () => {
    req.headers.authorization = 'Bearer invalid.token.here';
    rbacGate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid token' });
  });

  it('accepts valid admin token', () => {
    const token = jwt.sign({ role: 'admin' }, config.jwtSecret);
    req.headers.authorization = `Bearer ${token}`;
    rbacGate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.role).toBe('admin');
  });

  it('accepts allowed email even if not admin', () => {
    config.allowedEmails = ['test@example.com'];
    const token = jwt.sign({ email: 'test@example.com', role: 'user' }, config.jwtSecret);
    req.headers.authorization = `Bearer ${token}`;
    rbacGate(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects regular users not in allowed list', () => {
    config.allowedEmails = ['admin@example.com'];
    const token = jwt.sign({ email: 'hacker@example.com', role: 'user' }, config.jwtSecret);
    req.headers.authorization = `Bearer ${token}`;
    rbacGate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
