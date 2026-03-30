/**
 * @fileoverview Admin Dashboard Home
 * Applies: react-ui-patterns (loading only when no data, error surfaced with retry),
 *          react-patterns (composition, single responsibility),
 *          javascript-pro (Promise.all parallel fetching)
 */

import React from 'react';
import StatsGrid from '../components/StatsGrid.jsx';
import RevenueChart from '../components/RevenueChart.jsx';
import InventoryHealthChart from '../components/InventoryHealthChart.jsx';
import { AsyncContent } from '../components/ErrorBoundary.jsx';
import { useRevenueStats, useOrderStats, useInventoryStats } from '../hooks/useDomain.js';
import { RefreshCw } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// STATS SKELETON
// ─────────────────────────────────────────────────────────────────

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
    {[0, 1].map(i => (
      <div key={i} className="h-48 bg-gray-100 rounded-sm animate-pulse" />
    ))}
  </div>
);

const ChartSkeleton = () => (
  <div className="h-80 bg-gray-100 rounded-sm animate-pulse" />
);

// ─────────────────────────────────────────────────────────────────
// DASHBOARD HOME
// ─────────────────────────────────────────────────────────────────

const DashboardHome = () => {
  const revenue = useRevenueStats();
  const orders = useOrderStats();
  const inventory = useInventoryStats();

  const isLoading = revenue.loading || orders.loading || inventory.loading;
  const hasError = revenue.error ?? orders.error ?? inventory.error;

  const handleRefresh = () => {
    revenue.refetch();
    orders.refetch();
    inventory.refetch();
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">
            Live Intelligence
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Dashboard
          </h1>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-all disabled:opacity-40"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Banner */}
      {hasError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
          <p className="text-xs font-bold text-red-700">{hasError}</p>
          <button
            onClick={handleRefresh}
            className="text-xs font-black uppercase tracking-widest text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <AsyncContent
        loading={orders.loading || revenue.loading}
        error={orders.error ?? revenue.error}
        data={orders.data ?? revenue.data}
        skeleton={<StatsSkeleton />}
        onRetry={handleRefresh}
      >
        <StatsGrid
          totalSales={revenue.data?.totalRevenue ?? 0}
          totalOrders={orders.data?.totalOrders ?? 0}
          trend={revenue.data?.trend ?? 0}
          pendingOrders={orders.data?.pendingOrders ?? 0}
        />
      </AsyncContent>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
        {/* Revenue Chart — takes 2/3 width on XL */}
        <div className="xl:col-span-2">
          <AsyncContent
            loading={revenue.loading}
            error={revenue.error}
            data={revenue.data}
            skeleton={<ChartSkeleton />}
            onRetry={revenue.refetch}
          >
            <RevenueChart chartData={revenue.data?.weeklyData ?? []} />
          </AsyncContent>
        </div>

        {/* Inventory Health — takes 1/3 width on XL */}
        <div className="xl:col-span-1">
          <AsyncContent
            loading={inventory.loading}
            error={inventory.error}
            data={inventory.data}
            skeleton={<ChartSkeleton />}
            onRetry={inventory.refetch}
          >
            <InventoryHealthChart products={inventory.data?.products ?? []} />
          </AsyncContent>
        </div>
      </div>

      {/* Low Stock Alert */}
      {!inventory.loading && (inventory.data?.lowStock ?? 0) > 0 && (
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-xs font-black uppercase tracking-widest text-yellow-800">
            ⚠️ {inventory.data.lowStock} product{inventory.data.lowStock !== 1 ? 's' : ''} running low on stock
          </p>
        </div>
      )}

      {/* Out of Stock Alert */}
      {!inventory.loading && (inventory.data?.outOfStock ?? 0) > 0 && (
        <div className="mt-4 p-6 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs font-black uppercase tracking-widest text-red-700">
            🚫 {inventory.data.outOfStock} product{inventory.data.outOfStock !== 1 ? 's' : ''} completely out of stock
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;