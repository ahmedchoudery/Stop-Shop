'use client';

/**
 * @fileoverview BrandStrip.jsx — Premium USP Trust Bar
 * Mobile: horizontal scroll row.
 * Desktop: single 5-column row with dividers.
 * Layout: icon left + text right (inline) — cleaner than stacked.
 */

import React, { useEffect, useRef } from 'react';
import { Truck, Shield, RotateCcw, Lock, Star } from 'lucide-react';

const USPs = [
  { icon: Truck,      label: 'Free Delivery',           sub: 'On All Orders' },
  { icon: Star,       label: 'Premium Quality',          sub: 'Curated Pieces' },
  { icon: RotateCcw,  label: 'Easy Returns',             sub: '7-Day Policy' },
  { icon: Shield,     label: 'Authenticity Guaranteed',  sub: '100% Genuine' },
  { icon: Lock,       label: 'Secure Checkout',          sub: 'Encrypted & Safe' },
];

export default function BrandStrip() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = el.querySelectorAll('[data-usp]');
            items.forEach((item, i) => {
              setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
              }, i * 70);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="bg-white border-y border-gray-200 overflow-hidden"
    >
      {/* Mobile: horizontal scroll */}
      <div className="flex lg:hidden items-stretch overflow-x-auto scrollbar-hide px-6 divide-x divide-[#1a1a1a]">
        {USPs.map(({ icon: Icon, label, sub }) => (
          <div
            key={label}
            data-usp
            className="flex items-center gap-3 py-8 px-7 flex-shrink-0 transition-all duration-500"
            style={{ opacity: 0, transform: 'translateY(10px)' }}
          >
            <div className="w-9 h-9 border border-gray-200 flex items-center justify-center bg-gray-50 flex-shrink-0">
              <Icon size={14} className="text-gray-500" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 whitespace-nowrap leading-tight">
                {label}
              </p>
              <p className="text-[8px] font-medium text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap mt-0.5">
                {sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: 5-column row with dividers */}
      <div className="hidden lg:grid lg:grid-cols-5 divide-x divide-[#1a1a1a]">
        {USPs.map(({ icon: Icon, label, sub }) => (
          <div
            key={label}
            data-usp
            className="flex items-center gap-4 px-10 py-9 transition-all duration-500 hover:bg-gray-50 group"
            style={{ opacity: 0, transform: 'translateY(10px)' }}
          >
            <div className="w-9 h-9 border border-gray-200 group-hover:border-gray-300 flex items-center justify-center bg-gray-50 flex-shrink-0 transition-colors duration-300">
              <Icon size={14} className="text-gray-500 group-hover:text-gray-600 transition-colors duration-300" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 leading-tight">
                {label}
              </p>
              <p className="text-[8px] font-medium text-gray-500 uppercase tracking-[0.2em] mt-0.5">
                {sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}