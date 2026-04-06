/**
 * @fileoverview PowerOfChoiceHero — Final 8K Premium Refinement
 * Fixes: Laptop header clearance, full-height image alignment, and mobile head cropping.
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
    anime.set(items, { opacity: 0, translateY: 30 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 1200,
      delay: anime.stagger(150, { start: 200 }),
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
      className="relative bg-[#080808] overflow-hidden w-full"
      style={{ height: '100dvh' }}
    >
      {/* ── 8K BACKGROUND MEDIA (Mobile Only Background Layer) ─────── */}
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

      {/* ── MAIN LAYOUT (Laptop Grid) ─────────────────────────────── */}
      <div className="relative z-20 h-full max-w-[1920px] mx-auto">
        <div className="h-full flex flex-col lg:grid lg:grid-cols-12">
          
          {/* CONTENT PANEL: Fixed Under Header Clearance */}
          <div 
            ref={contentRef}
            className="
              flex-grow flex flex-col justify-center items-center text-center 
              lg:items-start lg:text-left 
              px-6 md:px-12 lg:px-20 
              pt-[140px] lg:pt-[180px] pb-10 lg:pb-0 
              lg:col-span-6 xl:col-span-7
            "
          >
            {/* Season Tag */}
            <div data-anime className="flex items-center gap-3 mb-6" style={{ opacity: 0 }}>
              <span className="w-8 h-px bg-[#ba1f3d] hidden lg:block" />
              <span className="text-[10px] font-black uppercase tracking-[0.45em] text-[#ba1f3d]">
                Pakistan's Premium Fashion Hub · SS '26
              </span>
            </div>

            {/* Headline */}
            <h1 
              data-anime
              className="text-white font-black uppercase leading-[0.88] tracking-[-0.03em] mb-7"
              style={{ opacity: 0, fontSize: 'clamp(2.6rem, 8vw, 6.2rem)' }}
            >
              The New<br />
              <span className="text-transparent" style={{ WebkitTextStroke: '1.5px #ba1f3d' }}>Standard</span><br />
              of Streetwear.
            </h1>

            {/* Body */}
            <p 
              data-anime
              className="text-gray-300 text-sm md:text-base lg:text-xl leading-relaxed max-w-sm lg:max-w-xl mb-10 font-medium"
              style={{ opacity: 0 }}
            >
              Elite fabrics. Bold designs. We don't just sell clothes; we build your identity. 
              Join 2,000+ trendsetters who make their own rules.
            </p>

            {/* Action Group */}
            <div data-anime className="flex w-full sm:w-auto mb-14" style={{ opacity: 0 }}>
              <button
                onClick={scrollToGrid}
                className="group relative flex-grow sm:flex-grow-0 flex items-center justify-center gap-6 px-12 py-5 bg-[#ba1f3d] text-white text-[12px] font-black uppercase tracking-[0.4em] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_60px_rgba(186,31,61,0.5)] active:scale-95"
              >
                <span className="relative z-10">Shop Selection</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1.5 transition-transform" />
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </button>
            </div>

            {/* Identity Pillars (Horizontal Row) */}
            <div data-anime className="flex flex-row justify-center lg:justify-start gap-8 lg:gap-12 pt-10 border-t border-white/5 w-full" style={{ opacity: 0 }}>
              {IDENTITY_PILLARS.map((item) => (
                <div key={item.label} className="flex flex-col items-center lg:items-start lg:flex-row gap-3 group">
                  <div className="p-2.5 rounded bg-white/5 border border-white/5 group-hover:border-[#ba1f3d]/30 transition-colors">
                    <item.icon size={14} className="text-[#ba1f3d]" />
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-[9px] lg:text-[10px] font-black text-white uppercase tracking-wider">{item.label}</p>
                    <p className="text-[8px] text-gray-500 font-bold mt-1 tracking-wide hidden sm:block">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─────── LAPTOP IMAGE PANEL (Full Height) ────────────────── */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-5 relative h-full overflow-hidden items-stretch">
             <div className="relative w-full h-full bg-[#0a0a0a] group">
                <img
                  src="/hero-model.jpg"
                  alt="SS'26 Premium Model"
                  className="w-full h-full object-cover object-[center_18%] filter brightness-[0.9] contrast-[1.1] transition-transform duration-[5s] group-hover:scale-105"
                  loading="eager"
                />
                
                {/* Editorial Fade */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-transparent to-transparent opacity-40" />
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PowerOfChoiceHero;
