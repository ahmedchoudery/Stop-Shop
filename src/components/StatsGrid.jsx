/**
 * @fileoverview StatsGrid — Design Spells Edition
 * Applies: animejs-animation (counter spring, card entrance stagger),
 *          design-spells (number count-up, shimmer on hover, active glow)
 */

import React, { memo } from 'react';
import { TrendingUp, ShoppingBag, ArrowUpRight } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter.jsx';

const StatsGrid = ({ totalSales, totalOrders, trend = 0, pendingOrders = 0 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

      {/* Revenue Card */}
      <div className="group bg-white p-8 rounded-sm border border-gray-100 shadow-xl shadow-gray-100/50 hover:border-green-400/50 hover:shadow-2xl hover:shadow-green-100/60 transition-all duration-700 relative overflow-hidden cursor-default">

        {/* Background glow — reveals on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 via-green-50/0 to-green-100/0 group-hover:from-green-50/80 group-hover:to-green-50/20 transition-all duration-700 pointer-events-none" />

        {/* Icon watermark */}
        <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-700 transform translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:translate-y-0 transition-transform">
          <TrendingUp size={90} className="text-green-600" />
        </div>

        <div className="relative z-10">
          {/* Status dot + label */}
          <div className="flex items-center space-x-2 mb-5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
              Total Revenue
            </h3>
          </div>

          {/* Animated number */}
          <div className="flex items-baseline space-x-2 mb-3">
            <span className="text-3xl font-black text-green-600 tracking-tighter">Rs.</span>
            <AnimatedCounter
              value={totalSales}
              duration={1800}
              className="text-5xl font-black tracking-tighter text-gray-900 tabular-nums"
              formatter={(n) => Math.round(n).toLocaleString('en-PK', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            />
          </div>

          {/* Trend indicator */}
          <div className={`flex items-center space-x-2 mt-6 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            <ArrowUpRight
              size={15}
              className={`transition-transform duration-300 ${trend < 0 ? 'rotate-90' : 'group-hover:-translate-y-0.5 group-hover:translate-x-0.5'}`}
            />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}% from yesterday
            </span>
          </div>
        </div>

        {/* Bottom shimmer on hover — design spell */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-green-400 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
      </div>

      {/* Orders Card */}
      <div className="group bg-white p-8 rounded-sm border border-gray-100 shadow-xl shadow-gray-100/50 hover:border-[#ba1f3d]/30 hover:shadow-2xl hover:shadow-red-100/40 transition-all duration-700 relative overflow-hidden cursor-default">

        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-50/0 group-hover:from-red-50/40 group-hover:to-transparent transition-all duration-700 pointer-events-none" />

        {/* Icon watermark */}
        <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-700 transform translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:translate-y-0">
          <ShoppingBag size={90} className="text-[#ba1f3d]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-5">
            <span className="w-2 h-2 bg-[#ba1f3d] rounded-full" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
              Orders Placed
            </h3>
          </div>

          <div className="flex items-baseline space-x-3 mb-3">
            <AnimatedCounter
              value={totalOrders}
              duration={1600}
              className="text-6xl font-black tracking-tighter text-gray-900 tabular-nums"
            />
            <span className="text-sm font-black uppercase tracking-widest text-gray-400">
              Total
            </span>
          </div>

          {/* Pending indicator */}
          <div className="mt-6 flex items-center space-x-4">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-white"
                  style={{ background: `hsl(${i * 30 + 220}, 15%, ${70 - i * 10}%)` }}
                />
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
              {pendingOrders > 0
                ? `${pendingOrders} awaiting fulfillment`
                : 'All orders fulfilled ✓'}
            </span>
          </div>
        </div>

        {/* Bottom shimmer */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ba1f3d] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
      </div>
    </div>
  );
};

export default memo(StatsGrid);
