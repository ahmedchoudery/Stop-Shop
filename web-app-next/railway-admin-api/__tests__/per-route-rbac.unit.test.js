import { jest } from '@jest/globals';
import { requireRole, requireStage } from '../rbacGate.js';
import { config } from '../config.js';

describe('Phase 12 Granular Granularity Middleware', () => {

  describe('requireRole Factory', () => {
    let req, res, next;

    beforeEach(() => {
      req = { user: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('rejects correctly formatted local JWTs that lack the strictly explicit elevated role', () => {
      req.user.role = 'manager';
      const gate = requireRole('super-admin');
      
      gate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: Requires explicit [super-admin] access.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('grants seamless progression when exactly mapping explicit elevation profiles', () => {
      req.user.role = 'super-admin';
      const gate = requireRole('super-admin');
      
      gate(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireStage Factory', () => {
    let req, res, next;

    beforeEach(() => {
      req = {}; 
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('emits HTTP 404 effectively ghosting the route entirely if environment stage mismatches configuration', () => {
      config.rbacStage = 'production';
      const gate = requireStage('dev', 'staging');
      
      gate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not Found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('allows progression when executing inside dynamically permitted environment staging matrices', () => {
      config.rbacStage = 'dev';
      const gate = requireStage('dev', 'staging');
      
      gate(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
});
