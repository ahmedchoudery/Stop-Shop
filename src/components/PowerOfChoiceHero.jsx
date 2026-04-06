/**
 * @fileoverview PowerOfChoiceHero — Laptop Optimized 8K Hero
 * Fixes: Full content visibility on laptop viewports and strict header clearance.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import { ArrowRight, Star, ShieldCheck, Zap } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';

const PowerOfChoiceHero = () => {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const items = contentRef.current.querySelectorAll('[data-anime]');
    anime.set(items, { opacity: 0, translateY: 20 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 1000,
      delay: anime.stagger(120, { start: 200 }),
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

  const IDENTITY_PILLARS = [
    { icon: ShieldCheck, label: 'Highest Luxury', sub: 'Imported Elite Fabrics' },
    { icon: Zap,         label: 'Bold Identity', sub: 'Worn by Leaders' },
    { icon: Star,        label: 'Trend Shapers', sub: '2,000+ Verified' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#080808] overflow-hidden w-full lg:h-[100dvh]"
      style={{ minHeight: '100dvh' }}
    >
      {/* ── MOBILE MEDIA BACKGROUND ─────── */}
      <div className="absolute inset-0 z-0 lg:hidden pointer-events-none">
        <img
          src="/hero-model.jpg"
          alt="SS'26 Luxury Model"
          className="w-full h-full object-cover object-[center_12%]"
          style={{ filter: 'brightness(0.6) contrast(1.15)' }}
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/70" />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ba1f3d 0.5px, transparent 0.5px)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* ── MAIN LAYOUT (Shifted below header) ─────────────────── */}
      <div className="relative z-20 h-full max-w-[1920px] mx-auto pt-[80px] lg:pt-[90px]">
        <div className="flex flex-col lg:grid lg:grid-cols-12 h-full lg:items-center">
          
          {/* CONTENT PANEL: Compact 100% visible sizing */}
          <div 
            ref={contentRef}
            className="
              flex-grow flex flex-col justify-center items-center text-center 
              lg:items-start lg:text-left 
              px-6 md:px-12 lg:px-20 
              py-10 lg:py-0 
              lg:col-span-6 xl:col-span-7
            "
          >
            {/* Season Tag */}
            <div data-anime className="flex items-center gap-3 mb-4 lg:mb-5" style={{ opacity: 0 }}>
              <span className="w-8 h-px bg-[#ba1f3d] hidden lg:block" />
              <span className="text-[10px] font-black uppercase tracking-[0.45em] text-[#ba1f3d]">
                Pakistan's Premium Fashion Hub · SS '26
              </span>
            </div>

            {/* Headline: Scaled for Laptop Fit */}
            <h1 
              data-anime
              className="text-white font-black uppercase leading-[0.88] tracking-[-0.03em] mb-5 lg:mb-6"
              style={{ opacity: 0, fontSize: 'clamp(2.4rem, 6.5vw, 4.8rem)' }}
            >
              The New<br />
              <span className="text-transparent" style={{ WebkitTextStroke: '1.5px #ba1f3d' }}>Standard</span><br />
              of Streetwear.
            </h1>

            {/* Body: Tighter spacing */}
            <p 
              data-anime
              className="text-gray-300 text-sm md:text-base lg:text-lg leading-relaxed max-w-sm lg:max-w-lg mb-6 lg:mb-8 font-medium"
              style={{ opacity: 0 }}
            >
              Elite fabrics. Bold designs. We don't just sell clothes; we build your identity. 
              Join 2,000+ trendsetters who make their own rules.
            </p>

            {/* Action Group */}
            <div data-anime className="flex w-full sm:w-auto mb-8 lg:mb-10" style={{ opacity: 0 }}>
              <button
                onClick={scrollToGrid}
                className="group relative flex-grow sm:flex-grow-0 flex items-center justify-center gap-5 px-12 py-5 bg-[#ba1f3d] text-white text-[12px] font-black uppercase tracking-[0.4em] overflow-hidden transition-all duration-300 hover:shadow-[0_15px_40px_rgba(186,31,61,0.4)] active:scale-95"
              >
                <span className="relative z-10">Shop Selection</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1.5 transition-transform" />
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </button>
            </div>

            {/* Identity Pillars (Icons Row) */}
            <div data-anime className="flex flex-row justify-center lg:justify-start gap-6 sm:gap-10 pt-8 border-t border-white/5 w-full" style={{ opacity: 0 }}>
              {IDENTITY_PILLARS.map((item) => (
                <div key={item.label} className="flex flex-col items-center lg:items-start lg:flex-row gap-3 group">
                  <div className="p-2 rounded bg-white/5 border border-white/5 group-hover:border-[#ba1f3d]/30 transition-colors duration-300">
                    <item.icon size={13} className="text-[#ba1f3d]" />
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-[9px] lg:text-[10px] font-black text-white uppercase tracking-wider">{item.label}</p>
                    <p className="text-[8px] text-gray-500 font-bold mt-1 tracking-wide hidden sm:block leading-none">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─────── LAPTOP IMAGE (Shifted below header) ─────────── */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-5 relative h-full overflow-hidden items-stretch">
             <div className="relative w-full h-full bg-[#0a0a0a] group">
                <img
                  src="/hero-model.jpg"
                  alt="SS'26 Premium Model"
                  className="w-full h-full object-cover object-[center_18%] filter brightness-[0.95] contrast-[1.1] transition-transform duration-[6s] group-hover:scale-105"
                  loading="eager"
                />
                
                {/* Horizontal Fade */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#080808] to-transparent z-10" />
                
                <div className="absolute bottom-10 right-10 z-20 bg-black/40 backdrop-blur-2xl border border-white/10 p-5 text-right">
                  <p className="text-[7px] font-black text-[#ba1f3d] uppercase tracking-[0.5em]">Active Status</p>
                  <p className="text-2xl font-black text-white uppercase tracking-tighter mt-0.5">SS '26</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PowerOfChoiceHero;
