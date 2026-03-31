/**
 * @fileoverview PowerOfChoiceHero — Fashion-forward hero with clothing 3D
 * Fix: replaced require('animejs') with ESM import — entrance animations are now functional
 * Applies: animejs-animation (spring timeline, stagger entrance),
 *          design-spells (fabric motion, magnetic CTA),
 *          3d-web-experience (purposeful clothing 3D, mobile fallback)
 */

import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import { ArrowRight } from 'lucide-react';
import ClothingHeroScene from './ClothingHeroScene.jsx';
import { useAnimeMagnetic } from '../hooks/useAnime.js';
import { EASING } from '../hooks/useAnime.js';

const PowerOfChoiceHero = () => {
  const containerRef = useRef(null);
  const badgeRef = useRef(null);
  const lineRef = useRef(null);
  const ctaRef = useAnimeMagnetic(0.35, 100);

  useEffect(() => {
    // Set initial hidden state
    const items = containerRef.current?.querySelectorAll('[data-anime]');
    if (!items?.length) return;

    anime.set(items, { opacity: 0, translateY: 80 });
    anime.set(badgeRef.current, { opacity: 0, translateX: 40 });
    anime.set(lineRef.current, { scaleX: 0, transformOrigin: 'left center' });

    // Master timeline — fabric settling choreography
    const tl = anime.timeline({ easing: EASING.FABRIC });

    tl
      // 1. Red accent line draws first
      .add({
        targets: lineRef.current,
        scaleX: [0, 1],
        duration: 600,
        easing: EASING.QUART_OUT,
      })
      // 2. Headline words stagger in with expo easing
      .add({
        targets: items,
        translateY: [80, 0],
        opacity: [0, 1],
        duration: 1100,
        delay: anime.stagger(120),
        easing: EASING.FABRIC,
      }, '-=300')
      // 3. Badge slides in from right
      .add({
        targets: badgeRef.current,
        translateX: [60, 0],
        opacity: [0, 1],
        duration: 900,
        easing: EASING.SPRING,
      }, '-=800');

    return () => tl.pause();
  }, []);

  return (
    <section className="relative overflow-hidden bg-white text-gray-900 border-b border-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[90vh]">

        {/* ── Text Column ─────────────────────────────────────── */}
        <div className="lg:col-span-7 flex flex-col justify-center px-8 py-24 md:px-16 lg:px-24 bg-white z-20 relative">
          <div ref={containerRef} className="max-w-2xl">

            {/* Accent line + label */}
            <div className="flex items-center space-x-4 mb-10 overflow-hidden">
              <div
                ref={lineRef}
                className="w-10 h-[2px] bg-[#ba1f3d]"
                style={{ willChange: 'transform' }}
              />
              <span
                data-anime
                className="text-[10px] font-black uppercase tracking-[0.6em] text-[#ba1f3d]"
                style={{ opacity: 0, willChange: 'transform, opacity' }}
              >
                Supreme Elegance · Pakistan Edition
              </span>
            </div>

            {/* Main headline — split for stagger */}
            <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-black leading-[0.8] tracking-tighter mb-10 uppercase">
              <span
                data-anime
                className="block text-gray-900"
                style={{ opacity: 0, willChange: 'transform, opacity' }}
              >
                The Power
              </span>
              <span
                data-anime
                className="block text-transparent"
                style={{
                  WebkitTextStroke: '2px #ba1f3d',
                  opacity: 0,
                  willChange: 'transform, opacity'
                }}
              >
                Of Choice
              </span>
            </h1>

            {/* Subheading */}
            <p
              data-anime
              className="text-gray-500 text-xl font-medium leading-relaxed mb-12 max-w-lg"
              style={{ opacity: 0, willChange: 'transform, opacity' }}
            >
              Define your own standard of excellence. Our bespoke collections are tailored for the modern Pakistani trendsetter.
            </p>

            {/* CTAs */}
            <div
              data-anime
              className="flex flex-wrap gap-6 items-center"
              style={{ opacity: 0, willChange: 'transform, opacity' }}
            >
              {/* Magnetic primary CTA */}
              <a
                ref={ctaRef}
                href="#trending"
                className="group relative px-10 py-5 bg-[#ba1f3d] text-white text-xs font-black uppercase tracking-[0.3em] flex items-center shadow-[0_20px_40px_rgba(186,31,61,0.25)] hover:shadow-[0_28px_56px_rgba(186,31,61,0.35)] transition-shadow duration-500"
                style={{ willChange: 'transform' }}
              >
                <span className="relative z-10">Discover Collection</span>
                <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-2 transition-transform duration-300 relative z-10" />
                {/* Shimmer overlay */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              </a>

              <button className="px-10 py-5 border-2 border-gray-900 text-gray-900 text-xs font-black uppercase tracking-[0.3em] hover:bg-gray-900 hover:text-white transition-all duration-500">
                Lookbook
              </button>
            </div>

            {/* Trust badges */}
            <div
              data-anime
              className="flex items-center space-x-8 mt-12 pt-8 border-t border-gray-100"
              style={{ opacity: 0, willChange: 'transform, opacity' }}
            >
              {['Free Delivery', 'Premium Quality', 'Easy Returns'].map(badge => (
                <div key={badge} className="flex items-center space-x-2">
                  <span className="w-1 h-1 rounded-full bg-[#ba1f3d]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                    {badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 3D Clothing Scene Column ─────────────────────────── */}
        <div className="lg:col-span-5 relative h-[70vh] lg:h-full overflow-hidden bg-[#0d0810]">

          {/* The clothing 3D scene */}
          <div className="absolute inset-0 z-0">
            <ClothingHeroScene />
          </div>

          {/* Gradient fade on left edge */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/20 lg:block hidden z-10 pointer-events-none" />

          {/* Floating Collection Badge */}
          <div
            ref={badgeRef}
            className="absolute bottom-10 right-8 bg-white/10 backdrop-blur-md border border-white/20 text-white p-7 shadow-2xl z-20"
            style={{ opacity: 0, willChange: 'transform, opacity' }}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FBBF24] mb-1">
              New Season
            </p>
            <p className="text-2xl font-black leading-none uppercase tracking-tighter mb-1">
              SS '26
            </p>
            <p className="text-2xl font-black leading-none uppercase tracking-tighter mb-2">
              Collection
            </p>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">
              Now Available
            </p>
          </div>

          {/* Corner decoration */}
          <div className="absolute top-8 left-8 z-10 opacity-30">
            <div className="w-8 h-8 border-t-2 border-l-2 border-white/60" />
          </div>
          <div className="absolute bottom-8 right-8 z-10 opacity-30" style={{ marginBottom: '120px' }}>
            <div className="w-8 h-8 border-b-2 border-r-2 border-white/20" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PowerOfChoiceHero;
