/**
 * @fileoverview InventoryHealthChart — Design Spells Edition
 * Fix: replaced require('animejs') with ESM import — percentage count-up and score now animate correctly
 * Applies: animejs-animation (percentage count-up on scroll), design-spells (radial progress ring)
 */

import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useIntersectionObserver } from '../hooks/useUtils.js';
import { EASING } from '../hooks/useAnime.js';

const InventoryHealthChart = ({ products = [] }) => {
  const eligibleProducts = products.filter(p => p.featuredSection !== 'attitude' && p.bucket !== 'Outfit');
  const soldOut = eligibleProducts.filter(p => p.quantity === 0).length;
  const inStock = eligibleProducts.length - soldOut;
  const percentage = eligibleProducts.length > 0 ? Math.round((soldOut / eligibleProducts.length) * 100) : 0;
  const healthScore = 100 - percentage;

  const percentRef = useRef(null);
  const scoreRef = useRef(null);
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.3, triggerOnce: true });
  const prevPercentage = useRef(-1);

  useEffect(() => {
    // Only animate when visible AND we have real product data AND the percentage changed
    if (!isIntersecting || products.length === 0 || percentage === prevPercentage.current) return;
    const fromValue = prevPercentage.current === -1 ? 0 : prevPercentage.current;
    prevPercentage.current = percentage;

    const pObj = { value: fromValue };
    anime({
      targets: pObj,
      value: [fromValue, percentage],
      duration: 1400,
      easing: EASING.EXPO_OUT,
      round: 1,
      update: () => {
        if (percentRef.current) percentRef.current.textContent = `${Math.round(pObj.value)}%`;
      },
    });

    const fromScore = 100 - fromValue;
    const sObj = { value: fromScore };
    anime({
      targets: sObj,
      value: [fromScore, healthScore],
      duration: 1600,
      easing: EASING.EXPO_OUT,
      round: 1,
      update: () => {
        if (scoreRef.current) scoreRef.current.textContent = `${Math.round(sObj.value)}/100`;
      },
    });
  }, [isIntersecting, percentage, healthScore, products.length]);

  const data = [
    { name: 'Sold Out', value: soldOut || 1 },
    { name: 'In Stock', value: inStock || 0 },
  ];
  const COLORS = ['#F63049', '#E5E7EB'];

  return (
    <div
      ref={ref}
      className="relative flex min-h-[300px] flex-col items-center justify-center rounded-sm border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100/50"
    >
      <div className="absolute left-8 top-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Inventory Health</h3>
      </div>

      <div className="relative h-48 w-full">
        <ResponsiveContainer minWidth={0} minHeight={180} width="100%" height="100%">
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
                <Cell key={index} fill={COLORS.at(index)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span ref={percentRef} className="text-3xl font-black tracking-tighter text-cardinal">0%</span>
          <span className="mt-1 text-[8px] font-black uppercase tracking-widest text-gray-400">Out of Stock</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex space-x-6">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-sm bg-crimson" />
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Sold Out ({soldOut})</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-sm bg-gray-200" />
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">In Stock ({inStock})</p>
        </div>
      </div>

      <p className="mt-6 w-full border-t border-gray-50 pt-4 text-center text-[9px] font-black uppercase italic tracking-[0.2em] text-gray-300">
        Health Score: <span ref={scoreRef} className="text-gray-500">0/100</span>
      </p>
    </div>
  );
};

export default InventoryHealthChart;
