/**
 * @fileoverview SmoothLoader — Luxury branded preloader
 * Fix: replaced require('animejs') with ESM import — preloader animations are now functional
 * Applies: animejs-animation (timeline choreography, spring physics),
 *          design-spells (text scramble on brand name, fabric reveal transition),
 *          design-md (Cardinal Red, gold accent, surgical white)
 */

import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { EASING } from '../hooks/useAnime.js';

const BRAND_CHARS = 'STOP & SHOP';
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ&';

const SmoothLoader = ({ onComplete }) => {
  const [percent, setPercent] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [displayText, setDisplayText] = useState('STOP & SHOP');

  const loaderRef = useRef(null);
  const barRef = useRef(null);
  const textRef = useRef(null);
  const percentRef = useRef(null);
  const taglineRef = useRef(null);
  const scrambleInterval = useRef(null);
  const percentObj = useRef({ value: 0 });

  useEffect(() => {
    // ── Initial entrance ─────────────────────────────────────
    anime.set([textRef.current, taglineRef.current, percentRef.current], {
      opacity: 0,
      translateY: 20,
    });

    const entranceTl = anime.timeline({ easing: EASING.FABRIC });

    entranceTl
      .add({
        targets: textRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 700,
      })
      .add({
        targets: taglineRef.current,
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 500,
      }, '-=300')
      .add({
        targets: percentRef.current,
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 400,
      }, '-=200');

    // ── Brand name text scramble ──────────────────────────────
    let iteration = 0;
    scrambleInterval.current = setInterval(() => {
      setDisplayText(
        BRAND_CHARS
          .split('')
          .map((char, idx) => {
            if (char === ' ' || char === '&') return char;
            if (idx < iteration / 2) return char;
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join('')
      );
      if (iteration >= BRAND_CHARS.length * 2) {
        clearInterval(scrambleInterval.current);
        setDisplayText('STOP & SHOP');
      }
      iteration++;
    }, 60);

    // ── Progress counter ──────────────────────────────────────
    const progressAnim = anime({
      targets: percentObj.current,
      value: [0, 100],
      duration: 2200,
      easing: 'cubicBezier(0.1, 0.0, 0.3, 1.0)',
      update: () => {
        const v = Math.round(percentObj.current.value);
        setPercent(v);
        if (barRef.current) {
          barRef.current.style.width = `${v}%`;
        }
        if (percentRef.current) {
          percentRef.current.textContent = v === 100 ? 'WELCOME' : `${v}%`;
        }
      },
      complete: () => {
        // Exit animation — fabric swipe up
        setTimeout(() => {
          anime({
            targets: loaderRef.current,
            clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 100% 0%)'],
            duration: 900,
            easing: EASING.FABRIC,
            complete: onComplete,
          });
        }, 400);
      },
    });

    return () => {
      clearInterval(scrambleInterval.current);
      progressAnim.pause();
    };
  }, []);  

  return (
    <div
      ref={loaderRef}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0d0208] transition-all duration-700 ${
        isExiting ? 'opacity-0 translate-y-[-100%]' : ''
      }`}
      style={{ willChange: 'clip-path, opacity' }}
    >
      {/* Background grain texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Cardinal red accent lines */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#ba1f3d]" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#ba1f3d]/30" />

      {/* Main content */}
      <div className="relative flex flex-col items-center">

        {/* Brand name — text scramble */}
        <div ref={textRef} className="mb-4 text-center">
          <h1
            className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-white font-mono"
            style={{ letterSpacing: '-0.02em' }}
          >
            {displayText.split('').map((char, i) => (
              <span
                key={i}
                style={{
                  color: char === '&' ? '#ba1f3d' : undefined,
                  display: 'inline-block',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h1>
        </div>

        {/* Tagline */}
        <p
          ref={taglineRef}
          className="text-[9px] font-black uppercase tracking-[0.6em] text-white/30 mb-14"
        >
          Premium Clothing · Pakistan Edition
        </p>

        {/* Progress bar container */}
        <div className="w-64 h-[1px] bg-white/10 relative mb-5">
          {/* Progress fill */}
          <div
            ref={barRef}
            className="absolute top-0 left-0 h-full bg-[#ba1f3d] transition-none"
            style={{ width: `${percent}%`, willChange: 'width' }}
          />
          {/* Glow on progress tip */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#ba1f3d] shadow-[0_0_12px_#ba1f3d] transition-none"
            style={{ left: `${Math.max(0, percent - 1)}%`, willChange: 'left' }}
          />
        </div>

        {/* Percent */}
        <span
          ref={percentRef}
          className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ba1f3d] font-mono"
        >
          0%
        </span>
      </div>

      {/* Bottom corners */}
      <div className="absolute bottom-8 left-8 opacity-20">
        <div className="w-6 h-[1px] bg-white mb-1" />
        <p className="text-[7px] font-black uppercase tracking-[0.4em] text-white/60">
          Cardinal Systems
        </p>
      </div>

      <div className="absolute bottom-8 right-8 text-right opacity-20">
        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-white/60">
          Est. 2024 · Gujrat
        </p>
      </div>
    </div>
  );
};

export default SmoothLoader;
