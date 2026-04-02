/**
 * @fileoverview AdminAnalytics.jsx
 * Route: /admin/analytics
 *
 * Full sales analytics dashboard:
 * - Total revenue, orders, avg order value
 * - Revenue by category (bar chart)
 * - Orders over time (last 30 days line chart)
 * - Top 10 best-selling products
 * - Payment method breakdown
 * - Peak order hours
 *
 * All data comes from /api/admin/analytics — real MongoDB aggregations.
 */

import React, { useCallback, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, ShoppingBag, DollarSign, Users,
  RefreshCw, Package, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { authFetch, handleAuthError } from '../lib/auth.js';
import { apiUrl } from '../config/api.js';
import { useAsync } from '../hooks/useAsync.js';

// ─────────────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#ba1f3d', '#374151', '#FBBF24', '#22C55E', '#3B82F6', '#8B5CF6'];

// ─────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, icon: Icon, trend, color = 'red' }) => {
  const colorMap = {
    red:    { bg: 'bg-red-50',    text: 'text-[#ba1f3d]',  border: 'border-red-100' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100' },
  };
  const c = colorMap[color] ?? colorMap.red;

  return (
    <div className="bg-white border border-gray-100 rounded-sm p-6 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-gray-50/50 transition-all duration-500 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 ${c.bg} border ${c.border} rounded-lg flex items-center justify-center`}>
            <Icon size={16} className={c.text} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center space-x-1 text-[9px] font-black uppercase tracking-widest ${
              trend >= 0 ? 'text-green-600' : 'text-red-500'
            }`}>
              {trend >= 0
                ? <ArrowUpRight size={11} />
                : <ArrowDownRight size={11} />
              }
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>

        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-1">{label}</p>
        <p className="text-3xl font-black text-gray-900 tracking-tighter tabular-nums">{value}</p>
        {sub && <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{sub}</p>}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ba1f3d]/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, prefix = 'Rs.' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white px-4 py-3 rounded-sm shadow-2xl">
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-black" style={{ color: p.color }}>
          {prefix} {typeof p.value === 'number' ? p.value.toLocaleString('en-PK') : p.value}
        </p>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────

const AdminAnalytics = () => {

  const fetchAnalytics = useCallback(async () => {
    const res = await authFetch(apiUrl('/api/admin/analytics'));
    if (handleAuthError(res.status)) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('Failed to load analytics');
    return res.json();
  }, []);

  const [{ data, loading, error }, { execute: refetch }] = useAsync(fetchAnalytics, { initialData: null });
  useEffect(() => { refetch(); }, [refetch]);

  const d = data ?? {};
  const fmt = (n) => `Rs. ${Math.round(n ?? 0).toLocaleString('en-PK')}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">Business Intelligence</p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Analytics</h1>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-xs font-bold text-red-700">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-sm animate-pulse" />
          ))}
        </div>
      )}

      {/* ── KPI Cards ───────────────────────────────────────── */}
      {!loading && d && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard
              label="Total Revenue"
              value={fmt(d.totalRevenue)}
              sub="All time"
              icon={DollarSign}
              trend={d.revenueTrend}
              color="green"
            />
            <StatCard
              label="Total Orders"
              value={(d.totalOrders ?? 0).toLocaleString()}
              sub={`${d.pendingOrders ?? 0} pending`}
              icon={ShoppingBag}
              trend={d.ordersTrend}
              color="red"
            />
            <StatCard
              label="Avg Order Value"
              value={fmt(d.avgOrderValue)}
              sub="Per order"
              icon={TrendingUp}
              color="yellow"
            />
            <StatCard
              label="Total Products"
              value={(d.totalProducts ?? 0).toLocaleString()}
              sub={`${d.outOfStock ?? 0} sold out`}
              icon={Package}
              color="blue"
            />
          </div>

          {/* ── Revenue Over Time ──────────────────────────── */}
          {d.revenueOverTime?.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-sm p-6 shadow-sm mb-8">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-1">Revenue</p>
              <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 mb-6">Last 30 Days</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={d.revenueOverTime} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `Rs.${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="revenue" stroke="#ba1f3d" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#ba1f3d' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Category + Payment Grid ───────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

            {/* Revenue by Category */}
            {d.revenueByCategory?.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-sm p-6 shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-1">Revenue</p>
                <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 mb-6">By Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={d.revenueByCategory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="category" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill="#ba1f3d" radius={[2, 2, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Payment method breakdown */}
            {d.paymentMethods?.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-sm p-6 shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-1">Breakdown</p>
                <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 mb-6">Payment Methods</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={d.paymentMethods}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="method"
                    >
                      {d.paymentMethods.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} orders`, n]} />
                    <Legend
                      formatter={(v) => <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ── Best Sellers ──────────────────────────────── */}
          {d.bestSellers?.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden mb-8">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center space-x-2">
                <TrendingUp size={14} className="text-[#ba1f3d]" />
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">Top Selling</p>
                <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">Best Sellers</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {d.bestSellers.map((p, i) => (
                  <div key={p.productId ?? i} className="flex items-center space-x-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className={`w-7 h-7 flex items-center justify-center flex-shrink-0 font-black text-[10px] ${
                      i === 0 ? 'bg-[#FBBF24] text-white'
                      : i === 1 ? 'bg-gray-400 text-white'
                      : i === 2 ? 'bg-orange-400 text-white'
                      : 'bg-gray-100 text-gray-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-black uppercase tracking-tight text-gray-900 truncate">
                        {p.name ?? 'Unknown Product'}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        {p.category ?? '—'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-[#ba1f3d]">
                        {p.unitsSold ?? 0} sold
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 mt-0.5">
                        Rs. {(p.revenue ?? 0).toLocaleString('en-PK')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Orders by Status ──────────────────────────── */}
          {d.ordersByStatus && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => {
                const count = d.ordersByStatus[status] ?? 0;
                const colorMap = {
                  Pending:    'bg-amber-50 text-amber-600 border-amber-100',
                  Processing: 'bg-blue-50 text-blue-600 border-blue-100',
                  Shipped:    'bg-purple-50 text-purple-600 border-purple-100',
                  Delivered:  'bg-green-50 text-green-600 border-green-100',
                  Cancelled:  'bg-gray-50 text-gray-500 border-gray-100',
                };
                return (
                  <div key={status} className={`p-4 border rounded-sm text-center ${colorMap[status]}`}>
                    <p className="text-2xl font-black tabular-nums">{count}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest mt-1">{status}</p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && !data && !error && (
        <div className="text-center py-24">
          <TrendingUp size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-300">
            No analytics data yet
          </p>
          <p className="text-[10px] text-gray-300 mt-2">
            Analytics appear once orders start coming in
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;