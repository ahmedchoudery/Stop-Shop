/**
 * @fileoverview Next.js Admin Dashboard — Server Component
 * Applies: nextjs-best-practices (server components by default, data fetching on server),
 *          nodejs-best-practices (layered architecture, proper error handling),
 *          typescript-expert (JSDoc types, const assertions)
 */

import { Suspense } from 'react';
import AdminLayout from './components/AdminLayout.jsx';
import DashboardStats from './components/DashboardStats.jsx';

// ─────────────────────────────────────────────────────────────────
// SERVER-SIDE DATA FETCHING
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch dashboard stats on the server.
 * Uses cache revalidation every 60 seconds (ISR).
 *
 * @returns {Promise<{ revenue: Object, orders: Object, inventory: Object }>}
 */
async function getDashboardStats() {
  const API_BASE = process.env.RAILWAY_API_URL ?? 'https://stop-shop-production.up.railway.app';
  const token = process.env.ADMIN_API_TOKEN ?? '';

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const fetchOptions = {
    headers,
    next: { revalidate: 60 }, // ISR: revalidate every 60s
  };

  try {
    const [revenue, orders, inventory] = await Promise.allSettled([
      fetch(`${API_BASE}/api/stats/revenue`, fetchOptions).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/api/stats/orders`, fetchOptions).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/api/stats/inventory`, fetchOptions).then(r => r.ok ? r.json() : null),
    ]);

    return {
      revenue: revenue.status === 'fulfilled' ? revenue.value : null,
      orders: orders.status === 'fulfilled' ? orders.value : null,
      inventory: inventory.status === 'fulfilled' ? inventory.value : null,
    };
  } catch (err) {
    console.error('[Admin] Failed to fetch dashboard stats:', err);
    return { revenue: null, orders: null, inventory: null };
  }
}

// ─────────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────────

export const metadata = {
  title: 'Dashboard — Stop & Shop Admin',
  description: 'Admin dashboard for Stop & Shop',
  robots: { index: false, follow: false }, // Never index admin pages
};

// ─────────────────────────────────────────────────────────────────
// PAGE COMPONENT (Server Component by default in App Router)
// ─────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const stats = await getDashboardStats();

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Dashboard
          </h1>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-1">
            Live Business Intelligence
          </p>
        </div>

        {/* Stats Grid — Suspense for progressive loading */}
        <Suspense fallback={<StatsGridSkeleton />}>
          <DashboardStats stats={stats} />
        </Suspense>
      </div>
    </AdminLayout>
  );
}

// ─────────────────────────────────────────────────────────────────
// SKELETON (shown during Suspense)
// ─────────────────────────────────────────────────────────────────

function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[0, 1, 2].map(i => (
        <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}