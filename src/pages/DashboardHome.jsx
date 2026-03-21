import React, { useState, useEffect } from 'react';
import { RefreshCcw, AlertCircle } from 'lucide-react';
import StatsGrid from '../components/StatsGrid';
import InventoryHealthChart from '../components/InventoryHealthChart';

const DashboardHome = () => {
  const [data, setData] = useState({
    revenue: 0,
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
        fetch('http://localhost:5000/api/stats/revenue', { headers }),
        fetch('http://localhost:5000/api/stats/orders', { headers }),
        fetch('http://localhost:5000/api/stats/inventory', { headers })
      ]);

      if (!revRes.ok || !ordRes.ok || !invRes.ok) throw new Error('Failed to synchronize stats');

      const [revData, ordData, invData] = await Promise.all([
        revRes.json(), ordRes.json(), invRes.json()
      ]);

      setData({
        revenue: revData.totalRevenue,
        orders: { total: ordData.totalOrders, pending: ordData.pendingOrders },
        inventory: { 
          total: invData.totalProducts, 
          outOfStock: invData.outOfStock, 
          products: invData.products 
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (error) return (
    <div className="p-10 flex flex-col items-center justify-center text-red-600 bg-red-50 rounded-sm border-2 border-dashed border-red-100">
      <AlertCircle size={48} className="mb-4" />
      <h3 className="font-black uppercase tracking-tighter text-xl">Cloud Sync Failed</h3>
      <p className="text-xs font-bold uppercase tracking-widest mt-2">{error}</p>
      <button onClick={fetchStats} className="mt-6 px-6 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-red-700 transition-colors">
        Retry Secure Sync
      </button>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Dashboard Top Bar */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900 border-l-8 border-[#FACC15] pl-6">
            Dashboard
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2 ml-6">
            Live Stream Business Intelligence
          </p>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">System Ready</p>
            <p className="text-xs font-bold text-green-600 mt-1 uppercase tracking-widest">● Encrypted Connection</p>
          </div>
          <button 
            onClick={fetchStats}
            disabled={loading}
            className={`p-3 bg-white border border-gray-100 rounded-sm shadow-sm hover:shadow-md transition-all group ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCcw size={18} className={`text-gray-400 group-hover:text-red-900 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <StatsGrid totalSales={data.revenue} totalOrders={data.orders.total} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-1">
              <InventoryHealthChart products={data.inventory.products} />
            </div>
            <div className="lg:col-span-2 bg-[#8B0000] rounded-sm p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-700"></div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-red-200 mb-6">Real-Time Insights</h3>
              <p className="text-2xl font-black italic uppercase tracking-tighter leading-tight max-w-xl">
                Current Revenue Trend: High Volatility. {data.orders.pending} orders are awaiting immediate fulfillment to optimize cash flow.
              </p>
              <div className="mt-8 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-100">Pending: {data.orders.pending}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-100">Total: {data.orders.total}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* Tailwind Skeleton Component */
const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="h-48 bg-gray-100 rounded-sm"></div>
      <div className="h-48 bg-gray-100 rounded-sm"></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 h-64 bg-gray-100 rounded-sm"></div>
      <div className="lg:col-span-2 h-64 bg-gray-100 rounded-sm"></div>
    </div>
  </div>
);

export default DashboardHome;
