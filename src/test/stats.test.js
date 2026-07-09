import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardStats } from '../hooks/useDomain.js';

// Mock authFetch and apiUrl dependencies
vi.mock('../lib/auth.js', () => ({
  authFetch: vi.fn(),
  handleAuthError: vi.fn(),
}));

vi.mock('../config/api.js', () => ({
  apiUrl: (path) => path,
}));

import { authFetch } from '../lib/auth.js';

// Mock cache bust response — always resolves OK (non-fatal)
const CACHE_BUST_OK = { ok: true, json: () => Promise.resolve({ success: true }) };

describe('useDashboardStats Hook', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should perform parallel API fetching and merge datasets on success', async () => {
    const mockRevenue = { totalRevenue: 15000, trend: 12 };
    const mockOrders = { totalOrders: 75, pendingOrders: 5 };
    const mockInventory = { products: [{ id: '1', quantity: 10 }] };

    // First call = cache bust, then parallel stats fetches
    authFetch
      .mockResolvedValueOnce(CACHE_BUST_OK)                                              // POST /api/admin/cache/bust
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockRevenue) })    // GET /api/stats/revenue
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOrders) })     // GET /api/stats/orders
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockInventory) }); // GET /api/stats/inventory

    const { result } = renderHook(() => useDashboardStats());

    expect(result.current.loading).toBe(true);

    // Flush promises
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.revenue).toEqual(mockRevenue);
    expect(result.current.orders).toEqual(mockOrders);
    expect(result.current.inventory).toEqual(mockInventory);
    expect(result.current.error).toBeNull();
    // 1 cache bust + 3 stats fetches = 4 total calls
    expect(authFetch).toHaveBeenCalledTimes(4);
    expect(authFetch).toHaveBeenNthCalledWith(
      1,
      '/api/admin/cache/bust',
      { method: 'POST' }
    );
  });

  it('should capture failure and trigger unified error boundary if any query fails', async () => {
    authFetch
      .mockResolvedValueOnce(CACHE_BUST_OK)                                              // POST /api/admin/cache/bust
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })             // GET revenue — ok
      .mockResolvedValueOnce({ ok: false, status: 500 })                                // GET orders — fails
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });            // GET inventory — ok

    const { result } = renderHook(() => useDashboardStats());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to load orders data');
    expect(result.current.revenue).toBeUndefined();
    expect(result.current.orders).toBeUndefined();
  });
});
