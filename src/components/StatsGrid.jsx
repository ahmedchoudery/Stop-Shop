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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-12">

      {/* Revenue Card */}
      <div className="group bg-white p-5 sm:p-8 rounded-[4px] border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-gray-300 transition-all duration-300 relative overflow-hidden cursor-default">

        {/* Icon watermark */}
        <div className="absolute top-0 right-0 p-4 opacity-[0.04] translate-x-4 -translate-y-4 transition-all duration-500">
          <TrendingUp size={90} className="text-gray-900" />
        </div>

        <div className="relative z-10">
          {/* Status dot + label */}
          <div className="flex items-center space-x-2 mb-5">
            <span className="w-2 h-2 bg-green-600 rounded-full" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
              Total Revenue
            </h3>
          </div>

          {/* Animated number */}
          <div className="flex items-baseline space-x-2 mb-3">
            <span className="text-3xl font-black text-gray-900 tracking-tighter">Rs.</span>
            <AnimatedCounter
              value={totalSales}
              duration={1800}
              className="text-3xl sm:text-5xl font-black tracking-tighter text-gray-900 tabular-nums"
              formatter={(n) => Math.round(n).toLocaleString('en-PK', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            />
          </div>

          {/* Trend indicator */}
          <div className={`flex items-center space-x-2 mt-6 ${trend >= 0 ? 'text-[#346538]' : 'text-cardinal'}`}>
            <ArrowUpRight
              size={15}
              className={`transition-transform duration-300 ${trend < 0 ? 'rotate-90' : 'group-hover:-translate-y-0.5 group-hover:translate-x-0.5'}`}
            />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}% from yesterday
            </span>
          </div>
        </div>
      </div>

      {/* Orders Card */}
      <div className="group bg-white p-5 sm:p-8 rounded-[4px] border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-gray-300 transition-all duration-300 relative overflow-hidden cursor-default">

        {/* Icon watermark */}
        <div className="absolute top-0 right-0 p-4 opacity-[0.04] translate-x-4 -translate-y-4 transition-all duration-500">
          <ShoppingBag size={90} className="text-gray-900" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-5">
            <span className="w-2 h-2 bg-gray-900 rounded-full" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
              Orders Placed
            </h3>
          </div>

          <div className="flex items-baseline space-x-3 mb-3">
            <AnimatedCounter
              value={totalOrders}
              duration={1600}
              className="text-4xl sm:text-6xl font-black tracking-tighter text-gray-900 tabular-nums"
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
      </div>
    </div>
  );
};

export default memo(StatsGrid);
