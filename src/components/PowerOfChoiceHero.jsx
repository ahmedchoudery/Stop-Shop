'use client';

/**
 * @fileoverview PowerOfChoiceHero — Premium Minimalist Fine-Art Gallery Hero
 * v5: Clean warm off-white canvas, hybrid typography, framed portrait imagery,
 *     zero text-image overlap, quiet underline transitions, and robust CSS-based entrance animations.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import { ChevronDown } from 'lucide-react';

const PowerOfChoiceHero = () => {
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef(null);

  // Trigger CSS-based animations on client mount to bypass hydration and loading screen collisions
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll indicator bounce (using anime.js since it handles looping and offsets easily without collision)
  useEffect(() => {
    if (!scrollRef.current) return;
    anime({
      targets: scrollRef.current,
      translateY: [0, 6, 0],
      opacity: [0.4, 1, 0.4],
      duration: 1800,
      loop: true,
      easing: 'easeInOutSine',
      delay: 1200,
    });
  }, []);

  const scrollToGrid = useCallback(() => {
    const el = document.getElementById('product-grid');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  return (
    <section
      id="hero-section"
      className="relative bg-[#faf9f6] overflow-hidden w-full flex flex-col lg:grid lg:grid-cols-12"
      style={{ minHeight: '100dvh' }}
    >
      {/* ── Grain overlay ────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '160px',
          opacity: 0.02,
          mixBlendMode: 'multiply',
        }}
        aria-hidden="true"
      />

      {/* ── Copywriting Column ────────────────────────────────────────── */}
      <div className="order-2 lg:order-1 lg:col-span-6 flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-24 pt-8 pb-16 lg:py-0 relative z-20">
        <div className="max-w-md xl:max-w-lg mx-auto lg:mx-0 flex flex-col items-center text-center lg:items-start lg:text-left">
          
          {/* Eyebrow */}
          <span
            className={`text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] delay-[100ms] transform ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Pakistan's Premium Fashion Hub · SS '26
          </span>

          {/* Headline */}
          {/* [Psychological Mechanism: Identity & Self-Relevant Aspiration] */}
          <h1
            className={`text-gray-900 font-serif font-light text-[2.2rem] md:text-[3.2rem] lg:text-[4rem] xl:text-[4.5rem] leading-[1.1] tracking-tight mb-6 transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] delay-[220ms] transform ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Crafting Confidence.
            <br />
            <span className="font-serif italic text-cardinal">Defining Character.</span>
          </h1>

          {/* Sub-copy */}
          {/* [Psychological Mechanism: Pain Agitation & Cognitive Relief] */}
          <p
            className={`text-gray-500 font-sans text-xs md:text-sm leading-relaxed max-w-[310px] md:max-w-md lg:max-w-lg mb-8 font-normal transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] delay-[340ms] transform ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Off-the-rack fits fail. Stop & Shop is engineered for precision. We combine premium fabrics with master-tailored structures to deliver comfort that commands respect.
          </p>

          {/* CTAs */}
          {/* [Psychological Mechanism: Low-Friction Autonomy-Preserving CTAs] */}
          <div
            className={`flex items-center gap-8 transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] delay-[460ms] transform ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <button
              onClick={scrollToGrid}
              className="text-[9px] font-black uppercase tracking-[0.35em] text-gray-900 hover:text-cardinal border-b border-gray-900/30 hover:border-cardinal transition-colors duration-300 pb-1"
            >
              Shop the Collection
            </button>
            <button
              onClick={scrollToGrid}
              className="text-[9px] font-black uppercase tracking-[0.35em] text-gray-400 hover:text-gray-900 transition-colors duration-300 pb-1"
            >
              Explore the Brand
            </button>
          </div>

        </div>
      </div>

      {/* ── Image Gallery Column ──────────────────────────────────────── */}
      {/* Portrait frame with absolute separation from text to ensure no overlaps */}
      <div className="order-1 lg:order-2 lg:col-span-6 flex items-center justify-center p-6 md:p-12 lg:p-16 pt-24 lg:pt-16">
        <div className={`relative aspect-[3/4] w-full max-w-[340px] md:max-w-[420px] bg-[#fdfdfd] border border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] delay-[300ms] transform ${
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]'
        }`}>
          <img
            src="/Hero-Mobile.jpeg"
            alt="SS'26 Collection Mobile"
            className="block md:hidden w-full h-full object-cover transition-transform duration-[1.5s] ease-out hover:scale-105"
            loading="eager"
          />
          <img
            src="/Hero-Tablet.jpeg"
            alt="SS'26 Collection Tablet"
            className="hidden md:block lg:hidden w-full h-full object-cover object-bottom transition-transform duration-[1.5s] ease-out hover:scale-105"
            loading="eager"
          />
          <img
            src="/Hero-Desktop.jpeg"
            alt="SS'26 Collection Desktop"
            className="hidden lg:block w-full h-full object-cover object-center transition-transform duration-[1.5s] ease-out hover:scale-105"
            loading="eager"
          />
        </div>
      </div>

      {/* ── Scroll indicator ────────────────────────────────────────────── */}
      <button
        ref={scrollRef}
        onClick={scrollToGrid}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 hidden lg:flex flex-col items-center gap-1.5 text-gray-400 hover:text-gray-900 transition-colors duration-200"
        aria-label="Scroll down"
      >
        <span className="text-[8px] font-black uppercase tracking-[0.4em]">Scroll</span>
        <ChevronDown size={12} strokeWidth={2.5} />
      </button>

    </section>
  );
};

export default PowerOfChoiceHero;