/**
 * @fileoverview MarqueeBar — GPU-accelerated, pause-on-hover, smooth
 * Updated: Supports scroll-synced transparency for hero sections.
 */

import React, { useRef } from 'react';

const DEFAULT_ITEMS = [
  '✦ NO FREE SHIPPING · CUSTOMER PAID DELIVERY',
  '✦ USE CODE CARDINAL20 FOR 20% OFF',
  '✦ NEW ARRIVALS EVERY FRIDAY',
  '✦ PREMIUM FABRICS · CRAFTED WITH CARE',
  '✦ EASY 30-DAY RETURNS',
  '✦ CASHBACK ON EASYPAISA & JAZZCASH',
];

const MarqueeBar = ({ announcement, scrolled = true, isHome = false }) => {
  const trackRef = useRef(null);

  const items = announcement
    ? [`✦ ${announcement.toUpperCase()}`, ...DEFAULT_ITEMS]
    : DEFAULT_ITEMS;

  const allItems = [...items, ...items, ...items];
  const useTransparent = isHome && !scrolled;

  return (
    <div
      className={`fixed top-0 left-0 w-full z-[110] py-3 overflow-hidden select-none transition-all duration-500 ${
        useTransparent 
          ? 'bg-transparent border-b border-white/5' 
          : 'bg-[#FBBF24]'
      }`}
      onMouseEnter={() => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'paused';
      }}
      onMouseLeave={() => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'running';
      }}
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-500"
        style={{ 
          background: `linear-gradient(to right, ${useTransparent ? 'transparent' : '#FBBF24'}, transparent)`,
          opacity: useTransparent ? 0 : 1 
        }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-500"
        style={{ 
          background: `linear-gradient(to left, ${useTransparent ? 'transparent' : '#FBBF24'}, transparent)`,
          opacity: useTransparent ? 0 : 1
        }} />

      <div
        ref={trackRef}
        className="flex whitespace-nowrap"
        style={{
          animation: 'marquee-smooth 38s linear infinite',
          willChange: 'transform',
        }}
      >
        {allItems.map((item, i) => (
          <span
            key={i}
            className={`inline-flex items-center text-[10px] font-black uppercase tracking-[0.35em] px-8 flex-shrink-0 cursor-default transition-colors duration-500 ${
              useTransparent ? 'text-white/60' : 'text-red-950'
            }`}
          >
            {item}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee-smooth {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
};

export default MarqueeBar;
