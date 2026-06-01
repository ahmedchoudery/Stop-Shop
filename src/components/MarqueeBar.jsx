/**
 * MarqueeBar — Unified Dark Edition
 * Background matches site base (#0d0d0d).
 */

import React, { useRef } from 'react';

const DEFAULT_ITEMS = [
  '✦ USE CODE CARDINAL20 FOR 20% OFF',
  '✦ FREE DELIVERY ON ORDERS OVER RS. 2,000',
  '✦ NEW ARRIVALS EVERY FRIDAY',
  '✦ PREMIUM FABRICS · CRAFTED IN PAKISTAN',
  '✦ 7-DAY EASY RETURNS',
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
      className={`fixed top-0 left-0 w-full z-[110] overflow-hidden select-none transition-all duration-500 ${
        useTransparent ? 'bg-transparent' : 'bg-[#0d0d0d] border-b border-[#1a1a1a]'
      }`}
      style={{ height: '34px' }}
      onMouseEnter={() => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'paused';
      }}
      onMouseLeave={() => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'running';
      }}
    >
      {/* Fade edges */}
      {!useTransparent && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #0d0d0d, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #0d0d0d, transparent)' }} />
        </>
      )}

      <div
        ref={trackRef}
        className="flex whitespace-nowrap h-full items-center"
        style={{
          animation: 'marquee-smooth 38s linear infinite',
          willChange: 'transform',
        }}
      >
        {allItems.map((item, i) => (
          <span
            key={i}
            className={`inline-flex items-center text-[9px] font-black uppercase px-8 flex-shrink-0 cursor-default transition-colors duration-500 ${
              useTransparent
                ? 'text-white/30 tracking-[0.3em]'
                : 'text-[#555] tracking-[0.35em] hover:text-[#888]'
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export default MarqueeBar;