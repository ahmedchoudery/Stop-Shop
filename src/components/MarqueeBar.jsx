/**
 * @fileoverview MarqueeBar — GPU-accelerated, pause-on-hover, smooth
 * Applies: design-spells (hover pause = design detail that delights),
 *          animejs-animation (GPU-accelerated transform only)
 */

import React, { useRef } from 'react';

const DEFAULT_ITEMS = [
  '✦ FREE SHIPPING ON ORDERS OVER RS. 2000',
  '✦ USE CODE CARDINAL20 FOR 20% OFF',
  '✦ NEW ARRIVALS EVERY FRIDAY',
  '✦ PREMIUM FABRICS · CRAFTED WITH CARE',
  '✦ EASY 30-DAY RETURNS',
  '✦ CASHBACK ON EASYPAISA & JAZZCASH',
];

const MarqueeBar = ({ announcement }) => {
  const trackRef = useRef(null);

  const items = announcement
    ? [`✦ ${announcement.toUpperCase()}`, ...DEFAULT_ITEMS]
    : DEFAULT_ITEMS;

  // Triplicate for truly seamless loop across all screen widths
  const allItems = [...items, ...items, ...items];

  return (
    <div
      className="bg-[#FBBF24] py-3 overflow-hidden relative select-none"
      onMouseEnter={() => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'paused';
      }}
      onMouseLeave={() => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'running';
      }}
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #FBBF24, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #FBBF24, transparent)' }} />

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
            className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.35em] text-red-950 px-8 flex-shrink-0 cursor-default"
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
