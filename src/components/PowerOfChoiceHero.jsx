/**
 * @fileoverview PowerOfChoiceHero — Premium Retail Hero
 * Redesigned for maximum trust, clarity, and professional organization.
 * Features: Header-clearance padding, balanced grid, and high-trust branding.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import { ArrowRight, ShoppingBag, Star, RotateCcw, ShieldCheck } from 'lucide-react';
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
      className="absolute pointer-events-none z-10 w-[600px] h-[600px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(186,31,61,0.04) 0%, transparent 60%)',
        top: 0, left: 0,
        willChange: 'transform',
      }}
    />
  );
};

const PowerOfChoiceHero = () => {
  const sectionRef  = useRef(null);
  const contentRef  = useRef(null);

  // ── Entrance animations ───────────────────────────────────────
  useEffect(() => {
    if (!contentRef.current) return;
    const items = contentRef.current.querySelectorAll('[data-anime]');
    anime.set(items, { opacity: 0, translateY: 30 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateY: [30, 0],
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

  const TRUST_ITEMS = [
    { icon: ShieldCheck, label: 'Premium Quality', sub: 'Imported Fabrics' },
    { icon: RotateCcw,  label: 'Easy Returns',    sub: '30-Day Policy' },
    { icon: Star,        label: 'Top Rated',       sub: '2,000+ Reviews' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#080808] overflow-hidden"
      style={{ height: '100dvh' }}
    >
      <AmbientCursor containerRef={sectionRef} />

      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ba1f3d 0.5px, transparent 0.5px)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="relative z-20 h-full flex flex-col lg:grid lg:grid-cols-12 max-w-[1920px] mx-auto">
        
        {/* LEFT: CONTENT PANEL */}
        <div 
          ref={contentRef}
          className="lg:col-span-6 flex flex-col justify-center px-6 md:px-12 lg:px-20 pt-[110px] lg:pt-[140px] pb-10 lg:pb-0 order-2 lg:order-1"
        >
          {/* Badge */}
          <div data-anime className="flex items-center gap-3 mb-6" style={{ opacity: 0 }}>
            <span className="w-10 h-px bg-[#ba1f3d]" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ba1f3d]">
              Pakistan's Premium Streetwear · SS '26
            </span>
          </div>

          {/* Headline */}
          <h1 
            data-anime
            className="text-white font-black uppercase leading-[0.85] tracking-[-0.03em] mb-6"
            style={{ opacity: 0, fontSize: 'clamp(3rem, 8vw, 6.5rem)' }}
          >
            Define<br />
            <span className="text-transparent" style={{ WebkitTextStroke: '1.5px #ba1f3d' }}>Your</span><br />
            Look.
          </h1>

          {/* Body */}
          <p 
            data-anime
            className="text-gray-400 text-sm md:text-base lg:text-lg leading-relaxed max-w-lg mb-10"
            style={{ opacity: 0 }}
          >
            Meticulously crafted apparel for those who lead, not follow. 
            Blending international luxury with local streetwear culture.
          </p>

          {/* Actions */}
          <div data-anime className="flex flex-col sm:flex-row gap-4 mb-12" style={{ opacity: 0 }}>
            <button
              onClick={scrollToGrid}
              className="group relative flex items-center justify-center gap-4 px-10 py-4 bg-[#ba1f3d] text-white text-[11px] font-black uppercase tracking-[0.3em] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgba(186,31,61,0.3)] active:scale-95"
            >
              <span className="relative z-10">Shop Collection</span>
              <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            </button>

            <button
              onClick={scrollToGrid}
              className="group flex items-center justify-center gap-3 px-10 py-4 border border-white/10 text-gray-400 text-[11px] font-black uppercase tracking-[0.3em] hover:text-white hover:border-white transition-all duration-300 active:scale-95"
            >
              <ShoppingBag size={14} />
              <span>View Lookbook</span>
            </button>
          </div>

          {/* Trust Strip */}
          <div data-anime className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-white/5" style={{ opacity: 0 }}>
            {TRUST_ITEMS.map((item) => (
              <div key={item.label} className="flex items-start gap-3 group">
                <div className="p-2 rounded bg-white/5 border border-white/5 group-hover:border-[#ba1f3d]/30 transition-colors">
                  <item.icon size={14} className="text-[#ba1f3d]" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-wider">{item.label}</p>
                  <p className="text-[9px] text-gray-500 font-bold mt-1">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: IMAGE PANEL */}
        <div className="lg:col-span-6 relative h-[45vh] lg:h-full order-1 lg:order-2 overflow-hidden">
          {/* Framed Image Container */}
          <div className="absolute inset-0 lg:inset-10 lg:my-20">
            <div className="relative w-full h-full overflow-hidden rounded-sm group">
              <img
                src="/hero-model.jpg"
                alt="SS'26 Model Prada Jacket"
                className="w-full h-full object-cover object-top filter brightness-[0.85] contrast-[1.05] group-hover:scale-105 transition-transform duration-[2s] ease-out"
              />
              
              {/* Overlays for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-60 lg:hidden" />
              <div className="absolute inset-x-0 bottom-0 py-6 px-8 lg:hidden flex justify-between items-end z-20">
                <div className="text-right">
                  <p className="text-[8px] font-black text-[#ba1f3d] uppercase tracking-widest">New Season</p>
                  <p className="text-2xl font-black text-white uppercase tracking-tighter">SS '26</p>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Corner Brackets (Desktop) */}
          <div className="absolute top-10 right-10 hidden lg:block opacity-20">
            <div className="w-12 h-12 border-t-2 border-r-2 border-[#ba1f3d]" />
          </div>
          <div className="absolute bottom-10 left-10 hidden lg:block opacity-10">
            <div className="w-12 h-12 border-b-2 border-l-2 border-white" />
          </div>
        </div>
      </div>

      {/* Floating Badge (Desktop) */}
      <div className="absolute bottom-12 right-12 hidden xl:flex items-center gap-4 z-30 opacity-40">
        <div className="h-px w-12 bg-white" />
        <span className="text-[8px] font-black text-white uppercase tracking-[1em] rotate-180" style={{ writingMode: 'vertical-rl' }}>
          Stop & Shop Est. 2024
        </span>
      </div>
    </section>
  );
};

export default PowerOfChoiceHero;
