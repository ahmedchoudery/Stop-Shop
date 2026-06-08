/**
 * MarqueeBar — Unified Dark Edition
 * Background matches site base (#0d0d0d).
 */

import React, { useRef } from 'react';

const SEP = '  —  ';

const DEFAULT_ITEMS = [
  `USE CODE CARDINAL20 FOR 20% OFF${SEP}`,
  `FREE DELIVERY ON ORDERS OVER RS. 2,000${SEP}`,
  `NEW ARRIVALS EVERY FRIDAY${SEP}`,
  `PREMIUM FABRICS · CRAFTED IN PAKISTAN${SEP}`,
  `7-DAY EASY RETURNS & EXCHANGES${SEP}`,
  `CASHBACK ON EASYPAISA & JAZZCASH${SEP}`,
  `GUJRAT'S FAVOURITE MENSWEAR DESTINATION${SEP}`,
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
      className={`w-full overflow-hidden select-none pointer-events-auto transition-colors duration-500 ${
        useTransparent ? 'bg-transparent' : 'bg-black border-b border-white/10'
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
            style={{ background: 'linear-gradient(to right, #000000, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #000000, transparent)' }} />
        </>
      )}

      <div
        ref={trackRef}
        className="flex whitespace-nowrap h-full items-center"
        style={{
          animation: 'marquee-smooth 20s linear infinite',
          willChange: 'transform',
        }}
      >
        {allItems.map((item, i) => (
          <span
            key={i}
            className={`inline-flex items-center text-[9px] font-black uppercase px-8 flex-shrink-0 cursor-default transition-colors duration-500 ${
              useTransparent
                ? 'text-white/70 tracking-[0.3em]'
                : 'text-white/80 tracking-[0.35em] hover:text-white'
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