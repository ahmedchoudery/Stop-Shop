/**
 * @fileoverview Domain-specific data hooks
 * Applies: react-patterns (extract hooks), nodejs-best-practices (layered architecture),
 *          react-ui-patterns (loading only when no data), javascript-pro (async/await)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiUrl } from '../config/api.js';
import { authFetch, handleAuthError } from '../lib/auth.js';
import { useAsync, useMutation } from './useAsync.js';

// ─────────────────────────────────────────────────────────────────
// PRODUCTS HOOK
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch all admin products with CRUD operations
 * @returns {{ products, loading, refreshing, error, createProduct, updateProduct, deleteProduct, refetch }}
 */
export function useProducts() {
  const fetchProducts = useCallback(async () => {
    const res = await authFetch(apiUrl('/api/admin/products'));
    handleAuthError(res.status);
    if (!res.ok) throw new Error('Failed to load administrative product catalog');
    const data = await res.json();
    return Array.isArray(data) ? data : (data.products ?? []);
  }, []);

  const [{ data: products, loading, refreshing, error }, { execute: refetch }] = useAsync(
    fetchProducts,
    { initialData: [] }
  );

  useEffect(() => { refetch(); }, [refetch]);

  const { mutate: createProduct, loading: creating } = useMutation(
    async (productData) => {
      const res = await authFetch(apiUrl('/api/admin/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (!res.ok) {
        let errMsg = 'Failed to create product';
        try {
          const errData = await res.json();
          errMsg = errData.message || errData.error || (errData.errors?.[0]?.message) || errMsg;
        } catch { /* fallback to default */ }
        throw new Error(errMsg);
      }
      return res.json();
    },
    { onSuccess: () => refetch() }
  );

  const { mutate: updateProduct, loading: updating } = useMutation(
    async ({ id, data }) => {
      const res = await authFetch(apiUrl(`/api/admin/products/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update product');
      return res.json();
    },
    { onSuccess: () => refetch() }
  );

  const { mutate: deleteProduct, loading: deleting } = useMutation(
    async (id) => {
      const res = await authFetch(apiUrl(`/api/admin/products/${id}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete product');
    },
    { onSuccess: () => refetch() }
  );

  return {
    products: products ?? [],
    loading,
    refreshing,
    error,
    creating,
    updating,
    deleting,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────────
// PUBLIC PRODUCTS HOOK (storefront)
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch public products for the storefront
 */
export function usePublicProducts() {
  const fetchPublicProducts = useCallback(async () => {
    const res = await fetch(apiUrl('/api/public/products'));
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return Array.isArray(data) ? data : (data.products ?? []);
  }, []);

  const [{ data: products, loading, error }, { execute: refetch }] = useAsync(
    fetchPublicProducts,
    { initialData: [] }
  );

  useEffect(() => { refetch(); }, [refetch]);

  return { products: products ?? [], loading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────
// ORDERS HOOK
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch and manage orders
 */
export function useOrders() {
  const fetchOrders = useCallback(async () => {
    const res = await authFetch(apiUrl('/api/orders'));
    handleAuthError(res.status);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  }, []);

  const [{ data: orders, loading, refreshing, error }, { execute: refetch }] = useAsync(
    fetchOrders,
    { initialData: [] }
  );

  useEffect(() => { refetch(); }, [refetch]);

  const { mutate: updateOrderStatus, loading: updating } = useMutation(
    async ({ orderId, status }) => {
      const res = await authFetch(apiUrl(`/api/orders/${orderId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update order status');
      return res.json();
    },
    { onSuccess: () => refetch() }
  );

  return {
    orders: orders ?? [],
    loading,
    refreshing,
    error,
    updating,
    updateOrderStatus,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────────
// STATS HOOKS
// ─────────────────────────────────────────────────────────────────

export function useRevenueStats() {
  const fetchRevenue = useCallback(async () => {
    const res = await authFetch(apiUrl('/api/stats/revenue'));
    if (!res.ok) throw new Error('Failed to fetch revenue stats');
    return res.json();
  }, []);

  const [state, { execute: refetch }] = useAsync(fetchRevenue);
  useEffect(() => { refetch(); }, [refetch]);
  return { ...state, refetch };
}

export function useOrderStats() {
  const fetchStats = useCallback(async () => {
    const res = await authFetch(apiUrl('/api/stats/orders'));
    if (!res.ok) throw new Error('Failed to fetch order stats');
    return res.json();
  }, []);

  const [state, { execute: refetch }] = useAsync(fetchStats);
  useEffect(() => { refetch(); }, [refetch]);
  return { ...state, refetch };
}

export function useInventoryStats() {
  const fetchInventory = useCallback(async () => {
    const res = await authFetch(apiUrl('/api/stats/inventory'));
    if (!res.ok) throw new Error('Failed to fetch inventory stats');
    return res.json();
  }, []);

  const [state, { execute: refetch }] = useAsync(fetchInventory);
  useEffect(() => { refetch(); }, [refetch]);
  return { ...state, refetch };
}

// ─────────────────────────────────────────────────────────────────
// SETTINGS HOOK
// ─────────────────────────────────────────────────────────────────

export function useSettings(isAdmin = false) {
  const endpoint = isAdmin ? '/api/settings' : '/api/public/settings';

  const fetchSettings = useCallback(async () => {
    const fetcher = isAdmin ? authFetch : fetch;
    const res = await fetcher(apiUrl(endpoint));
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  }, [isAdmin, endpoint]);

  const [state, { execute: refetch }] = useAsync(fetchSettings);
  useEffect(() => { refetch(); }, [refetch]);

  const { mutate: updateSettings, loading: updating } = useMutation(
    async (settingsData) => {
      const res = await authFetch(apiUrl('/api/settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    { onSuccess: () => refetch() }
  );

  return { ...state, updating, updateSettings, refetch };
}

// ─────────────────────────────────────────────────────────────────
// ADMIN USERS HOOK
// ─────────────────────────────────────────────────────────────────

export function useAdminUsers() {
  const fetchUsers = useCallback(async () => {
    const res = await authFetch(apiUrl('/api/admin/users'));
    handleAuthError(res.status);
    if (!res.ok) throw new Error('Failed to fetch admin users');
    return res.json();
  }, []);

  const [{ data: users, loading, error }, { execute: refetch }] = useAsync(
    fetchUsers,
    { initialData: [] }
  );

  useEffect(() => { refetch(); }, [refetch]);

  const { mutate: createUser, loading: creating } = useMutation(
    async (userData) => {
      const res = await authFetch(apiUrl('/api/admin/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to create user');
      }
      return res.json();
    },
    { onSuccess: () => refetch() }
  );

  const { mutate: deleteUser, loading: deleting } = useMutation(
    async (id) => {
      const res = await authFetch(apiUrl(`/api/admin/users/${id}`), {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to delete user');
      }
    },
    { onSuccess: () => refetch() }
  );

  return {
    users: users ?? [],
    loading,
    error,
    creating,
    deleting,
    createUser,
    deleteUser,
    refetch,
  };
}
