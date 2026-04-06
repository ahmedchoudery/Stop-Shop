/**
 * @fileoverview PowerOfChoiceHero — Luxury Editorial Hero Section
 * Design: Full-bleed dark cinematic hero with 3D parallax cursor effects,
 *         ambient glow cursor, floating brand labels, and editorial typography.
 * Replaces: Abstract THREE.js fabric scene → High-fashion editorial image
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import anime from 'animejs';
import { ArrowRight, ShoppingBag, Star, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EASING } from '../hooks/useAnime.js';

// ─────────────────────────────────────────────────────────────────
// AMBIENT GLOW CURSOR
// Follows mouse with a soft light-scatter blob
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

    const animate = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(animate);
    };

    el.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(animate);
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
        background: 'radial-gradient(circle, rgba(186,31,61,0.06) 0%, rgba(186,31,61,0.02) 40%, transparent 70%)',
        top: 0,
        left: 0,
        willChange: 'transform',
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────
// FLOATING BRAND LABEL
// ─────────────────────────────────────────────────────────────────

const FloatingLabel = ({ children, className, delay = 0, style = {} }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    anime.set(ref.current, { opacity: 0, translateY: 20 });
    anime({
      targets: ref.current,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 900,
      delay,
      easing: EASING.FABRIC,
    });
  }, [delay]);

  return (
    <div ref={ref} className={`absolute z-30 ${className}`} style={style}>
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN HERO COMPONENT
// ─────────────────────────────────────────────────────────────────

const PowerOfChoiceHero = () => {
  const sectionRef = useRef(null);
  const modelContainerRef = useRef(null);
  const textRef = useRef(null);
  const handleMouseMove = useCallback((e) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;   // -1 to 1
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;  // -1 to 1

    if (modelContainerRef.current) {
      modelContainerRef.current.style.transform = `
        perspective(1200px)
        rotateY(${x * 5}deg)
        rotateX(${-y * 4}deg)
        translateZ(0px)
      `;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (modelContainerRef.current) {
      modelContainerRef.current.style.transform = `
        perspective(1200px) rotateY(0deg) rotateX(0deg) translateZ(0)
      `;
    }
  }, []);

  // ── Entrance animations ───────────────────────────────────────
  useEffect(() => {
    if (!textRef.current) return;
    const items = textRef.current.querySelectorAll('[data-anime]');
    anime.set(items, { opacity: 0, translateY: 60 });

    anime({
      targets: items,
      opacity: [0, 1],
      translateY: [60, 0],
      duration: 1100,
      delay: anime.stagger(120, { start: 300 }),
      easing: EASING.FABRIC,
    });
  }, []);

  const scrollToGrid = useCallback(() => {
    const el = document.getElementById('product-grid');
    if (el) {
      const offset = 80; // Account for fixed header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#050505] min-h-screen flex items-center pt-24 lg:pt-0"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ambient cursor glow */}
      <AmbientCursor containerRef={sectionRef} />

      {/* ── Background texture: subtle noise grain ──────────── */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* ── Diagonal accent light ────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 60% 80% at 70% 50%, rgba(186,31,61,0.07) 0%, transparent 70%)',
        }}
      />

      {/* ── Main Grid ─────────────────────────────────────────── */}
      <div className="relative z-20 w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen">

        {/* ── LEFT: Editorial Text Column ───────────────────── */}
        <div
          ref={textRef}
          className="lg:col-span-5 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-16 order-2 lg:order-1 relative z-20"
        >

          {/* Pre-label */}
          <div data-anime className="flex items-center space-x-3 mb-6 md:mb-8" style={{ opacity: 0 }}>
            <div className="w-6 md:w-8 h-px bg-[#ba1f3d]" />
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] md:tracking-[0.6em] text-[#ba1f3d]">
              SS '26 · Pakistan Edition
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-black uppercase leading-[0.85] tracking-tighter mb-6 md:mb-8 text-white">
            <span
              data-anime
              className="block text-[3.5rem] md:text-[6rem] lg:text-[8rem] xl:text-[9.5rem]"
              style={{ opacity: 0 }}
            >
              Define
            </span>
            <span
              data-anime
              className="block text-[3.5rem] md:text-[6rem] lg:text-[8rem] xl:text-[9.5rem] mt-[-0.5rem] md:mt-[-1rem]"
              style={{
                opacity: 0,
                WebkitTextStroke: '1px #ba1f3d',
                color: 'transparent',
              }}
            >
              Your
            </span>
            <span
              data-anime
              className="block text-[3.5rem] md:text-[6rem] lg:text-[8rem] xl:text-[9.5rem] text-white mt-[-0.5rem] md:mt-[-1rem]"
              style={{ opacity: 0 }}
            >
              Look.
            </span>
          </h1>

          {/* Sub-copy */}
          <p
            data-anime
            className="text-gray-500 text-sm md:text-base lg:text-lg font-medium leading-relaxed mb-8 md:mb-10 max-w-sm lg:max-w-md mx-auto lg:mx-0 text-center lg:text-left"
            style={{ opacity: 0 }}
          >
            Curated premium streetwear for the modern Pakistani trendsetter. Unmatched quality. Zero compromise.
          </p>

          {/* CTAs */}
          <div data-anime className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start mb-10 md:mb-12" style={{ opacity: 0 }}>
            <button
              onClick={scrollToGrid}
              className="w-full sm:w-auto group relative flex items-center justify-center space-x-3 px-8 py-4 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-[0.3em] overflow-hidden hover:shadow-[0_20px_40px_rgba(186,31,61,0.35)] transition-shadow duration-500"
            >
              <span className="relative z-10">Shop Collection</span>
              <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1.5 transition-transform duration-300" />
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            </button>

            <button
              onClick={scrollToGrid}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors duration-300 group px-8 py-4 border border-transparent hover:border-gray-800"
            >
              <ShoppingBag size={14} className="group-hover:scale-110 transition-transform duration-300" />
              <span>View Lookbook</span>
            </button>
          </div>

          {/* Trust strip */}
          <div data-anime className="hidden sm:flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6" style={{ opacity: 0 }}>
            {[
              { icon: Package, label: 'Free Delivery' },
              { icon: Star, label: 'Premium Quality' },
              { icon: ShoppingBag, label: 'Easy Returns' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center space-x-2 group">
                <Icon size={11} className="text-[#ba1f3d] group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 group-hover:text-gray-400 transition-colors">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Model Image with 3D Parallax ──────────────── */}
        <div className="lg:col-span-7 relative h-[70vh] lg:h-screen order-1 lg:order-2 overflow-hidden">

          {/* 3D Parallax Container */}
          <div
            ref={modelContainerRef}
            className="absolute inset-0"
            style={{
              transition: 'transform 0.12s linear',
              willChange: 'transform',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Model image */}
            <img
              src="/hero-model.jpg"
              alt="Stop & Shop SS'26 Editorial — Man in Prada Jacket"
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{ filter: 'brightness(0.85) contrast(1.08) saturate(0.95)' }}
              loading="eager"
            />

            {/* Vignette bottom fade */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, #050505 0%, transparent 40%), linear-gradient(to right, #050505 0%, transparent 30%)',
              }}
            />

            {/* Subtle red light overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 50% 60% at 20% 90%, rgba(186,31,61,0.18) 0%, transparent 60%)',
              }}
            />
          </div>

          {/* ── FLOATING BRAND LABELS ──────────────────────────── */}

          {/* Prada label — top left */}
          <FloatingLabel delay={1200} className="top-10 left-8 lg:top-16 lg:left-10">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-sm">
              <p className="text-[8px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-0.5">Outerwear</p>
              <p className="text-sm font-black uppercase tracking-tight text-white">Prada Bomber</p>
              <p className="text-[9px] text-gray-500 font-bold mt-1">Limited Edition</p>
            </div>
          </FloatingLabel>

          {/* Air Force label — bottom left */}
          <FloatingLabel delay={1500} className="bottom-28 left-8 lg:bottom-32 lg:left-10">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-sm">
              <p className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-500 mb-0.5">Footwear</p>
              <p className="text-sm font-black uppercase tracking-tight text-white">Air Force 1</p>
              <div className="flex items-center space-x-1 mt-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={8} className="fill-[#ba1f3d] text-[#ba1f3d]" />
                ))}
                <span className="text-[8px] text-gray-500 font-bold ml-1">5.0</span>
              </div>
            </div>
          </FloatingLabel>

          {/* Season label — top right */}
          <FloatingLabel delay={1800} className="top-10 right-8 lg:top-16 lg:right-10">
            <div className="bg-[#ba1f3d]/10 backdrop-blur-xl border border-[#ba1f3d]/25 px-5 py-4 text-right rounded-sm">
              <p className="text-[8px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-1">New Season</p>
              <p className="text-2xl font-black leading-none uppercase tracking-tighter text-white">SS '26</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Now Available</p>
            </div>
          </FloatingLabel>

          {/* Corner brackets — editorial detail */}
          <div className="absolute top-6 left-6 z-30 opacity-40 pointer-events-none">
            <div className="w-6 h-6 border-t border-l border-white/40" />
          </div>
          <div className="absolute bottom-6 right-6 z-30 opacity-40 pointer-events-none">
            <div className="w-6 h-6 border-b border-r border-white/20" />
          </div>

          {/* Vertical label — right edge */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 z-30 rotate-90 origin-center opacity-25 pointer-events-none">
            <span className="text-[7px] font-black uppercase tracking-[0.8em] text-white whitespace-nowrap">
              Stop &amp; Shop · Premium Streetwear
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom scroll indicator ──────────────────────────────── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center space-y-2 opacity-40 animate-bounce pointer-events-none">
        <span className="text-[7px] font-black uppercase tracking-[0.6em] text-white/60">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
      </div>
    </section>
  );
};

export default PowerOfChoiceHero;
