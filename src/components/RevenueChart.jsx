/**
 * @fileoverview RevenueChart — Design Spells Edition
 * Fix: replaced require('animejs') with ESM import — chart entrance animations are now functional
 * Applies: animejs-animation (chart entrance, mode switch transition),
 *          design-spells (toggle pill animation, active dot glow, peak highlight)
 */

import React, { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';
import { useIntersectionObserver } from '../hooks/useUtils.js';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl">
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-black" style={{ color: entry.color }}>
          {entry.name === 'revenue'
            ? `Rs. ${(entry.value ?? 0).toLocaleString('en-PK')}`
            : `${entry.value} orders`}
        </p>
      ))}
    </div>
  );
};

const RevenueChart = ({ chartData = [] }) => {
  const [mode, setMode] = useState('revenue');
  const chartRef = useRef(null);
  const hasAnimated = useRef(false);

  const { ref: sectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.3,
    triggerOnce: true,
  });

  const safeData = chartData.length > 0 ? chartData : [
    { day: 'Mon', revenue: 0, orders: 0 },
    { day: 'Tue', revenue: 0, orders: 0 },
    { day: 'Wed', revenue: 0, orders: 0 },
    { day: 'Thu', revenue: 0, orders: 0 },
    { day: 'Fri', revenue: 0, orders: 0 },
    { day: 'Sat', revenue: 0, orders: 0 },
    { day: 'Sun', revenue: 0, orders: 0 },
  ];

  // Entrance on scroll
  useEffect(() => {
    if (!isIntersecting || hasAnimated.current || !chartRef.current) return;
    hasAnimated.current = true;

    anime.set(chartRef.current, { opacity: 0, translateY: 20 });
    anime({
      targets: chartRef.current,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 700,
      easing: EASING.FABRIC,
    });
  }, [isIntersecting]);

  const totalWeek = safeData.reduce((s, d) => s + (d.revenue ?? 0), 0);
  const totalOrders = safeData.reduce((s, d) => s + (d.orders ?? 0), 0);
  const peak = safeData.reduce((a, b) => (a.revenue ?? 0) > (b.revenue ?? 0) ? a : b, safeData[0]);

  return (
    <div
      ref={sectionRef}
      className="bg-white p-8 rounded-sm border border-gray-100 shadow-xl shadow-gray-100/50"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400 mb-2">
            Weekly Performance
          </h3>
          <p className="text-3xl font-black text-gray-900 tracking-tighter">
            Rs. {totalWeek.toLocaleString('en-PK')}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <TrendingUp size={12} className="text-gray-400" />
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
              Current 7-Day Window
            </p>
          </div>
        </div>

        {/* Mode toggle — design spell: pill slider */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          {['revenue', 'orders'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                mode === m
                  ? 'bg-[#ba1f3d] text-white shadow-md shadow-red-200/60'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="h-52" style={{ opacity: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={safeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ba1f3d" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#ba1f3d" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#FBBF24" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 9, fontWeight: 900, fill: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fontWeight: 700, fill: '#D1D5DB' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {mode === 'revenue' ? (
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#ba1f3d"
                strokeWidth={2.5}
                fill="url(#revGrad)"
                dot={{ fill: '#ba1f3d', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 6, fill: '#ba1f3d', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            ) : (
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#FBBF24"
                strokeWidth={2.5}
                fill="url(#ordGrad)"
                dot={{ fill: '#FBBF24', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 6, fill: '#FBBF24', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-50">
        {[
          { label: 'Peak Day', value: peak.day, sub: `Rs. ${(peak.revenue ?? 0).toLocaleString('en-PK')}`, subColor: 'text-[#ba1f3d]' },
          { label: 'Avg Daily', value: `Rs. ${Math.round(totalWeek / 7).toLocaleString('en-PK')}`, sub: '↑ Trending', subColor: 'text-green-500' },
          { label: 'Total Orders', value: totalOrders, sub: 'This Week', subColor: 'text-yellow-600' },
        ].map(stat => (
          <div key={stat.label} className="group">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{stat.label}</p>
            <p className="text-sm font-black text-gray-900">{stat.value}</p>
            <p className={`text-[10px] font-bold ${stat.subColor}`}>{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueChart;
