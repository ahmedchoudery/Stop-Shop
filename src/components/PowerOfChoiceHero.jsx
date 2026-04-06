/**
 * @fileoverview PowerOfChoiceHero — Final Premium Refinement
 * Tone: Easy but weighty. Policy: No guarantees. Layout: Clean & Balanced.
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

  const IDENTITY_PILLARS = [
    { icon: ShieldCheck, label: 'Highest Luxury', sub: 'Imported Elite Fabrics' },
    { icon: Zap,         label: 'Bold Identity', sub: 'Worn by Leaders' },
    { icon: Star,        label: 'Trend Shapers', sub: '2,000+ Verified Customers' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#080808] overflow-hidden"
      style={{ height: '100dvh' }}
    >
      <AmbientCursor containerRef={sectionRef} />

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ba1f3d 0.5px, transparent 0.5px)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="relative z-20 h-full flex flex-col lg:grid lg:grid-cols-12 max-w-[1920px] mx-auto">
        
        {/* CONTENT PANEL */}
        <div 
          ref={contentRef}
          className="lg:col-span-6 flex flex-col justify-center px-6 md:px-12 lg:px-20 pt-[80px] lg:pt-[100px] pb-10 lg:pb-0 order-2 lg:order-1"
        >
          <div data-anime className="flex items-center gap-3 mb-6" style={{ opacity: 0 }}>
            <span className="w-10 h-px bg-[#ba1f3d]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ba1f3d]">
              Pakistan's Premium Fashion Hub · SS '26
            </span>
          </div>

          <h1 
            data-anime
            className="text-white font-black uppercase leading-[0.85] tracking-[-0.03em] mb-6"
            style={{ opacity: 0, fontSize: 'clamp(2.8rem, 8vw, 6rem)' }}
          >
            The New<br />
            <span className="text-transparent" style={{ WebkitTextStroke: '1.5px #ba1f3d' }}>Standard</span><br />
            of Streetwear.
          </h1>

          <p 
            data-anime
            className="text-gray-400 text-sm md:text-base lg:text-xl leading-relaxed max-w-lg mb-10 font-medium"
            style={{ opacity: 0 }}
          >
            Elite fabrics. Bold designs. We don't just sell clothes; we build your identity. 
            Join 2,000+ trendsetters who make their own rules.
          </p>

          <div data-anime className="flex mb-12" style={{ opacity: 0 }}>
            <button
              onClick={scrollToGrid}
              className="group relative flex items-center justify-center gap-5 px-12 py-5 bg-[#ba1f3d] text-white text-[12px] font-black uppercase tracking-[0.35em] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_rgba(186,31,61,0.4)] active:scale-95"
            >
              <span className="relative z-10">Shop Selection</span>
              <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            </button>
          </div>

          <div data-anime className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-10 border-t border-white/5" style={{ opacity: 0 }}>
            {IDENTITY_PILLARS.map((item) => (
              <div key={item.label} className="flex items-start gap-3 group">
                <div className="p-2.5 rounded bg-white/5 border border-white/5 group-hover:border-[#ba1f3d]/30 transition-colors">
                  <item.icon size={16} className="text-[#ba1f3d]" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-wider">{item.label}</p>
                  <p className="text-[9px] text-gray-500 font-bold mt-1 tracking-wide">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* IMAGE PANEL */}
        <div className="lg:col-span-6 relative h-[50vh] lg:h-full order-1 lg:order-2 overflow-hidden">
          <div className="absolute inset-0 lg:p-12 lg:my-10">
            <div className="relative w-full h-full overflow-hidden rounded-sm bg-[#0a0a0a]">
              <img
                src="/hero-model.jpg"
                alt="SS'26 Model Prada Jacket"
                className="w-full h-full object-cover object-bottom filter brightness-[0.9] contrast-[1.05] group-hover:scale-105 transition-transform duration-[3s]"
              />
              
              {/* Fade for mobile integration */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-80 lg:hidden" />
              
              {/* New Season Badge */}
              <div className="absolute top-5 right-5 lg:top-10 lg:right-10 z-20 bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-4 text-right">
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
