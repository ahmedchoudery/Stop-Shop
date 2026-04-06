/**
 * @fileoverview PowerOfChoiceHero — Mobile Optimized Premium Hero
 * Redesigned to eliminate "scattered" mobile layouts.
 * Features: Background-layering for mobile, centered high-luxury typography,
 *           and icon-row transformation for trust pillars.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import { ArrowRight, Star, ShieldCheck, Zap } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';

const AmbientCursor = ({ containerRef }) => {
  const glowRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !glowRef.current) return;

    let raf;
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let tx = cx, ty = cy;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      tx = e.clientX - rect.left;
      ty = e.clientY - rect.top;
    };

    const loop = () => {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };

    el.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      el.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [containerRef]);

  return (
    <div
      ref={glowRef}
      className="absolute pointer-events-none z-10 w-[500px] h-[500px] rounded-full hidden lg:block"
      style={{
        background: 'radial-gradient(circle, rgba(186,31,61,0.03) 0%, transparent 60%)',
        top: 0, left: 0,
        willChange: 'transform',
      }}
    />
  );
};

const PowerOfChoiceHero = () => {
  const sectionRef  = useRef(null);
  const contentRef  = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const items = contentRef.current.querySelectorAll('[data-anime]');
    anime.set(items, { opacity: 0, translateY: 20 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 1000,
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
    { icon: Star,        label: 'Trend Shapers', sub: '2,000+ Shapers' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#080808] overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Background Media (Mobile Only Background Layer) */}
      <div className="absolute inset-0 z-0 lg:hidden pointer-events-none">
        <img
          src="/hero-model.jpg"
          alt="SS'26 Model"
          className="w-full h-full object-cover object-bottom filter opacity-40 brightness-[0.7] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/80" />
      </div>

      <AmbientCursor containerRef={sectionRef} />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ba1f3d 0.5px, transparent 0.5px)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="relative z-20 h-full max-w-[1920px] mx-auto px-6 md:px-12 lg:px-20">
        <div className="h-full flex flex-col lg:grid lg:grid-cols-12 lg:gap-10">
          
          {/* CONTENT PANEL */}
          <div 
            ref={contentRef}
            className="flex-grow flex flex-col justify-center items-center text-center lg:items-start lg:text-left pt-[100px] lg:pt-0 lg:col-span-6 xl:col-span-7"
          >
            {/* Season Tag */}
            <div data-anime className="flex items-center gap-2 mb-6" style={{ opacity: 0 }}>
              <span className="w-6 h-px bg-[#ba1f3d] hidden lg:block" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ba1f3d]">
                Pakistan's Premium Fashion Hub · SS '26
              </span>
            </div>

            {/* Headline */}
            <h1 
              data-anime
              className="text-white font-black uppercase leading-[0.88] tracking-[-0.03em] mb-6"
              style={{ opacity: 0, fontSize: 'clamp(2.5rem, 8vw, 6rem)' }}
            >
              The New<br />
              <span className="text-transparent" style={{ WebkitTextStroke: '1px #ba1f3d' }}>Standard</span><br />
              of Streetwear.
            </h1>

            {/* Body */}
            <p 
              data-anime
              className="text-gray-300 text-sm md:text-base lg:text-lg leading-relaxed max-w-sm lg:max-w-md mb-8 font-medium"
              style={{ opacity: 0 }}
            >
              Elite fabrics. Bold designs. We don't just sell clothes; we build your identity. 
              Join 2,000+ trendsetters who make their own rules.
            </p>

            {/* Main Action */}
            <div data-anime className="flex w-full sm:w-auto mb-10" style={{ opacity: 0 }}>
              <button
                onClick={scrollToGrid}
                className="group relative flex-grow sm:flex-grow-0 flex items-center justify-center gap-5 px-10 py-4 lg:px-12 lg:py-5 bg-[#ba1f3d] text-white text-[11px] lg:text-[12px] font-black uppercase tracking-[0.35em] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_rgba(186,31,61,0.4)] active:scale-95"
              >
                <span className="relative z-10">Shop Selection</span>
                <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </button>
            </div>

            {/* Identity Pillars (Horizontal on Mobile) */}
            <div data-anime className="flex flex-row justify-center lg:justify-start gap-6 lg:gap-10 pt-8 border-t border-white/5 w-full lg:w-auto" style={{ opacity: 0 }}>
              {IDENTITY_PILLARS.map((item) => (
                <div key={item.label} className="flex flex-col items-center lg:items-start lg:flex-row gap-2 lg:gap-3 group">
                  <div className="p-2 rounded bg-white/5 border border-white/5 group-hover:border-[#ba1f3d]/30 transition-colors">
                    <item.icon size={12} className="text-[#ba1f3d]" />
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-[8px] lg:text-[10px] font-black text-white uppercase tracking-wider">{item.label}</p>
                    <p className="text-[7px] lg:text-[9px] text-gray-500 font-bold mt-0.5 hidden sm:block">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DESKTOP IMAGE PANEL */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-5 relative h-full overflow-hidden items-center justify-end">
             <div className="relative w-[110%] h-[75%] rounded-sm bg-[#0a0a0a] overflow-hidden group shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <img
                  src="/hero-model.jpg"
                  alt="SS'26 Model Prada Jacket"
                  className="w-full h-full object-cover object-bottom filter brightness-[0.95] contrast-[1.05] group-hover:scale-105 transition-transform duration-[4s]"
                />
                
                {/* Desktop High-Trust Tag */}
                <div className="absolute top-8 right-8 z-20 bg-black/50 backdrop-blur-xl border border-white/10 px-6 py-4 text-right">
                  <p className="text-[8px] font-black text-[#ba1f3d] uppercase tracking-[0.5em]">New Season</p>
                  <p className="text-3xl font-black text-white uppercase tracking-tighter mt-1">SS '26</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PowerOfChoiceHero;
