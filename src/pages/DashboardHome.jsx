import React, { useState, useEffect } from 'react';
import { RefreshCcw, AlertCircle, ArrowRight, Package, ShoppingBag, Users, TrendingUp, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import StatsGrid from '../components/StatsGrid';
import InventoryHealthChart from '../components/InventoryHealthChart';
import RevenueChart from '../components/RevenueChart';
import { apiUrl } from '../config/api';

const DashboardHome = () => {
  const [data, setData] = useState({
    revenue: { total: 0, trend: 0, weeklyData: [] },
    orders: { total: 0, pending: 0 },
    inventory: { total: 0, outOfStock: 0, products: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('adminToken');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [revRes, ordRes, invRes] = await Promise.all([
        fetch(apiUrl('/api/admin/stats/revenue'), { headers }),
        fetch(apiUrl('/api/admin/stats/orders'), { headers }),
        fetch(apiUrl('/api/admin/stats/inventory'), { headers })
      ]);
      if (!revRes.ok || !ordRes.ok || !invRes.ok) throw new Error('Failed to synchronize stats');
      const [revData, ordData, invData] = await Promise.all([
        revRes.json(), ordRes.json(), invRes.json()
      ]);
      setData({
        revenue: { total: revData.totalRevenue, trend: revData.trend, weeklyData: revData.weeklyData },
        orders: { total: ordData.totalOrders, pending: ordData.pendingOrders },
        inventory: { total: invData.totalProducts, outOfStock: invData.outOfStock, products: invData.products }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (error) return (
    <div className="p-10 flex flex-col items-center justify-center text-[#ba1f3d] bg-[#ba1f3d]/5 rounded-none border-2 border-dashed border-[#ba1f3d]/10">
      <AlertCircle size={48} className="mb-4" />
      <h3 className="font-black uppercase tracking-tighter text-xl text-gray-900">Cloud Sync Failed</h3>
      <p className="text-xs font-bold uppercase tracking-widest mt-2">{error}</p>
      <button onClick={fetchStats} className="mt-6 px-10 py-4 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-none hover:bg-black transition-all shadow-2xl">
        Attempt Reconnection
      </button>
    </div>
  );

  return (
    <div className="animate-fade-up space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900 border-l-8 border-[#ba1f3d] pl-6">
            Dashboard
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2 ml-6">
            Live Business Intelligence
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Live</span>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className={`p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all group ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCcw size={18} className={`text-gray-400 group-hover:text-[#ba1f3d] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Stats Cards */}
          <StatsGrid 
            totalSales={data.revenue.total} 
            totalOrders={data.orders.total} 
            trend={data.revenue.trend}
            pendingOrders={data.orders.pending}
          />

          {/* Revenue Chart + Inventory Health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <RevenueChart chartData={data.revenue.weeklyData} />
            </div>
            <div className="lg:col-span-1">
              <InventoryHealthChart products={data.inventory.products} />
            </div>
          </div>

          {/* Insight Card */}
          <div className="bg-[#ba1f3d] rounded-2xl p-8 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-red-200 mb-3">Real-Time Insight</p>
                <p className="text-2xl font-black italic uppercase tracking-tighter leading-tight max-w-xl">
                  {data.orders.pending > 0
                    ? `${data.orders.pending} order${data.orders.pending > 1 ? 's' : ''} awaiting fulfillment. Act now to maximize cash flow.`
                    : 'All orders fulfilled. Excellent operational efficiency!'}
                </p>
                <div className="flex items-center space-x-6 mt-6">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-white/30 rounded-full" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white">Pending: {data.orders.pending}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-white/30 rounded-full" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white">Total: {data.orders.total}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-white/30 rounded-full" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white">Out of Stock: {data.inventory.outOfStock}</span>
                  </div>
                </div>
              </div>
              <NavLink
                to="/admin/orders"
                className="flex-shrink-0 flex items-center space-x-3 bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all group/btn"
              >
                <span>Manage Orders</span>
                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </NavLink>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { to: '/admin/orders', icon: ShoppingBag, label: 'Orders', count: data.orders.total, color: 'red' },
              { to: '/admin/products', icon: Package, label: 'Catalog', count: data.inventory.total, color: 'blue' },
              { to: '/admin/inventory', icon: Package, label: 'Stock', count: data.inventory.total, color: 'indigo' },
              { to: '/admin/users', icon: Users, label: 'Team', count: null, color: 'green' },
              { to: '/admin/settings', icon: Settings, label: 'Settings', count: null, color: 'yellow' },
            ].map(({ to, icon: Icon, label, count, color }) => (
              <NavLink
                key={to}
                to={to}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-gray-200 transition-all group flex flex-col space-y-3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-50 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className={`text-${color}-600`} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                  {count !== null && (
                    <p className="text-2xl font-black text-gray-900 mt-1">{count}</p>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-300 group-hover:text-red-600 transition-colors">
                  <span>Manage</span>
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </NavLink>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="h-48 bg-gray-100 rounded-2xl skeleton" />
      <div className="h-48 bg-gray-100 rounded-2xl skeleton" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 h-80 bg-gray-100 rounded-2xl skeleton" />
      <div className="lg:col-span-1 h-80 bg-gray-100 rounded-2xl skeleton" />
    </div>
  </div>
);

export default DashboardHome;