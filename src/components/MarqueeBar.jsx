/**
 * MarqueeBar — Xavier Edition
 * Featured message: 7-Days Exchange + 15% off promo with blinking CARDINAL code.
 */

import React, { useRef } from 'react';

const SEP = '  —  ';

const CARDINAL_RED = '#C8102E';

// Blink keyframes injected once
if (typeof document !== 'undefined') {
  const blinkStyle = document.getElementById('marquee-blink-style');
  if (!blinkStyle) {
    const el = document.createElement('style');
    el.id = 'marquee-blink-style';
    el.textContent = `
      @keyframes blinkCardinal {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }
      .blink-cardinal {
        animation: blinkCardinal 1s step-end infinite;
        color: ${CARDINAL_RED};
        font-weight: 900;
        letter-spacing: 0.38em;
      }
    `;
    document.head.appendChild(el);
  }
}

const MarqueeBar = ({ announcement }) => {
  const trackRef = useRef(null);

  const displayAnnouncement = announcement?.trim();
  const segments = displayAnnouncement 
    ? [
        { type: 'text', content: `${displayAnnouncement}${SEP}` },
        { type: 'text', content: `${displayAnnouncement}${SEP}` },
        { type: 'text', content: `${displayAnnouncement}${SEP}` },
        { type: 'text', content: `${displayAnnouncement}${SEP}` },
        { type: 'text', content: `${displayAnnouncement}${SEP}` },
      ]
    : [
        { type: 'text', content: `7-DAYS EASY EXCHANGE POLICY${SEP}` },
        { type: 'promo' }, // rendered as JSX with blink
        { type: 'text', content: `${SEP}FREE DELIVERY ON ORDERS OVER RS. 2,000${SEP}` },
        { type: 'text', content: `NEW ARRIVALS EVERY FRIDAY${SEP}` },
        { type: 'text', content: `PREMIUM FABRICS · CRAFTED IN PAKISTAN${SEP}` },
        { type: 'text', content: `7-DAYS EASY EXCHANGE POLICY${SEP}` },
        { type: 'promo' },
        { type: 'text', content: `${SEP}FREE DELIVERY ON ORDERS OVER RS. 2,000${SEP}` },
        { type: 'text', content: `GUJRAT'S FAVOURITE MENSWEAR DESTINATION${SEP}` },
        { type: 'text', content: `7-DAYS EASY EXCHANGE POLICY${SEP}` },
        { type: 'promo' },
      ];

  return (
    <div
      className="relative w-full overflow-hidden select-none pointer-events-auto bg-black border-b border-white/10"
      style={{ height: '34px' }}
      onMouseEnter={() => { if (trackRef.current) trackRef.current.style.animationPlayState = 'paused'; }}
      onMouseLeave={() => { if (trackRef.current) trackRef.current.style.animationPlayState = 'running'; }}
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #000000, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #000000, transparent)' }} />

      <div
        ref={trackRef}
        className="flex whitespace-nowrap h-full items-center"
        style={{ animation: 'marquee-smooth 28s linear infinite', willChange: 'transform' }}
      >
        {segments.map((seg, i) =>
          seg.type === 'promo' ? (
            <span
              key={`promo-${i}`}
              className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 flex-shrink-0 tracking-[0.35em] text-white"
            >
              BUY 2 ITEMS &amp; ENJOY EXTRA 15% OFF
              <span className="mx-1 text-white">·</span>
              PROMO CODE:&nbsp;
              <span className="blink-cardinal" style={{ color: CARDINAL_RED }}>CARDINAL</span>
            </span>
          ) : (
            <span
              key={`text-${i}`}
              className="inline-flex items-center text-[9px] font-black uppercase px-4 flex-shrink-0 cursor-default text-white tracking-[0.35em] hover:text-white"
            >
              {seg.content}
            </span>
          )
        )}
      </div>
    </div>
  );
};

export default MarqueeBar;