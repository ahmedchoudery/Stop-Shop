import { describe, it, expect, vi, beforeEach } from 'vitest';

const { selectMock, sortMock, skipMock, limitMock, leanMock, findMock, countDocumentsMock } = vi.hoisted(() => ({
  selectMock: vi.fn().mockReturnThis(),
  sortMock: vi.fn().mockReturnThis(),
  skipMock: vi.fn().mockReturnThis(),
  limitMock: vi.fn().mockReturnThis(),
  leanMock: vi.fn().mockResolvedValue([]),
  findMock: vi.fn(),
  countDocumentsMock: vi.fn().mockResolvedValue(100),
}));

// Setup hoisted mock for dbConnect
vi.mock('../lib/db.js', () => ({
  default: vi.fn().mockResolvedValue(true),
  dbConnect: vi.fn().mockResolvedValue(true),
}));

// Setup hoisted mock for Admin Auth
vi.mock('../lib/adminAuth.js', () => ({
  requireAdmin: vi.fn().mockReturnValue({ email: 'admin@stopshop.pk' }),
}));

// Setup hoisted mocks for models
vi.mock('../models/Product.js', () => ({
  default: {
    find: findMock,
    countDocuments: countDocumentsMock,
  },
}));

vi.mock('../models/Order.js', () => ({
  default: {
    find: findMock,
    countDocuments: countDocumentsMock,
  },
}));

vi.mock('../models/Review.js', () => ({
  default: {
    find: findMock,
    countDocuments: countDocumentsMock,
  },
}));

vi.mock('../models/Inventory.js', () => ({
  default: {
    find: findMock,
    countDocuments: countDocumentsMock,
  },
}));

// Import endpoints
import { GET as getPublicProducts } from '../app/api/public/products/route.js';
import { GET as getAdminProducts } from '../app/api/admin/products/route.js';
import { GET as getAdminOrders } from '../app/api/orders/route.js';
import { GET as getAdminReviews } from '../app/api/admin/reviews/route.js';
import { GET as getAdminInventory } from '../app/api/admin/inventory/route.js';

describe('Pagination & Projection Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default find mock chain
    findMock.mockReturnValue({
      select: selectMock,
      sort: sortMock,
      skip: skipMock,
      limit: limitMock,
      lean: leanMock,
    });
  });

  const makeMockRequest = (url) => ({
    url,
  });

  describe('GET /api/public/products', () => {
    it('uses correct default values (page=1, limit=100) and sets headers', async () => {
      countDocumentsMock.mockResolvedValueOnce(250);
      leanMock.mockResolvedValueOnce([
        { id: '1', name: 'Product A', price: 100 }
      ]);

      const req = makeMockRequest('http://localhost:3000/api/public/products');
      const res = await getPublicProducts(req);
      
      expect(res.status).toBe(200);
      expect(skipMock).toHaveBeenCalledWith(0);
      expect(limitMock).toHaveBeenCalledWith(100);
      expect(selectMock).toHaveBeenCalledWith(expect.stringContaining('name'));

      expect(res.headers.get('X-Total-Count')).toBe('250');
      expect(res.headers.get('X-Total-Pages')).toBe('3');
      expect(res.headers.get('X-Current-Page')).toBe('1');
      expect(res.headers.get('X-Limit')).toBe('100');
    });

    it('extracts and applies custom page & limit parameters correctly', async () => {
      countDocumentsMock.mockResolvedValueOnce(250);
      leanMock.mockResolvedValueOnce([]);

      const req = makeMockRequest('http://localhost:3000/api/public/products?page=3&limit=25');
      await getPublicProducts(req);

      expect(skipMock).toHaveBeenCalledWith(50); // (3-1) * 25
      expect(limitMock).toHaveBeenCalledWith(25);
    });

    it('clamps negative or zero page parameter bounds to page 1', async () => {
      countDocumentsMock.mockResolvedValueOnce(50);
      leanMock.mockResolvedValueOnce([]);

      const req = makeMockRequest('http://localhost:3000/api/public/products?page=-5&limit=10');
      await getPublicProducts(req);

      expect(skipMock).toHaveBeenCalledWith(0);
      expect(limitMock).toHaveBeenCalledWith(10);
    });

    it('clamps maximum limit parameter to 100 items', async () => {
      countDocumentsMock.mockResolvedValueOnce(500);
      leanMock.mockResolvedValueOnce([]);

      const req = makeMockRequest('http://localhost:3000/api/public/products?page=1&limit=500');
      await getPublicProducts(req);

      expect(limitMock).toHaveBeenCalledWith(100);
    });
  });

  describe('GET /api/admin/products', () => {
    it('applies pagination and projects correctly', async () => {
      countDocumentsMock.mockResolvedValueOnce(80);
      leanMock.mockResolvedValueOnce([]);

      const req = makeMockRequest('http://localhost:3000/api/admin/products?page=2&limit=10');
      const res = await getAdminProducts(req);

      expect(skipMock).toHaveBeenCalledWith(10);
      expect(limitMock).toHaveBeenCalledWith(10);
      expect(selectMock).toHaveBeenCalledWith(expect.stringContaining('createdAt'));

      expect(res.headers.get('X-Total-Count')).toBe('80');
      expect(res.headers.get('X-Total-Pages')).toBe('8');
    });
  });

  describe('GET /api/orders', () => {
    it('applies pagination and projects correctly', async () => {
      countDocumentsMock.mockResolvedValueOnce(150);
      leanMock.mockResolvedValueOnce([]);

      const req = makeMockRequest('http://localhost:3000/api/orders?page=4&limit=20');
      const res = await getAdminOrders(req);

      expect(skipMock).toHaveBeenCalledWith(60);
      expect(limitMock).toHaveBeenCalledWith(20);
      expect(selectMock).toHaveBeenCalledWith(expect.stringContaining('orderID'));

      expect(res.headers.get('X-Total-Count')).toBe('150');
      expect(res.headers.get('X-Total-Pages')).toBe('8');
    });
  });

  describe('GET /api/admin/reviews', () => {
    it('applies pagination and projects correctly', async () => {
      countDocumentsMock.mockResolvedValueOnce(30);
      leanMock.mockResolvedValueOnce([]);

      const req = makeMockRequest('http://localhost:3000/api/admin/reviews?page=1&limit=15');
      const res = await getAdminReviews(req);

      expect(skipMock).toHaveBeenCalledWith(0);
      expect(limitMock).toHaveBeenCalledWith(15);
      expect(selectMock).toHaveBeenCalledWith(expect.stringContaining('rating'));

      expect(res.headers.get('X-Total-Count')).toBe('30');
      expect(res.headers.get('X-Total-Pages')).toBe('2');
    });
  });

  describe('GET /api/admin/inventory', () => {
    it('applies pagination and projects correctly', async () => {
      countDocumentsMock.mockResolvedValueOnce(12);
      leanMock.mockResolvedValueOnce([]);

      const req = makeMockRequest('http://localhost:3000/api/admin/inventory?page=2&limit=5');
      const res = await getAdminInventory(req);

      expect(skipMock).toHaveBeenCalledWith(5);
      expect(limitMock).toHaveBeenCalledWith(5);
      expect(selectMock).toHaveBeenCalledWith(expect.stringContaining('totalStock'));

      expect(res.headers.get('X-Total-Count')).toBe('12');
      expect(res.headers.get('X-Total-Pages')).toBe('3');
    });
  });
});
