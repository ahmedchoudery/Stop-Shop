'use client';

/**
 * @fileoverview BrandStrip.jsx — Premium USP Trust Bar
 * Styled as a continuous horizontal marquee bar with a luxury blue theme.
 */

import React, { useRef } from 'react';
import { Truck, Shield, RotateCcw, Lock, Star } from 'lucide-react';

const USPs = [
  { icon: Truck,      label: 'Free Delivery',           sub: 'On All Orders' },
  { icon: Star,       label: 'Premium Quality',          sub: 'Curated Pieces' },
  { icon: RotateCcw,  label: 'Easy Returns',             sub: '7-Day Policy' },
  { icon: Shield,     label: 'Authenticity Guaranteed',  sub: '100% Genuine' },
  { icon: Lock,       label: 'Secure Checkout',          sub: 'Encrypted & Safe' },
];

export default function BrandStrip() {
  const trackRef = useRef(null);

  // Repeat USPs list to create a seamless marquee loop
  const allUSPs = [...USPs, ...USPs, ...USPs, ...USPs];

  return (
    <section
      className="bg-blue-900 text-white border-y border-blue-800 overflow-hidden select-none"
      onMouseEnter={() => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'paused';
      }}
      onMouseLeave={() => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'running';
      }}
    >
      <div className="relative w-full flex items-center py-4">
        {/* Fade gradients on edges for professional lighting blend */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-blue-900 via-blue-900/60 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-blue-900 via-blue-900/60 to-transparent" />

        <div
          ref={trackRef}
          className="flex whitespace-nowrap items-center"
          style={{
            animation: 'marquee-smooth 20s linear infinite',
            willChange: 'transform',
          }}
        >
          {allUSPs.map(({ icon: Icon, label, sub }, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-3 px-12 flex-shrink-0 cursor-default"
            >
              <div className="w-8 h-8 border border-white/20 flex items-center justify-center bg-white/10 flex-shrink-0">
                <Icon size={14} className="text-white" strokeWidth={1.5} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white leading-tight">
                  {label}
                </p>
                <p className="text-[8px] font-medium text-white/70 uppercase tracking-[0.2em] mt-0.5">
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}