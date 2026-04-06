/**
 * @fileoverview PowerOfChoiceHero — Premium Full-Screen Hero
 * Design: Full-viewport dark hero with crisp model photography,
 *         clean trust-building layout, subtle cursor glow effect.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import { ArrowRight, ShoppingBag, Star, RotateCcw, CreditCard } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';

// ─────────────────────────────────────────────────────────────────
// SUBTLE AMBIENT CURSOR GLOW
// ─────────────────────────────────────────────────────────────────
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
      className="absolute pointer-events-none z-10 w-[700px] h-[700px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(186,31,61,0.05) 0%, transparent 65%)',
        top: 0, left: 0,
        willChange: 'transform',
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN HERO COMPONENT
// ─────────────────────────────────────────────────────────────────
const PowerOfChoiceHero = () => {
  const sectionRef  = useRef(null);
  const contentRef  = useRef(null);

  // ── Entrance animations ───────────────────────────────────────
  useEffect(() => {
    if (!contentRef.current) return;
    const items = contentRef.current.querySelectorAll('[data-anime]');
    anime.set(items, { opacity: 0, translateY: 40 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateY: [40, 0],
      duration: 900,
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

  const TRUST = [
    { icon: Star,       label: 'Premium Quality',   sub: 'Hand-picked fabrics' },
    { icon: RotateCcw,  label: 'Easy Returns',       sub: '30-day policy' },
    { icon: CreditCard, label: 'Secure Checkout',    sub: 'EasyPaisa · JazzCash · COD' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#0a0a0a] overflow-hidden"
      style={{ height: '100dvh', minHeight: '600px' }}
    >
      {/* Ambient cursor glow */}
      <AmbientCursor containerRef={sectionRef} />

      {/* Subtle noise grain texture */}
      <div
        className="absolute inset-0 z-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px 180px',
        }}
      />

      {/* ── MAIN LAYOUT: Split screen ──────────────────────────── */}
      <div className="relative z-20 h-full flex flex-col lg:grid lg:grid-cols-2">

        {/* ── LEFT TEXT PANEL ─────────────────────────────────── */}
        <div
          ref={contentRef}
          className="flex flex-col justify-center px-8 md:px-14 lg:px-16 pt-8 pb-6 lg:py-0 order-2 lg:order-1 relative"
        >

          {/* ── Season tag ── */}
          <div data-anime className="flex items-center gap-3 mb-6" style={{ opacity: 0 }}>
            <div className="w-8 h-[1px] bg-[#ba1f3d]" />
            <span className="text-[9px] font-black uppercase tracking-[0.55em] text-[#ba1f3d]">
              SS '26 · Pakistan Edition
            </span>
          </div>

          {/* ── Headline ── */}
          <h1
            data-anime
            className="font-black uppercase leading-[0.88] tracking-[-0.02em] text-white mb-5"
            style={{ opacity: 0, fontSize: 'clamp(2.8rem, 7vw, 7rem)' }}
          >
            Define<br />
            <span style={{ WebkitTextStroke: '1.5px #ba1f3d', color: 'transparent' }}>Your</span><br />
            Look.
          </h1>

          {/* ── Sub-copy ── */}
          <p
            data-anime
            className="text-gray-400 text-[0.9rem] md:text-base leading-relaxed mb-8 max-w-md"
            style={{ opacity: 0 }}
          >
            Premium streetwear crafted for the modern Pakistani trendsetter.
            Bold styles. Unmatched quality. Always on trend.
          </p>

          {/* ── CTAs ── */}
          <div data-anime className="flex flex-col sm:flex-row gap-3 mb-10" style={{ opacity: 0 }}>
            <button
              onClick={scrollToGrid}
              className="group relative flex items-center justify-center gap-3 px-8 py-[14px] bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-[0.3em] overflow-hidden transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(186,31,61,0.4)]"
            >
              <span className="relative z-10">Shop Collection</span>
              <ArrowRight size={13} className="relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-600 ease-out" />
            </button>

            <button
              onClick={scrollToGrid}
              className="group flex items-center justify-center gap-2.5 px-8 py-[14px] border border-gray-700 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-white hover:border-gray-500 transition-all duration-300"
            >
              <ShoppingBag size={13} className="group-hover:scale-105 transition-transform" />
              <span>View Lookbook</span>
            </button>
          </div>

          {/* ── Trust badges ── */}
          <div data-anime className="flex flex-col gap-3" style={{ opacity: 0 }}>
            <p className="text-[8.5px] font-black uppercase tracking-[0.5em] text-gray-600 mb-1">Why Stop & Shop</p>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {TRUST.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-2.5 group">
                  <div className="w-7 h-7 rounded-sm bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 group-hover:border-[#ba1f3d]/40 transition-colors duration-300">
                    <Icon size={12} className="text-[#ba1f3d]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 leading-none">{label}</p>
                    <p className="text-[8px] text-gray-600 font-medium mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom bar: social proof ── */}
          <div data-anime className="mt-auto pt-8 border-t border-white/5 hidden lg:flex items-center gap-6" style={{ opacity: 0 }}>
            <div className="flex -space-x-2">
              {['F', 'A', 'M', 'Z'].map((l) => (
                <div key={l} className="w-7 h-7 rounded-full bg-gray-800 border-2 border-[#0a0a0a] flex items-center justify-center">
                  <span className="text-[7px] font-black text-gray-400">{l}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5 mb-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} size={9} className="fill-[#ba1f3d] text-[#ba1f3d]" />)}
              </div>
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Trusted by 2,000+ customers</p>
            </div>
          </div>
        </div>

        {/* ── RIGHT IMAGE PANEL ─────────────────────────────────── */}
        <div className="relative order-1 lg:order-2 h-[48vh] lg:h-full overflow-hidden">

          {/* Model image — full bleed, no 3D transforms that could cause glitch */}
          <img
            src="/hero-model.jpg"
            alt="Stop & Shop SS'26 Fashion Model — Prada Jacket"
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ filter: 'brightness(0.88) contrast(1.06) saturate(0.92)' }}
            loading="eager"
          />

          {/* Left edge fade into dark panel */}
          <div
            className="absolute inset-0 pointer-events-none hidden lg:block"
            style={{ background: 'linear-gradient(to right, #0a0a0a 0%, transparent 30%)' }}
          />

          {/* Bottom fade for mobile */}
          <div
            className="absolute inset-0 pointer-events-none lg:hidden"
            style={{ background: 'linear-gradient(to top, #0a0a0a 0%, transparent 40%)' }}
          />

          {/* Top fade for mobile */}
          <div
            className="absolute inset-0 pointer-events-none lg:hidden"
            style={{ background: 'linear-gradient(to bottom, #0a0a0a 0%, transparent 20%)' }}
          />

          {/* ── SS '26 badge ── */}
          <div className="absolute top-5 right-5 lg:top-8 lg:right-8 z-20 bg-[#ba1f3d]/90 backdrop-blur-md px-4 py-3 text-right">
            <p className="text-[7px] font-black uppercase tracking-[0.5em] text-white/70">New Season</p>
            <p className="text-xl font-black uppercase tracking-tighter text-white leading-none mt-0.5">SS '26</p>
          </div>

          {/* Corner bracket detail */}
          <div className="absolute bottom-5 left-5 lg:bottom-8 lg:left-8 z-20 opacity-30 pointer-events-none">
            <div className="w-5 h-5 border-b border-l border-white" />
          </div>
        </div>
      </div>

      {/* ── Scroll cue ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 hidden lg:flex flex-col items-center gap-2 opacity-30">
        <span className="text-[7px] font-black uppercase tracking-[0.7em] text-white">Scroll</span>
        <div className="w-px h-6 bg-white animate-pulse" />
      </div>
    </section>
  );
};

export default PowerOfChoiceHero;
