'use client';

/**
 * @fileoverview Newsletter — Cardinal Circle Edition
 * Fix: removed style={{ opacity: 0 }} initial states that caused dead space
 *      when anime.js intersection observer didn't fire.
 *      Animation still runs — elements just won't be invisible if it fails.
 */

import React, { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';
import { useIntersectionObserver } from '../hooks/useUtils.js';
import { API_BASE } from '../config/api.js';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const sectionRef = useRef(null);
  const headlineRef = useRef(null);
  const formRef = useRef(null);
  const badgeRef = useRef(null);
  const hasAnimated = useRef(false);

  const { ref: observerRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.15,
    triggerOnce: true,
  });

  // Merge refs
  const setSectionRef = (el) => {
    sectionRef.current = el;
    observerRef.current = el;
  };

  // ── Entrance animation ─────────────────────────────────────────────
  useEffect(() => {
    if (!isIntersecting || hasAnimated.current) return;
    hasAnimated.current = true;

    const badge = badgeRef.current;
    const headline = headlineRef.current;
    const form = formRef.current;
    if (!badge || !headline || !form) return;

    // Set initial state — only set here (not in JSX) so elements are always visible as fallback
    anime.set(badge, { opacity: 0, translateY: 20 });
    anime.set(form, { opacity: 0, translateY: 24 });

    const words = headline.querySelectorAll('[data-word]');
    anime.set(words, { translateY: 50, opacity: 0 });

    const tl = anime.timeline({ easing: EASING.FABRIC });
    tl
      .add({
        targets: badge,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 700,
      })
      .add(
        {
          targets: words,
          translateY: [50, 0],
          opacity: [0, 1],
          duration: 900,
          delay: anime.stagger(90),
          easing: EASING.EXPO_OUT,
        },
        '-=350'
      )
      .add(
        {
          targets: form,
          opacity: [0, 1],
          translateY: [24, 0],
          duration: 700,
          easing: EASING.SPRING,
        },
        '-=500'
      );
  }, [isIntersecting]);

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('loading');
    setErrorMsg('');

    const btn = formRef.current?.querySelector('button[type="submit"]');
    if (btn) anime({ targets: btn, scale: [1, 0.95, 1], duration: 300, easing: EASING.SPRING });

    try {
      const res = await fetch(`${API_BASE}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch {
      setErrorMsg('Connection error. Please check your internet and try again.');
      setStatus('error');
    }
  };

  return (
    <section
      ref={setSectionRef}
      className="relative overflow-hidden bg-[#0d0d0d] py-28 sm:py-36 border-t border-[#1a1a1a]"
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(186,31,61,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-2xl mx-auto px-6 sm:px-8 text-center">

        {/* Badge */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-3 bg-[#141414] border border-[#1f1f1f] px-7 py-3 mb-12 rounded-full"
        >
          <Sparkles size={13} className="text-[#ba1f3d]" />
          <span className="text-[#999] text-[9px] font-black uppercase tracking-[0.55em]">
            The Cardinal Circle
          </span>
        </div>

        {/* Headline */}
        <h2
          ref={headlineRef}
          className="text-4xl sm:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-8"
        >
          {['Elevate', 'Your', 'Wardrobe.'].map((word) => (
            <span key={word} data-word className="inline-block mr-[0.12em]">
              {word}
            </span>
          ))}
          <br />
          {['First', 'Access.', 'Always.'].map((word) => (
            <span key={word} data-word className="inline-block mr-[0.12em] text-[#2a2a2a]">
              {word}
            </span>
          ))}
        </h2>

        {/* Subtext */}
        <p className="text-[#555] text-sm font-medium mb-14 max-w-sm mx-auto leading-relaxed">
          Join Pakistan's elite fashion community. First access to limited drops and private collections.
        </p>

        {/* Error */}
        {status === 'error' && errorMsg && (
          <p className="text-red-400 text-[10px] font-bold mb-4">{errorMsg}</p>
        )}

        {/* Form / Success */}
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 bg-[#ba1f3d] flex items-center justify-center shadow-[0_20px_60px_rgba(186,31,61,0.18)]">
              <CheckCircle size={30} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black uppercase tracking-[0.4em] text-lg mb-1.5">
                You've Arrived.
              </p>
              <p className="text-[#555] text-[9px] font-black uppercase tracking-[0.3em]">
                Check your inbox for the elite access code.
              </p>
            </div>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="max-w-lg mx-auto">

            {/* Input + Button */}
            <div className="flex items-stretch border border-[#1f1f1f] hover:border-[#2a2a2a] focus-within:border-[#444] transition-all duration-300 bg-[#111111]">

              {/* Email input with floating label */}
              <div className="relative flex-grow">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  required
                  placeholder=" "
                  id="nl-email"
                  className="peer w-full bg-transparent px-6 pt-7 pb-3 text-white font-bold text-sm outline-none placeholder:text-transparent"
                />
                <label
                  htmlFor="nl-email"
                  className={`absolute left-6 pointer-events-none font-black uppercase transition-all duration-300 ${
                    isFocused || email
                      ? 'top-2.5 text-[8px] tracking-[0.4em] text-[#555]'
                      : 'top-1/2 -translate-y-1/2 text-[9px] tracking-[0.3em] text-[#555]'
                  }`}
                >
                  {isFocused || email ? 'Email Address' : 'THE-ELITE@DOMAIN.COM'}
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="group/btn relative flex-shrink-0 flex items-center gap-3 px-8 py-4 bg-[#ba1f3d] text-white text-[9px] font-black uppercase tracking-[0.35em] hover:brightness-110 transition-all duration-300 disabled:opacity-60 border-l border-[#1f1f1f] overflow-hidden"
              >
                {status === 'loading' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Join</span>
                    <ArrowRight
                      size={14}
                      className="group-hover/btn:translate-x-0.5 transition-transform duration-200"
                    />
                  </>
                )}
                {/* Shine sweep */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out" />
              </button>
            </div>

            {/* Privacy note */}
            <p className="text-[#333] text-[8px] font-black uppercase tracking-[0.45em] mt-5 leading-relaxed">
              Privacy first. Use code{' '}
              <span className="text-white border-b border-white/20 cursor-pointer">CARDINAL20</span>
              {' '}for 20% off your first order.
            </p>
          </form>
        )}
      </div>
    </section>
  );
};

export default Newsletter;