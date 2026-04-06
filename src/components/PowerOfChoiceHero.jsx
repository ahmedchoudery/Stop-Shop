/**
 * @fileoverview PowerOfChoiceHero — Professional Mobile & 12K Duo Redesign
 * Optimizes: Mobile readability, professional bottom-weighting, and shadow contrast.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import { ArrowRight } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';

const PowerOfChoiceHero = () => {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const items = contentRef.current.querySelectorAll('[data-anime]');
    anime.set(items, { opacity: 0, translateY: 15 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 1000,
      delay: anime.stagger(100, { start: 200 }),
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
      ref={sectionRef}
      className="relative bg-[#080808] overflow-hidden w-full lg:h-[100dvh]"
      style={{ minHeight: '100dvh' }}
    >
      {/* ── 12K SEAMLESS BACKGROUND (Models Duo: Prada & Trapstar) ─────── */}
      <div className="absolute left-0 right-0 bottom-0 top-[110px] lg:top-[120px] z-0">
        <div className="relative w-full h-full">
           <img
            src="/hero-models-duo.jpg"
            alt="SS'26 Luxury Duo"
            className="w-full h-full object-cover lg:object-contain lg:object-right object-[center_20%] lg:object-center"
            style={{ filter: 'none' }}
            loading="eager"
          />
          
          {/* Silk-Fade Masking: Smooth Blend with #080808 */}
          {/* Laptop Side Mask */}
          <div className="hidden lg:block absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#080808] via-[#080808]/80 to-transparent z-10" />
          
          {/* Enhanced Mobile Shadow Gradient: High Readability Backdrop */}
          <div className="absolute inset-x-0 bottom-0 h-[60%] lg:h-48 bg-gradient-to-t from-[#080808] via-[#080808]/80 to-transparent z-10" />
          
          {/* Global Top Mask (Header Safety) */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#080808] to-transparent z-10" />
        </div>
      </div>

      {/* Grid Pattern Overlay (Reduced Opacity) */}
      <div 
        className="absolute inset-0 z-20 opacity-[0.01] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ba1f3d 0.5px, transparent 0.5px)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* ── MAIN LAYOUT (Professional Bottom-Weighted) ───────────────────────── */}
      <div className="relative z-30 h-full max-w-[1920px] mx-auto pt-[90px] lg:pt-[130px]">
        <div className="h-full flex flex-col justify-end pb-16 lg:pb-0 lg:justify-center px-6 md:px-12 lg:px-20">
          
          {/* CONTENT PANEL: High-End Left-Aligned Positioning */}
          <div 
            ref={contentRef}
            className="
              max-w-4xl flex flex-col items-center text-center 
              lg:items-start lg:text-left
            "
          >
            {/* Season Tag */}
            <div data-anime className="flex items-center gap-3 mb-4 lg:mb-8" style={{ opacity: 0 }}>
              <span className="w-8 h-px bg-[#ba1f3d] hidden lg:block" />
              <span className="text-[10px] font-black uppercase tracking-[0.45em] text-[#ba1f3d]">
                Pakistan's Premium Fashion Hub · SS '26
              </span>
            </div>

            {/* Headline: Mobile-Optimized Scale */}
            <h1 
              data-anime
              className="text-white font-black uppercase leading-[0.88] tracking-[-0.03em] mb-4 lg:mb-8 text-[1.85rem] md:text-[2.6rem] lg:text-[clamp(2.4rem, 7vw, 4.3rem)] shadow-black/20"
              style={{ opacity: 0 }}
            >
              The New<br />
              <span className="text-transparent" style={{ WebkitTextStroke: '1.2px #ba1f3d' }}>Standard</span><br />
              of Streetwear.
            </h1>

            {/* Body: High Legibility */}
            <p 
              data-anime
              className="text-gray-200 text-xs md:text-sm lg:text-xl leading-relaxed max-w-[280px] md:max-w-md lg:max-w-xl mb-8 lg:mb-12 font-medium"
              style={{ 
                opacity: 0, 
                textShadow: '0 2px 10px rgba(0,0,0,0.8)'
              }}
            >
              Elite fabrics. Bold designs. We don't just sell clothes; we build your identity. 
              Join 2,000+ trendsetters.
            </p>

            {/* Action Group */}
            <div data-anime className="flex w-full sm:w-auto" style={{ opacity: 0 }}>
              <button
                onClick={scrollToGrid}
                className="group relative flex-grow sm:flex-grow-0 flex items-center justify-center gap-6 px-12 py-4 lg:px-16 lg:py-5 bg-[#ba1f3d] text-white text-[12px] lg:text-[13px] font-black uppercase tracking-[0.4em] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_rgba(186,31,61,0.5)] active:scale-95"
              >
                <span className="relative z-10">Shop Selection</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1.5 transition-transform" />
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PowerOfChoiceHero;
