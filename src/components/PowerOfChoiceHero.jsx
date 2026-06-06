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
      id="hero-section"
      className="relative bg-cardinal overflow-hidden w-full flex flex-col"
      style={{ minHeight: '100dvh' }}
    >
      {/* ── Background Image ──────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full bg-cardinal">
          {/* Mobile Viewport: Centered layout */}
          <img
            src="/Hero-Mobile.jpeg"
            alt="SS'26 Collection Mobile"
            className="block md:hidden w-full h-full object-cover"
            style={{ objectPosition: '50% calc(100% + 1.2in)' }}
            loading="eager"
          />
          {/* Tablet Viewport: Centered layout */}
          <img
            src="/Hero-Tablet.jpeg"
            alt="SS'26 Collection Tablet"
            className="hidden md:block lg:hidden w-full h-full object-cover object-bottom"
            loading="eager"
          />
          {/* Desktop Viewport: Full-bleed wide layout */}
          <img
            src="/Hero-Desktop.jpeg"
            alt="SS'26 Collection Desktop"
            className="hidden lg:block w-full h-full object-cover object-bottom"
            loading="eager"
          />
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="relative z-30 flex-1 w-full max-w-[1920px] mx-auto flex flex-col pt-[110px] lg:pt-[130px] pb-10 lg:pb-0">

        {/* Mobile: season eyebrow */}
        <div className="w-full px-6 flex justify-center lg:hidden mt-2">
          <span className="text-[9px] font-black uppercase tracking-[0.45em] text-white/75 text-center drop-shadow-md">
            Pakistan's Premium Fashion Hub · SS '26
          </span>
        </div>

        {/* Main content aligned to empty spaces: top-center on mobile/tablet, middle-left on desktop */}
        <div className="w-full flex-grow flex flex-col justify-start lg:justify-center items-center lg:items-start px-6 md:px-12 lg:px-24 pt-6 lg:pt-0">
          <div ref={contentRef} className="max-w-xl xl:max-w-2xl flex flex-col items-center text-center lg:items-start lg:text-left">

            {/* Desktop: season eyebrow */}
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

            {/* Headline using premium Barlow Condensed font */}
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

            {/* Sub-copy using premium DM Sans font */}
            <p
              data-anime
              className="text-white/95 font-sans text-[13px] md:text-sm lg:text-[1.1rem] leading-relaxed max-w-[290px] md:max-w-md lg:max-w-lg mb-6 lg:mb-10 font-normal drop-shadow-md"
              style={{ opacity: 0 }}
            >
              Timeless designs, crafted with premium fabrics for absolute comfort and style. Discover our signature menswear essentials.
            </p>

            {/* CTA */}
            <div
              data-anime
              className="flex flex-wrap justify-center lg:justify-start gap-8 text-[11px] lg:text-[12px] font-black uppercase tracking-[0.3em] text-white mb-10 lg:mb-12"
              style={{ opacity: 0 }}
            >
              <button
                onClick={scrollToGrid}
                className="pb-1 border-b-2 border-white hover:border-white/60 transition-colors duration-300 drop-shadow-md"
              >
                Shop the Collection
              </button>
              <button
                onClick={scrollToGrid}
                className="pb-1 border-b-2 border-white hover:border-white/60 transition-colors duration-300 drop-shadow-md"
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