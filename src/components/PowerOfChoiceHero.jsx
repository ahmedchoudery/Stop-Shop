/**
 * @fileoverview PowerOfChoiceHero — Premium Menswear Editorial Hero
 * Theme: Eyebrow neutral, dot pattern white, CTA + headline accent word stays red.
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
      delay: anime.stagger(120, { start: 300 }),
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
      className="relative bg-[#080808] overflow-hidden w-full flex flex-col lg:h-[100dvh]"
      style={{ minHeight: '100dvh' }}
    >
      {/* ── BACKGROUND ──────────────────────────────────────────── */}
      <div className="absolute left-0 right-0 bottom-0 top-[110px] lg:top-[120px] z-0">
        <div className="relative w-full h-full">
          <img
            src="/hero-models-duo.jpg"
            alt="SS'26 Collection"
            className="w-full h-full object-cover lg:object-contain lg:object-right object-[center_20%]"
            loading="eager"
          />
          {/* Desktop left mask */}
          <div className="hidden lg:block absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#080808] via-[#080808]/80 to-transparent z-10" />
          {/* Mobile bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-[60%] lg:h-48 bg-gradient-to-t from-[#080808] via-[#080808]/80 to-transparent z-10" />
          {/* Top mask */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#080808] to-transparent z-10" />
        </div>
      </div>

      {/* ── Dot pattern — subtle white ───────────────────────────── */}
      <div
        className="absolute inset-0 z-20 opacity-[0.012] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ffffff 0.5px, transparent 0.5px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="relative z-30 flex-1 w-full max-w-[1920px] mx-auto flex flex-col pt-[110px] lg:pt-[130px] pb-10 lg:pb-0">

        {/* Mobile: season tag */}
        <div className="w-full px-6 flex justify-center lg:hidden mt-4">
          <span className="text-[10px] font-black uppercase tracking-[0.45em] text-white/30 text-center">
            Pakistan's Premium Fashion Hub · SS '26
          </span>
        </div>

        <div className="w-full flex-grow flex flex-col justify-center px-6 md:px-12 lg:px-20">
          <div ref={contentRef} className="max-w-4xl flex flex-col items-start text-left">

            {/* Desktop: season tag */}
            <div data-anime className="hidden lg:flex items-center gap-3 mb-8" style={{ opacity: 0 }}>
              <span className="w-8 h-px bg-white/20" />
              <span className="text-[10px] font-black uppercase tracking-[0.45em] text-white/30">
                Pakistan's Premium Fashion Hub · SS '26
              </span>
            </div>

            {/* Headline — one red word stays (hero-level emphasis is correct) */}
            <h1
              data-anime
              className="text-white font-black uppercase leading-[1.2] lg:leading-[0.88] tracking-[-0.03em] mb-6 lg:mb-8 text-[1.85rem] md:text-[2.6rem] lg:text-[clamp(2.4rem,7vw,4.3rem)]"
              style={{ opacity: 0 }}
            >
              The New<br />
              <span className="text-[#ba1f3d]">Standard</span><br />
              of Streetwear.
            </h1>

            {/* Sub-copy */}
            <p
              data-anime
              className="text-white/50 text-xs md:text-sm lg:text-xl leading-relaxed max-w-[280px] md:max-w-md lg:max-w-xl mb-8 lg:mb-10 font-medium"
              style={{ opacity: 0, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
            >
              Elite fabrics. Bold designs. We don't just sell clothes — we build your identity.
              Join 2,000+ trendsetters who make their own rules.
            </p>

            {/* CTA — stays red (hero primary action) */}
            <div data-anime className="flex w-full sm:w-auto mb-12 lg:mb-14" style={{ opacity: 0 }}>
              <button
                onClick={scrollToGrid}
                className="group relative flex-grow sm:flex-grow-0 flex items-center justify-center gap-5 px-14 py-5 bg-[#ba1f3d] text-white text-[12px] lg:text-[13px] font-black uppercase tracking-[0.4em] overflow-hidden transition-all duration-300 hover:brightness-110 active:scale-95"
              >
                <span className="relative z-10">Shop Collection</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1.5 transition-transform" />
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </button>
            </div>

            {/* ── Credibility Stats ──────────────────────────────── */}
            <div
              data-anime
              className="flex items-center gap-8 sm:gap-12 pt-8 border-t border-white/10"
              style={{ opacity: 0 }}
            >
              {[
                { stat: '2,000+', label: 'Happy Customers' },
                { stat: '500+',   label: 'Premium Pieces' },
                { stat: '4.9★',   label: 'Average Rating' },
              ].map(({ stat, label }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-xl lg:text-2xl font-black text-white tracking-tight leading-none">
                    {stat}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.35em] text-white/30 mt-1.5">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PowerOfChoiceHero;
