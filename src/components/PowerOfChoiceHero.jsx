'use client';

/**
 * @fileoverview PowerOfChoiceHero — Full-Bleed Editorial Hero
 * Premium full-viewport image hero with refined text overlay.
 * Uses existing responsive hero images (Mobile / Tablet / Desktop).
 * No brand strip. Clean, minimal, editorial.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import { EASING } from '../hooks/useAnime.js';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

const PowerOfChoiceHero = () => {
  const contentRef = useRef(null);
  const scrollRef = useRef(null);
  const overlayRef = useRef(null);
  const { setActiveBucket } = useCart();

  /* ── Content entrance animation ──────────────────────────────── */
  useEffect(() => {
    if (!contentRef.current) return;
    const items = contentRef.current.querySelectorAll('[data-anime]');
    anime.set(items, { opacity: 0, translateY: 24 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 1100,
      delay: anime.stagger(140, { start: 400 }),
      easing: EASING.FABRIC,
    });
  }, []);

  /* ── Scroll indicator pulse ──────────────────────────────────── */
  useEffect(() => {
    if (!scrollRef.current) return;
    anime({
      targets: scrollRef.current,
      translateY: [0, 6, 0],
      opacity: [0.6, 1, 0.6],
      duration: 2000,
      loop: true,
      easing: 'easeInOutSine',
      delay: 2000,
    });
  }, []);

  /* ── Parallax-lite on scroll (desktop only) ──────────────────── */
  useEffect(() => {
    const hero = document.getElementById('hero-section');
    if (!hero || window.matchMedia('(max-width: 1023px)').matches) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroH = hero.offsetHeight;
        if (scrollY < heroH) {
          const progress = scrollY / heroH;
          const img = hero.querySelector('[data-hero-img]');
          if (img) {
            img.style.transform = `scale(${1 + progress * 0.08}) translateY(${progress * 30}px)`;
          }
          if (overlayRef.current) {
            overlayRef.current.style.opacity = 1 + progress * 0.15;
          }
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleShopCollection = useCallback(() => {
    if (setActiveBucket) {
      setActiveBucket('All');
    }
    const el = document.getElementById('product-grid');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, [setActiveBucket]);

  const scrollToDrop = useCallback(() => {
    const el = document.getElementById('featured-drop');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  return (
    <section
      id="hero-section"
      className="relative w-full overflow-hidden bg-[#0a0a0a]"
      style={{ height: '100dvh', minHeight: '600px', maxHeight: '1000px' }}
    >
      {/* ── Background Images ─────────────────────────────────────── */}
      <div className="absolute inset-0 w-full h-full">
        {/* Mobile */}
        <img
          data-hero-img
          src="/Hero-Mobile.jpeg"
          alt="SS'26 Collection"
          className="block md:hidden w-full h-full object-cover object-bottom"
          loading="eager"
          fetchPriority="high"
          style={{ willChange: 'transform' }}
        />
        {/* Tablet */}
        <img
          data-hero-img
          src="/Hero-Tablet.jpeg"
          alt="SS'26 Collection"
          className="hidden md:block lg:hidden w-full h-full object-cover object-bottom"
          loading="eager"
          fetchPriority="high"
          style={{ willChange: 'transform' }}
        />
        {/* Desktop */}
        <img
          data-hero-img
          src="/Hero-Desktop.jpeg"
          alt="SS'26 Collection"
          className="hidden lg:block w-full h-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          style={{ willChange: 'transform' }}
        />
      </div>

      {/* ── Gradient overlays ─────────────────────────────────────── */}
      {/* Bottom fade — ensures text legibility */}
      <div
        ref={overlayRef}
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: `
            linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.1) 65%, transparent 100%),
            linear-gradient(to right, rgba(0,0,0,0.25) 0%, transparent 60%)
          `,
          transition: 'opacity 0.3s ease',
        }}
        aria-hidden="true"
      />
      {/* Subtle vignette */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ── Grain texture ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '160px',
          opacity: 0.035,
          mixBlendMode: 'overlay',
        }}
        aria-hidden="true"
      />

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="relative z-10 h-full flex flex-col justify-start md:justify-end pt-[150px] md:pt-0">
        <div
          ref={contentRef}
          className="w-full px-6 sm:px-10 lg:px-16 pb-12 sm:pb-16 lg:pb-20 max-w-[1440px] mx-auto"
        >
          {/* Text content container. Styled without glassmorphic cards or blurs on mobile
              so that background image characters remain 100% visible and sharp. 
              The existing bottom gradient scrim handles text legibility. */}
          <div 
            className="w-full max-w-[310px] sm:max-w-[340px] lg:max-w-[480px] mx-auto md:mx-0 text-center md:text-left"
          >

            {/* Headline */}
            <h1
              data-anime
              className="text-white font-heading font-black uppercase leading-[1.05] tracking-[-0.02em] mb-3 sm:mb-4 text-[21px] md:text-[32px] lg:text-[44px]"
              style={{
                opacity: 0,
                textShadow: '0 2px 20px rgba(0,0,0,0.4)',
              }}
            >
              Crafting <br className="md:hidden" /> Confidence.
              <br />
              <span className="text-white/70">
                Defining <br className="md:hidden" /> Character.
              </span>
            </h1>


            {/* CTAs */}
            <div
              data-anime
              className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 w-full max-w-[140px] mx-auto md:max-w-none md:mx-0"
              style={{ opacity: 0 }}
            >
              {/* Primary CTA */}
              <button
                onClick={handleShopCollection}
                className="hero-cta-primary group relative flex items-center justify-center gap-2 bg-white text-black text-[8.5px] md:text-[9px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] w-full md:w-auto px-4.5 py-3 md:px-7 md:py-4 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)] active:scale-[0.98]"
              >
                <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                  Shop Collection
                </span>
                {/* Hover fill */}
                <span className="absolute inset-0 bg-[#111] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
              </button>

              {/* Secondary CTA */}
              <button
                onClick={scrollToDrop}
                className="flex items-center justify-center gap-1.5 text-[8.5px] md:text-[9px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-white/70 hover:text-white pb-0.5 border-b border-white/20 hover:border-white/80 transition-all duration-300 w-full md:w-auto py-1 md:py-0"
              >
                Explore the Brand
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ──────────────────────────────────────── */}
      <button
        ref={scrollRef}
        onClick={handleShopCollection}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors duration-200"
        aria-label="Scroll to products"
        style={{ opacity: 0 }}
      >
        <span className="text-[7px] font-black uppercase tracking-[0.5em]">Scroll</span>
        <ChevronDown size={14} strokeWidth={2} />
      </button>

      {/* ── Bottom edge line ──────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-20" />
    </section>
  );
};

export default PowerOfChoiceHero;