'use client';

/**
 * @fileoverview Newsletter — Black Edition
 * Full-bleed dark section with grain texture, animated typography,
 * and premium editorial feel.
 */

import React, { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';
import { useIntersectionObserver } from '../hooks/useUtils.js';
import { API_BASE } from '../config/api.js';

const Newsletter = () => {
  const [email, setEmail]     = useState('');
  const [status, setStatus]   = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const headlineRef = useRef(null);
  const formRef     = useRef(null);
  const hasAnimated = useRef(false);

  const { ref: observerRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.15,
    triggerOnce: true,
  });

  const sectionRef = useRef(null);
  const setSectionRef = (el) => {
    sectionRef.current = el;
    observerRef.current = el;
  };

  useEffect(() => {
    if (!isIntersecting || hasAnimated.current) return;
    hasAnimated.current = true;

    const headline = headlineRef.current;
    const form     = formRef.current;
    if (!headline || !form) return;

    anime.set(form, { opacity: 0, translateY: 24 });
    const words = headline.querySelectorAll('[data-word]');
    anime.set(words, { translateY: 60, opacity: 0 });

    const tl = anime.timeline({ easing: EASING.FABRIC });
    tl
      .add({
        targets: words,
        translateY: [60, 0],
        opacity:   [0, 1],
        duration:  900,
        delay:     anime.stagger(80),
        easing:    EASING.EXPO_OUT,
      })
      .add(
        {
          targets:  form,
          opacity:  [0, 1],
          translateY: [24, 0],
          duration: 700,
          easing:   EASING.SPRING,
        },
        '-=500'
      );
  }, [isIntersecting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    setErrorMsg('');
    const btn = formRef.current?.querySelector('button[type="submit"]');
    if (btn) anime({ targets: btn, scale: [1, 0.95, 1], duration: 300, easing: EASING.SPRING });
    try {
      const res  = await fetch(`${API_BASE}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? 'Something went wrong.'); setStatus('error'); return; }
      setStatus('success');
    } catch {
      setErrorMsg('Connection error. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section
      ref={setSectionRef}
      className="relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
    >
      {/* Grain texture */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '160px',
          opacity: 0.05,
        }}
        aria-hidden="true"
      />

      {/* Cardinal glow from bottom */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-0"
        style={{
          width: '70%',
          height: '40%',
          background: 'radial-gradient(ellipse at center bottom, rgba(186,31,61,0.18) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-8 text-center py-28 sm:py-36">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-3 border border-white/10 px-6 py-2.5 mb-10 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-cardinal animate-pulse" />
          <span className="text-[8.5px] font-black uppercase tracking-[0.55em] text-white/40">
            The Cardinal Circle
          </span>
        </div>

        {/* Headline */}
        <h2
          ref={headlineRef}
          className="font-black uppercase tracking-tighter leading-[0.85] mb-8 text-white"
          style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)' }}
        >
          {['Refine', 'Your', 'Wardrobe.'].map((word) => (
            <span key={word} data-word className="inline-block mr-[0.1em]">{word}</span>
          ))}
          <br />
          {['First', 'Access.', 'Always.'].map((word) => (
            <span key={word} data-word className="inline-block mr-[0.1em] text-white/30">{word}</span>
          ))}
        </h2>

        {/* Sub */}
        <p className="text-white/40 text-sm font-medium mb-12 max-w-sm mx-auto leading-relaxed">
          Join Pakistan's elite fashion community. First access to limited drops and private collections.
        </p>

        {/* Error */}
        {status === 'error' && errorMsg && (
          <p className="text-cardinal text-[10px] font-bold mb-4">{errorMsg}</p>
        )}

        {/* Form / Success */}
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 border border-cardinal/30 bg-cardinal/10 flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-cardinal" />
            </div>
            <div>
              <p className="text-white font-black uppercase tracking-[0.35em] text-base mb-1.5">You've Arrived.</p>
              <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em]">Check your inbox for the elite access code.</p>
            </div>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="max-w-lg mx-auto">
            <div className="flex items-stretch border border-white/10 hover:border-white/20 focus-within:border-white/30 transition-all duration-300 bg-white/5">
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
                      ? 'top-2.5 text-[8px] tracking-[0.4em] text-white/40'
                      : 'top-1/2 -translate-y-1/2 text-[9px] tracking-[0.3em] text-white/40'
                  }`}
                >
                  {isFocused || email ? 'Email Address' : 'YOUR@EMAIL.COM'}
                </label>
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="group/btn relative flex-shrink-0 flex items-center gap-3 px-8 py-4 bg-cardinal text-white text-[9px] font-black uppercase tracking-[0.35em] hover:brightness-110 transition-all duration-300 disabled:opacity-60 overflow-hidden"
              >
                {status === 'loading' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Join</span>
                    <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform duration-200" />
                  </>
                )}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out" />
              </button>
            </div>
            <p className="text-white/25 text-[8px] font-black uppercase tracking-[0.45em] mt-5 leading-relaxed">
              Privacy first. Use code{' '}
              <span className="text-white/50 border-b border-white/20 cursor-pointer">CARDINAL20</span>
              {' '}for 20% off your first order.
            </p>
          </form>
        )}

      </div>
    </section>
  );
};

export default Newsletter;