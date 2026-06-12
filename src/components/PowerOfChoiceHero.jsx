'use client';

/**
 * @fileoverview PowerOfChoiceHero — Full-Bleed Editorial Campaign Hero
 * v6: One unified design across all layouts.
 *     - Hero fills exactly the viewport below the navbar (100dvh - 72px)
 *     - Background image covers the entire section (object-fit: cover)
 *     - Dark gradient scrim for text legibility
 *     - Desktop: content left-aligned, left-third zone
 *     - Tablet:  content top-left, diagonal scrim
 *     - Mobile:  content centered top, full-width scrim from top
 *     - No card borders, no image containers — pure editorial
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

const NAVBAR_HEIGHT = 72; // px — matches Navbar height when not scrolled

const PowerOfChoiceHero = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToGrid = useCallback(() => {
    const el = document.getElementById('product-grid');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  return (
    <section
      id="hero-section"
      aria-label="Hero — Crafting Confidence"
      style={{ height: `calc(100dvh - ${NAVBAR_HEIGHT}px)` }}
      className="relative w-full overflow-hidden"
    >
      {/* ─── Background Images (per breakpoint) ───────────────────────── */}
      {/* Mobile image (default, < 768px) */}
      <img
        src="/Hero-Mobile.jpeg"
        alt=""
        aria-hidden="true"
        className="
          absolute inset-0 w-full h-full
          object-cover object-[center_bottom]
          block md:hidden
        "
        loading="eager"
        fetchPriority="high"
      />
      {/* Tablet image (768px – 1023px) */}
      <img
        src="/Hero-Tablet.jpeg"
        alt=""
        aria-hidden="true"
        className="
          absolute inset-0 w-full h-full
          object-cover object-[center_bottom]
          hidden md:block lg:hidden
        "
        loading="eager"
        fetchPriority="high"
      />
      {/* Desktop image (1024px+) */}
      <img
        src="/Hero-Desktop.jpeg"
        alt=""
        aria-hidden="true"
        className="
          absolute inset-0 w-full h-full
          object-cover object-[right_center]
          hidden lg:block
        "
        loading="eager"
        fetchPriority="high"
      />

      {/* ─── Gradient Scrims (per breakpoint) ──────────────────────────── */}
      {/* Mobile: top-to-bottom dark scrim covering top 60% */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 md:hidden"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0.0) 72%)',
        }}
      />
      {/* Tablet: top-left diagonal scrim */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 hidden md:block lg:hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.70) 38%, rgba(0,0,0,0.0) 68%)',
        }}
      />
      {/* Desktop: left-to-right scrim covering left half */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 hidden lg:block"
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.60) 38%, rgba(0,0,0,0.0) 60%)',
        }}
      />

      {/* ─── Subtle grain texture overlay ──────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '160px',
          opacity: 0.025,
          mixBlendMode: 'screen',
        }}
      />

      {/* ─── Content ───────────────────────────────────────────────────── */}
      {/*
        Mobile:  absolute, top-center, w-full, centered text
        Tablet:  absolute, top-left, left-aligned
        Desktop: absolute, left-zone, vertically centered, left-aligned
      */}
      <div
        className={`
          absolute z-20
          flex flex-col
          transition-all duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}

          /* Mobile — centered top */
          top-[10%] left-0 right-0
          items-center text-center
          px-6

          /* Tablet — top-left */
          md:right-auto md:items-start md:text-left
          md:top-[12%] md:left-[40px]
          md:max-w-[420px]

          /* Desktop — vertically centered, left zone */
          lg:top-1/2 lg:-translate-y-1/2
          lg:left-[6%] lg:right-auto
          lg:items-start lg:text-left
          lg:max-w-[480px]
        `}
      >
        {/* Eyebrow */}
        <span
          className="
            block mb-4 lg:mb-5
            text-[8px] md:text-[9px]
            font-black uppercase tracking-[0.45em]
          "
          style={{ color: 'rgba(255,255,255,0.50)' }}
        >
          Pakistan&apos;s Premium Fashion Hub&nbsp;·&nbsp;SS&nbsp;&apos;26
        </span>

        {/* Headline */}
        <h1
          className="
            font-serif font-bold leading-[1.08] tracking-tight
            mb-4 lg:mb-5
            text-[2.1rem] md:text-[2.8rem] lg:text-[4.2rem]
          "
          style={{ transitionDelay: '80ms' }}
        >
          <span className="block text-white">Crafting Confidence.</span>
          <span className="block italic" style={{ color: '#C8102E' }}>
            Defining Character.
          </span>
        </h1>

        {/* Sub-copy */}
        <p
          className="
            font-sans font-normal leading-relaxed
            mb-7 lg:mb-9
            text-[11px] md:text-[12px] lg:text-[13px]
            max-w-[280px] md:max-w-[360px] lg:max-w-[400px]
          "
          style={{ color: 'rgba(255,255,255,0.68)', transitionDelay: '160ms' }}
        >
          Off-the-rack fits fail. Stop &amp; Shop is engineered for precision — premium fabrics, master-tailored structures, comfort that commands respect.
        </p>

        {/* CTAs */}
        <div
          className="
            flex gap-6 md:gap-8
            flex-row
          "
          style={{ transitionDelay: '240ms' }}
        >
          {/* Primary ghost CTA */}
          <button
            id="hero-shop-cta"
            onClick={scrollToGrid}
            className="
              group relative
              text-[9px] md:text-[10px]
              font-black uppercase tracking-[0.35em]
              text-white
              pb-1 border-b border-white/40
              hover:border-white transition-colors duration-300
            "
          >
            Shop the Collection
            <span
              className="
                absolute bottom-0 left-0 h-[1.5px] w-0
                bg-white
                group-hover:w-full
                transition-all duration-300 ease-out
              "
            />
          </button>

          {/* Secondary text CTA */}
          <button
            id="hero-explore-cta"
            onClick={scrollToGrid}
            className="
              text-[9px] md:text-[10px]
              font-black uppercase tracking-[0.35em]
              hover:text-white transition-colors duration-300
            "
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Explore the Brand
          </button>
        </div>
      </div>

      {/* ─── Scroll Indicator ──────────────────────────────────────────── */}
      <button
        id="hero-scroll-indicator"
        onClick={scrollToGrid}
        aria-label="Scroll to products"
        className={`
          absolute bottom-7 left-1/2 -translate-x-1/2 z-30
          flex flex-col items-center gap-1
          transition-all duration-[1200ms] ease-out
          hover:opacity-100
          ${mounted ? 'opacity-100' : 'opacity-0'}
        `}
        style={{ transitionDelay: '600ms' }}
      >
        <span
          className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.5em]"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          Scroll
        </span>
        <ChevronDown
          size={11}
          strokeWidth={2.5}
          style={{ color: 'rgba(255,255,255,0.45)' }}
          className="animate-bounce"
        />
      </button>
    </section>
  );
};

export default PowerOfChoiceHero;