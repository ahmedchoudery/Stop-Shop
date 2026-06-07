'use client';

/**
 * @fileoverview PowerOfChoiceHero — Premium Menswear Editorial Hero
 * v3: grain texture overlay, animated scroll indicator, editorial stat bar,
 *     floating "New Arrivals" badge, stronger headline lock-up.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import { EASING } from '../hooks/useAnime.js';
import { ChevronDown } from 'lucide-react';

const STATS = [
  { value: '500+', label: 'Premium Pieces' },
  { value: 'SS\'26', label: 'Collection' },
  { value: '100%', label: 'Authentic Quality' },
  { value: 'Gujrat', label: 'Pakistan' },
];

const PowerOfChoiceHero = () => {
  const contentRef = useRef(null);
  const statsRef  = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const items = contentRef.current.querySelectorAll('[data-anime]');
    anime.set(items, { opacity: 0, translateY: 18 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 1000,
      delay: anime.stagger(130, { start: 250 }),
      easing: EASING.FABRIC,
    });
  }, []);

  // Stats bar entrance
  useEffect(() => {
    if (!statsRef.current) return;
    const items = statsRef.current.querySelectorAll('[data-stat]');
    anime.set(items, { opacity: 0, translateY: 10 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 800,
      delay: anime.stagger(100, { start: 1100 }),
      easing: EASING.FABRIC,
    });
  }, []);

  // Scroll indicator bounce
  useEffect(() => {
    if (!scrollRef.current) return;
    anime({
      targets: scrollRef.current,
      translateY: [0, 8, 0],
      opacity: [0.5, 1, 0.5],
      duration: 1800,
      loop: true,
      easing: 'easeInOutSine',
      delay: 1600,
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
      className="relative bg-cardinal overflow-hidden w-full flex flex-col"
      style={{ minHeight: '100dvh' }}
    >
      {/* ── Grain overlay ────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '160px',
          opacity: 0.04,
          mixBlendMode: 'overlay',
        }}
        aria-hidden="true"
      />

      {/* ── Gradient vignette bottom ─────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[45%] z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)' }}
        aria-hidden="true"
      />

      {/* ── Background Image ──────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full bg-cardinal overflow-hidden">
          <img
            src="/Hero-Mobile.jpeg"
            alt="SS'26 Collection Mobile"
            className="block md:hidden w-full h-full object-cover animate-kenburns"
            style={{ objectPosition: '50% calc(100% + 1.2in)' }}
            loading="eager"
          />
          <img
            src="/Hero-Tablet.jpeg"
            alt="SS'26 Collection Tablet"
            className="hidden md:block lg:hidden w-full h-full object-cover object-bottom animate-kenburns"
            loading="eager"
          />
          <img
            src="/Hero-Desktop.jpeg"
            alt="SS'26 Collection Desktop"
            className="hidden lg:block w-full h-full object-cover object-bottom animate-kenburns"
            loading="eager"
          />
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="relative z-30 flex-1 w-full max-w-[1920px] mx-auto flex flex-col pt-[110px] lg:pt-[130px] pb-0 lg:pb-0">

        {/* Floating badge — mobile only */}
        <div className="w-full px-6 flex justify-center lg:hidden mt-2">
          <span
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cardinal animate-pulse" />
            <span className="text-[8.5px] font-black uppercase tracking-[0.4em] text-white/80">
              Pakistan's Premium Fashion Hub · SS '26
            </span>
          </span>
        </div>

        {/* Main copy block */}
        <div className="w-full flex-grow flex flex-col justify-start lg:justify-center items-center lg:items-start px-6 md:px-12 lg:px-24 pt-6 lg:pt-0">
          <div ref={contentRef} className="max-w-xl xl:max-w-2xl flex flex-col items-center text-center lg:items-start lg:text-left">

            {/* Desktop eyebrow */}
            <div
              data-anime
              className="hidden lg:flex items-center gap-4 mb-6"
              style={{ opacity: 0 }}
            >
              <span className="w-7 h-px bg-white/40" />
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/80 drop-shadow-md">
                Pakistan's Premium Fashion Hub · SS '26
              </span>
            </div>

            {/* New Arrivals badge — desktop */}
            <div
              data-anime
              className="hidden lg:inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full mb-7"
              style={{ opacity: 0 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffd166] animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/90">New Arrivals Available</span>
            </div>

            {/* Headline */}
            <h1
              data-anime
              className={[
                'text-white font-heading font-black uppercase',
                'leading-[1.05] lg:leading-[0.88]',
                'tracking-[-0.03em]',
                'mb-5 lg:mb-8',
                'text-[2.5rem] md:text-[3.5rem]',
                'lg:text-[clamp(3rem,8vw,5.5rem)]',
                'drop-shadow-lg',
              ].join(' ')}
              style={{ opacity: 0 }}
            >
              Classics
              <br />
              Reimagined.
            </h1>

            {/* Sub-copy */}
            <p
              data-anime
              className="text-white/90 font-sans text-[13px] md:text-sm lg:text-[1.05rem] leading-relaxed max-w-[290px] md:max-w-md lg:max-w-lg mb-6 lg:mb-10 font-normal drop-shadow-md"
              style={{ opacity: 0 }}
            >
              Timeless designs, crafted with premium fabrics for absolute comfort and style. Discover our signature menswear essentials.
            </p>

            {/* CTA */}
            <div
              data-anime
              className="flex flex-wrap justify-center lg:justify-start gap-4 lg:gap-8 mb-10 lg:mb-12"
              style={{ opacity: 0 }}
            >
              <button
                onClick={scrollToGrid}
                className="group relative flex items-center gap-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] px-7 py-3.5 overflow-hidden transition-all duration-300 hover:bg-opacity-90 active:scale-[0.98]"
              >
                <span className="relative z-10">Shop the Collection</span>
                <span className="relative z-10 w-5 h-px bg-black group-hover:w-7 transition-all duration-300" />
                <span className="absolute inset-0 bg-cardinal scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                <span className="absolute inset-0 z-[1] group-hover:text-white transition-colors duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]" />
              </button>
              <button
                onClick={scrollToGrid}
                className="flex items-center gap-2 text-[10px] lg:text-[11px] font-black uppercase tracking-[0.3em] text-white pb-1 border-b border-white/40 hover:border-white transition-colors duration-300 drop-shadow-md"
              >
                Explore the Brand
              </button>
            </div>

          </div>
        </div>

        {/* ── Stat Bar ────────────────────────────────────────────────── */}
        <div
          ref={statsRef}
          className="relative z-30 w-full border-t border-white/10 bg-black/30 backdrop-blur-sm mt-auto"
        >
          <div className="max-w-[1920px] mx-auto px-6 md:px-12 lg:px-24">
            <div className="flex items-stretch divide-x divide-white/10 overflow-x-auto scrollbar-none">
              {STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  data-stat
                  className="flex flex-col justify-center py-5 px-7 md:px-10 flex-1 min-w-[110px]"
                  style={{ opacity: 0 }}
                >
                  <span className="text-white font-black text-lg md:text-2xl leading-none tracking-tighter tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-white/50 text-[8px] font-bold uppercase tracking-[0.35em] mt-1">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Scroll indicator ────────────────────────────────────────────── */}
      <button
        ref={scrollRef}
        onClick={scrollToGrid}
        className="absolute bottom-[72px] lg:bottom-[84px] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 text-white/60 hover:text-white transition-colors duration-200"
        aria-label="Scroll down"
        style={{ opacity: 0 }}
      >
        <span className="text-[8px] font-black uppercase tracking-[0.4em]">Scroll</span>
        <ChevronDown size={14} strokeWidth={2.5} />
      </button>

    </section>
  );
};

export default PowerOfChoiceHero;