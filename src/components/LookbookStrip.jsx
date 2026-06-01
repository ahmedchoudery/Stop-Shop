'use client';

/**
 * @fileoverview LookbookStrip.jsx — Full-Bleed Editorial Image Strip
 * A dramatic full-width lifestyle image with editorial text overlay.
 */

import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function LookbookStrip({ onShopNow }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const scrollToGrid = () => {
    const el = document.getElementById('product-grid');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={ref}
      className="relative overflow-hidden"
      style={{
        height: 'clamp(360px, 55vw, 680px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}
    >
      {/* Background Image */}
      <img
        src="/lookbook-strip.jpg"
        alt="Stop-Shop Lookbook"
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{
          transform: visible ? 'scale(1)' : 'scale(1.05)',
          transition: 'transform 1.2s ease',
        }}
      />

      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div
          className="px-8 sm:px-16 lg:px-24 max-w-2xl"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : 'translateX(-24px)',
            transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s',
          }}
        >
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-4">
            The Lookbook · SS '26
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white leading-none mb-6">
            Defined by<br />
            <span className="text-[#ba1f3d]">Attitude.</span>
          </h2>
          <p className="text-sm text-gray-300 font-medium leading-relaxed mb-8 max-w-sm">
            Every piece tells a story. Every outfit, a statement.
            Dress how you want the world to see you.
          </p>
          <button
            onClick={() => { onShopNow?.('All'); scrollToGrid(); }}
            className="group inline-flex items-center gap-4 bg-[#ba1f3d] text-white px-10 py-4 text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(186,31,61,0.45)] active:scale-95"
          >
            Shop The Look
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </section>
  );
}
