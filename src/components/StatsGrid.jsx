import React, { memo } from 'react';
import { ShoppingBag, TrendingUp, ArrowUpRight } from 'lucide-react';

const StatsGrid = ({ totalSales, totalOrders, trend = 0, pendingOrders = 0 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      <div className="bg-white p-8 rounded-sm border border-gray-100 shadow-xl shadow-gray-100/50 group hover:border-green-500 transition-all duration-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <TrendingUp size={80} className="text-green-600" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-4">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Total Revenue Today</h3>
          </div>
          
          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-black text-green-600 tracking-tighter">Rs.</span>
            <span className="text-6xl font-black tracking-tighter text-gray-900 tabular-nums">
              {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className={`mt-8 flex items-center space-x-2 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            <ArrowUpRight size={16} className={trend < 0 ? 'rotate-90' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}% from yesterday
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-sm border border-gray-100 shadow-xl shadow-gray-100/50 group hover:border-red-600 transition-all duration-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <ShoppingBag size={80} className="text-red-600" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-4">
            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Orders Placed</h3>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-6xl font-black tracking-tighter text-gray-900 tabular-nums">
              {totalOrders}
            </span>
            <span className="text-sm font-black uppercase tracking-widest text-gray-400">Total Units</span>
          </div>

          <div className="mt-8 flex items-center space-x-4">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"></div>
              <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white"></div>
              <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white"></div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
              {pendingOrders > 0 ? `${pendingOrders} Pending Fulfillment...` : "All clear. No pending items."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(StatsGrid);
