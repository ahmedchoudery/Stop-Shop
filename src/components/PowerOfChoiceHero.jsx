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
      className="relative bg-[#0a0a0a] overflow-hidden w-full flex flex-col lg:grid lg:grid-cols-12"
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

      {/* ── Background Image / Character Container ──────────────────── */}
      {/* Visual positioning prevents text overlap on models across all layouts */}
      <div className="order-1 lg:order-2 lg:col-span-6 relative h-[45vh] lg:h-full w-full overflow-hidden border-b lg:border-b-0 lg:border-l border-white/5 bg-[#0d0d0d]">
        <img
          src="/Hero-Mobile.jpeg"
          alt="SS'26 Collection Mobile"
          className="block md:hidden w-full h-full object-cover animate-kenburns"
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
          className="hidden lg:block w-full h-full object-cover object-center animate-kenburns"
          loading="eager"
        />
        {/* Editorial glass overlay */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      </div>

      {/* ── Content / Copywriting Container ─────────────────────────── */}
      <div className="order-2 lg:order-1 lg:col-span-6 flex flex-col justify-between pt-8 lg:pt-[130px] bg-[#0a0a0a] relative z-20">
        
        {/* Floating badge */}
        <div className="w-full px-6 md:px-12 lg:px-16 flex justify-center lg:justify-start">
          <span
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cardinal animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/80">
              Pakistan's Premium Fashion Hub · SS '26
            </span>
          </span>
        </div>

        {/* Main copy block */}
        <div className="w-full flex-grow flex flex-col justify-center items-center lg:items-start px-6 md:px-12 lg:px-16 pt-8 pb-10">
          <div ref={contentRef} className="max-w-md xl:max-w-lg flex flex-col items-center text-center lg:items-start lg:text-left">
            
            {/* New Arrivals badge — desktop */}
            <div
              data-anime
              className="hidden lg:inline-flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-6"
              style={{ opacity: 0 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cardinal animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/90">New Arrivals Live</span>
            </div>

            {/* Headline */}
            {/* [Psychological Mechanism: Identity & Self-Relevant Aspiration] */}
            <h1
              data-anime
              className="text-white font-heading font-black uppercase leading-[1.05] lg:leading-[0.9] tracking-[-0.03em] mb-4 text-[2.2rem] md:text-[3rem] lg:text-[3.8rem] xl:text-[4.2rem]"
              style={{ opacity: 0 }}
            >
              Crafting Confidence.
              <br />
              <span className="text-cardinal">Defining Character.</span>
            </h1>

            {/* Sub-copy */}
            {/* [Psychological Mechanism: Pain Agitation & Cognitive Relief] */}
            <p
              data-anime
              className="text-white/70 font-sans text-xs md:text-sm leading-relaxed max-w-[310px] md:max-w-md lg:max-w-lg mb-6 lg:mb-8 font-normal"
              style={{ opacity: 0 }}
            >
              Off-the-rack fits fail. Stop & Shop is engineered for precision. We combine premium fabrics with master-tailored structures to deliver comfort that commands respect.
            </p>

            {/* CTA */}
            {/* [Psychological Mechanism: Low-Friction Autonomy-Preserving CTAs] */}
            <div
              data-anime
              className="flex flex-wrap justify-center lg:justify-start gap-4 lg:gap-6"
              style={{ opacity: 0 }}
            >
              <button
                onClick={scrollToGrid}
                className="group relative flex items-center gap-3 bg-white text-black text-[9px] font-black uppercase tracking-[0.3em] px-6 py-3.5 overflow-hidden transition-all duration-300 hover:bg-opacity-90 active:scale-[0.98]"
              >
                <span className="relative z-10">Shop the Collection</span>
                <span className="relative z-10 w-5 h-px bg-black group-hover:w-7 transition-all duration-300" />
                <span className="absolute inset-0 bg-cardinal scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                <span className="absolute inset-0 z-[1] group-hover:text-white transition-colors duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]" />
              </button>
              <button
                onClick={scrollToGrid}
                className="flex items-center gap-2 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-white pb-1 border-b border-white/40 hover:border-white transition-colors duration-300"
              >
                Explore the Brand
              </button>
            </div>

          </div>
        </div>

        {/* ── Stat Bar ────────────────────────────────────────────────── */}
        {/* [Psychological Mechanism: Social Proof & Heritage Verification] */}
        <div
          ref={statsRef}
          className="w-full border-t border-white/5 bg-black/40 backdrop-blur-sm mt-auto"
        >
          <div className="px-6 md:px-12 lg:px-16">
            <div className="flex items-stretch divide-x divide-white/5 overflow-x-auto scrollbar-none">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  data-stat
                  className="flex flex-col justify-center py-4 px-4 md:px-6 flex-1 min-w-[95px]"
                  style={{ opacity: 0 }}
                >
                  <span className="text-white font-black text-base md:text-xl leading-none tracking-tighter tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-white/50 text-[7.5px] font-bold uppercase tracking-[0.35em] mt-1">
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
        className="absolute bottom-[72px] lg:bottom-[84px] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 text-white/60 hover:text-white transition-colors duration-200 lg:hidden"
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