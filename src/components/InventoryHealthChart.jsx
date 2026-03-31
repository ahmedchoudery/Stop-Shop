/**
 * @fileoverview InventoryHealthChart — Design Spells Edition
 * Applies: animejs-animation (percentage count-up on scroll), design-spells (radial progress ring)
 */

import React, { useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useIntersectionObserver } from '../hooks/useUtils.js';
import { EASING } from '../hooks/useAnime.js';

const InventoryHealthChart = ({ products = [] }) => {
  const soldOut = products.filter(p => p.quantity === 0).length;
  const inStock = products.length - soldOut;
  const percentage = products.length > 0 ? Math.round((soldOut / products.length) * 100) : 0;
  const healthScore = 100 - percentage;

  const percentRef = useRef(null);
  const scoreRef = useRef(null);
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.3, triggerOnce: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isIntersecting || hasAnimated.current) return;
    hasAnimated.current = true;

    let anime;
    try { anime = require('animejs').default ?? require('animejs'); } catch { return; }

    const pObj = { value: 0 };
    anime({
      targets: pObj,
      value: [0, percentage],
      duration: 1400,
      easing: EASING.EXPO_OUT,
      round: 1,
      update: () => {
        if (percentRef.current) percentRef.current.textContent = `${Math.round(pObj.value)}%`;
      },
    });

    const sObj = { value: 0 };
    anime({
      targets: sObj,
      value: [0, healthScore],
      duration: 1600,
      easing: EASING.EXPO_OUT,
      round: 1,
      update: () => {
        if (scoreRef.current) scoreRef.current.textContent = `${Math.round(sObj.value)}/100`;
      },
    });
  }, [isIntersecting, percentage, healthScore]);

  const data = [
    { name: 'Sold Out', value: soldOut || 1 },
    { name: 'In Stock', value: inStock || 0 },
  ];
  const COLORS = ['#F63049', '#E5E7EB'];

  return (
    <div
      ref={ref}
      className="bg-white p-8 rounded-sm border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-col items-center justify-center relative min-h-[300px]"
    >
      <div className="absolute top-6 left-8">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Inventory Health</h3>
      </div>

      <div className="w-full h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={60} outerRadius={80}
              paddingAngle={soldOut > 0 && inStock > 0 ? 4 : 0}
              dataKey="value"
              stroke="none"
              animationDuration={1200}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span ref={percentRef} className="text-3xl font-black text-[#ba1f3d] tracking-tighter">0%</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1">Out of Stock</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#F63049] rounded-sm" />
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Sold Out ({soldOut})</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-200 rounded-sm" />
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">In Stock ({inStock})</p>
        </div>
      </div>

      <p className="mt-6 text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 italic border-t border-gray-50 pt-4 w-full text-center">
        Health Score: <span ref={scoreRef} className="text-gray-500">0/100</span>
      </p>
    </div>
  );
};

export default InventoryHealthChart;