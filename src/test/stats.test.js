import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

describe('useDashboardStats Hook', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should perform parallel API fetching and merge datasets on success', async () => {
    const mockRevenue = { totalRevenue: 15000, trend: 12 };
    const mockOrders = { totalOrders: 75, pendingOrders: 5 };
    const mockInventory = { products: [{ id: '1', quantity: 10 }] };

    // Parallel fetch returns mock values
    authFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockRevenue) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOrders) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockInventory) });

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
    expect(authFetch).toHaveBeenCalledTimes(3);
  });

  it('should capture failure and trigger unified error boundary if any query fails', async () => {
    authFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: false, status: 500 }) // orders fails
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

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
