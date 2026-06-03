'use client';

/**
 * @fileoverview PowerOfChoiceHero — Premium Menswear Editorial Hero
 * Refinements: larger mobile headline, refined stat bar, cleaner eyebrow,
 *              slightly more generous letter-spacing on CTA.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import { EASING } from '../hooks/useAnime.js';


const PowerOfChoiceHero = () => {
  const contentRef = useRef(null);

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

  const scrollToGrid = useCallback(() => {
    const el = document.getElementById('product-grid');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  return (
    <section
      className="relative bg-[#ba1f3e] overflow-hidden w-full flex flex-col"
      style={{ minHeight: '100dvh' }}
    >
      {/* ── Background Image ──────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full bg-[#ba1f3e]">
          {/* Mobile Viewport: Centered layout */}
          <img
            src="/mobile.jpg"
            alt="SS'26 Collection Mobile"
            className="block md:hidden w-full h-full object-cover object-center"
            loading="eager"
          />
          {/* Tablet Viewport: Centered layout */}
          <img
            src="/tablet.jpg"
            alt="SS'26 Collection Tablet"
            className="hidden md:block lg:hidden w-full h-full object-cover object-center"
            loading="eager"
          />
          {/* Desktop Viewport: Full-bleed wide layout */}
          <img
            src="/desktop.jpg"
            alt="SS'26 Collection Desktop"
            className="hidden lg:block w-full h-full object-cover object-center"
            loading="eager"
          />
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="relative z-30 flex-1 w-full max-w-[1920px] mx-auto flex flex-col pt-[110px] lg:pt-[130px] pb-10 lg:pb-0">

        {/* Mobile: season eyebrow */}
        <div className="w-full px-6 flex justify-center lg:hidden mt-5">
          <span className="text-[9px] font-black uppercase tracking-[0.45em] text-white/60 text-center">
            Pakistan's Premium Fashion Hub · SS '26
          </span>
        </div>

        {/* Main content */}
        <div className="w-full flex-grow flex flex-col justify-start md:justify-center px-6 md:px-12 lg:px-20 pt-8 md:pt-0">
          <div ref={contentRef} className="max-w-4xl flex flex-col items-start text-left">

            {/* Desktop: season eyebrow */}
            <div
              data-anime
              className="hidden lg:flex items-center gap-4 mb-8"
              style={{ opacity: 0 }}
            >
              <span className="w-7 h-px bg-white/30" />
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/60">
                Pakistan's Premium Fashion Hub · SS '26
              </span>
            </div>

            {/* Headline */}
            <h1
              data-anime
              className={[
                'text-white font-black uppercase',
                'leading-[1.15] lg:leading-[0.88]',
                'tracking-[-0.03em]',
                'mb-6 lg:mb-8',
                'text-[2.25rem] md:text-[3rem]',
                'lg:text-[clamp(2.6rem,7vw,4.5rem)]',
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
              className="text-white/85 text-[13px] md:text-sm lg:text-[1.05rem] leading-relaxed max-w-[280px] md:max-w-md lg:max-w-lg mb-8 lg:mb-11 font-medium"
              style={{ opacity: 0 }}
            >
              Timeless designs, crafted with premium fabrics for absolute comfort and style. Discover our signature menswear essentials.
            </p>

            {/* CTA */}
            <div
              data-anime
              className="flex flex-wrap gap-8 text-[11px] lg:text-[12px] font-black uppercase tracking-[0.3em] text-white mb-12 lg:mb-14"
              style={{ opacity: 0 }}
            >
              <button
                onClick={scrollToGrid}
                className="pb-1 border-b border-white hover:border-white/60 transition-colors duration-300"
              >
                Shop the Collection
              </button>
              <button
                onClick={scrollToGrid}
                className="pb-1 border-b border-white hover:border-white/60 transition-colors duration-300"
              >
                Explore the Brand
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default PowerOfChoiceHero;