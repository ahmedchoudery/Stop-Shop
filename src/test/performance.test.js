import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getProducts } from '../app/api/v1/public/products/route';
import { POST as postVitals } from '../app/api/v1/analytics/vitals/route';
import Product from '../models/Product';
// @ts-ignore
import logger from '../utils/logger';

vi.mock('../models/Product', () => ({
  default: {
    countDocuments: vi.fn(),
    find: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn(),
  }
}));

vi.mock('../lib/db', () => ({
  default: vi.fn().mockResolvedValue(true),
  dbConnect: vi.fn().mockResolvedValue(true),
}));

vi.mock('../lib/adminAuth', () => ({
  getAdminFromToken: vi.fn().mockReturnValue(null),
  hasRole: vi.fn().mockResolvedValue(false),
  JWT_SECRET: 'test-secret',
  CUSTOMER_JWT_SECRET: 'test-customer-secret',
}));

vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
  }
}));

describe('Performance Overhaul Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/public/products with category filtering', () => {
    it('applies category filter to Product query and returns cache headers', async () => {
      Product.countDocuments.mockResolvedValue(1);
      Product.lean.mockResolvedValue([
        { _id: '123', name: 'Product A', bucket: 'Tops' }
      ]);

      const req = new Request('http://localhost/api/v1/public/products?category=tops');

      const response = await getProducts(req);
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate=600');

      expect(Product.countDocuments).toHaveBeenCalledWith({ bucket: 'Tops' });
      expect(Product.find).toHaveBeenCalledWith({ bucket: 'Tops' });

      const data = await response.json();
      expect(data[0].name).toBe('Product A');
    });
  });

  describe('POST /api/analytics/vitals', () => {
    it('accepts web vitals payload and logs it', async () => {
      const metric = { name: 'LCP', value: 1200, id: 'v1' };
      const req = new Request('http://localhost/api/analytics/vitals', {
        method: 'POST',
        body: JSON.stringify(metric),
      });

      const response = await postVitals(req);
      expect(response.status).toBe(204);
      expect(logger.info).toHaveBeenCalledWith(
        { webVitals: metric },
        '[Web Vitals] Received LCP metric: 1200'
      );
    });
  });
});
