'use client';

/**
 * @fileoverview BrandStrip.jsx — Animated USP Trust Bar
 * Design: Unified dark, neutral icon containers, no red tints.
 */

import React, { useEffect, useRef } from 'react';
import { Truck, Shield, RotateCcw, Lock, Star } from 'lucide-react';

const USPs = [
  { icon: Truck,     label: 'Free Delivery',          sub: 'On All Orders' },
  { icon: Star,      label: 'Premium Quality',         sub: 'Curated Pieces' },
  { icon: RotateCcw, label: 'Easy Returns',            sub: '7-Day Policy' },
  { icon: Shield,    label: 'Authenticity Guaranteed', sub: '100% Genuine' },
  { icon: Lock,      label: 'Secure Checkout',         sub: 'Encrypted & Safe' },
];

export default function BrandStrip() {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('[data-usp]');
            items.forEach((item, i) => {
              setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
              }, i * 80);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="bg-[#0d0d0d] border-y border-[#1a1a1a] py-10 sm:py-14 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-6">
          {USPs.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              data-usp
              className="flex flex-col items-center text-center gap-3 transition-all duration-500"
              style={{ opacity: 0, transform: 'translateY(16px)' }}
            >
              {/* Icon container — neutral dark */}
              <div className="w-10 h-10 border border-[#222] flex items-center justify-center bg-[#141414]">
                <Icon size={16} className="text-[#888]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f0f0f0] leading-tight">
                  {label}
                </p>
                <p className="text-[9px] font-medium text-[#555] uppercase tracking-widest mt-0.5">
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
