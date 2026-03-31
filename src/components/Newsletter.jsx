/**
 * @fileoverview Newsletter — Design Spells Edition
 * Applies: animejs-animation (timeline orchestration, spring, stagger),
 *          design-spells (floating label, shimmer CTA, text reveal clip),
 *          design-md (Cardinal Red, surgical white, editorial typography)
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';
import { useIntersectionObserver } from '../hooks/useUtils.js';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [isFocused, setIsFocused] = useState(false);

  const sectionRef = useRef(null);
  const headlineRef = useRef(null);
  const formRef = useRef(null);
  const badgeRef = useRef(null);
  const hasAnimated = useRef(false);

  const { ref: observerRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.2,
    triggerOnce: true,
  });

  // Merge refs
  const setSectionRef = (el) => {
    sectionRef.current = el;
    observerRef.current = el;
  };

  // ── Entrance animation on scroll into view ────────────────────
  useEffect(() => {
    if (!isIntersecting || hasAnimated.current) return;
    hasAnimated.current = true;

    let anime;
    try { anime = require('animejs').default ?? require('animejs'); } catch { return; }

    const badge = badgeRef.current;
    const headline = headlineRef.current;
    const form = formRef.current;
    if (!badge || !headline || !form) return;

    anime.set([badge, headline, form], { opacity: 0 });
    anime.set(badge, { translateY: 20 });
    anime.set(form, { translateY: 30 });

    // Headline words — clip reveal
    const words = headline.querySelectorAll('[data-word]');
    anime.set(words, { translateY: 60, opacity: 0 });

    const tl = anime.timeline({ easing: EASING.FABRIC });

    tl
      .add({
        targets: badge,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 700,
      })
      .add({
        targets: words,
        translateY: [60, 0],
        opacity: [0, 1],
        duration: 1000,
        delay: anime.stagger(100),
        easing: EASING.EXPO_OUT,
      }, '-=400')
      .add({
        targets: form,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 800,
        easing: EASING.SPRING,
      }, '-=600');
  }, [isIntersecting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('loading');

    // Animate button
    let anime;
    try {
      anime = require('animejs').default ?? require('animejs');
      const btn = formRef.current?.querySelector('button[type="submit"]');
      if (btn) {
        anime({ targets: btn, scale: [1, 0.95, 1], duration: 300, easing: EASING.SPRING });
      }
    } catch { /* ok */ }

    // Simulate API (replace with supabaseService.subscribeNewsletter(email))
    await new Promise(r => setTimeout(r, 1000));
    setStatus('success');
  };

  return (
    <section
      ref={setSectionRef}
      className="relative overflow-hidden bg-white py-40 border-t border-gray-50"
    >
      {/* Ambient gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(186,31,61,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Grain texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center">

        {/* Badge */}
        <div
          ref={badgeRef}
          className="inline-flex items-center space-x-3 bg-white border border-gray-100 shadow-sm px-8 py-3.5 mb-16 rounded-full"
          style={{ opacity: 0 }}
        >
          <Sparkles size={14} className="text-[#ba1f3d] animate-pulse" />
          <span className="text-gray-900 text-[10px] font-black uppercase tracking-[0.6em]">
            The Cardinal Circle
          </span>
        </div>

        {/* Headline */}
        <h2
          ref={headlineRef}
          className="text-5xl sm:text-7xl lg:text-[8rem] font-black text-gray-900 uppercase tracking-tighter leading-[0.82] mb-10"
        >
          {['Elevate', 'Your', 'Wardrobe.'].map((word, i) => (
            <span
              key={i}
              data-word
              className={`inline-block mr-[0.15em] ${i === 2 ? 'text-[#ba1f3d]' : ''}`}
              style={{ opacity: 0 }}
            >
              {word}
            </span>
          ))}
          <br />
          {['Secure', 'Access.'].map((word, i) => (
            <span
              key={i}
              data-word
              className="inline-block mr-[0.15em] text-transparent"
              style={{ WebkitTextStroke: '2px #ba1f3d', opacity: 0 }}
            >
              {word}
            </span>
          ))}
        </h2>

        <p className="text-gray-400 text-lg font-medium mb-16 max-w-xl mx-auto leading-relaxed uppercase tracking-tighter opacity-70">
          Join Pakistan's elite fashion community. First access to limited drops and private collections.
        </p>

        {/* Form / Success */}
        {status === 'success' ? (
          <div className="flex flex-col items-center space-y-6 animate-fade-up">
            <div className="w-20 h-20 bg-[#ba1f3d] rounded-full flex items-center justify-center shadow-[0_20px_60px_rgba(186,31,61,0.35)] animate-scale-in">
              <CheckCircle size={36} className="text-white" />
            </div>
            <div>
              <p className="text-gray-900 font-black uppercase tracking-[0.4em] text-2xl mb-2">
                You've Arrived.
              </p>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">
                Check your inbox for the elite access code.
              </p>
            </div>
          </div>
        ) : (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="max-w-xl mx-auto"
            style={{ opacity: 0 }}
          >
            {/* Floating label input — design spell */}
            <div className="relative flex items-stretch border-2 border-gray-900 shadow-[0_20px_60px_rgba(0,0,0,0.08)] group hover:shadow-[0_25px_70px_rgba(0,0,0,0.12)] transition-shadow duration-500">

              {/* Input with floating label */}
              <div className="relative flex-grow">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  required
                  className="w-full bg-transparent px-8 py-6 text-gray-900 font-bold text-sm outline-none placeholder:text-transparent peer"
                  placeholder="your@email.com"
                  id="newsletter-email"
                />
                {/* Floating label — design spell */}
                <label
                  htmlFor="newsletter-email"
                  className={`absolute left-8 pointer-events-none font-black uppercase transition-all duration-300 ${
                    isFocused || email
                      ? 'top-2 text-[9px] tracking-[0.4em] text-[#ba1f3d]'
                      : 'top-1/2 -translate-y-1/2 text-[10px] tracking-[0.3em] text-gray-400'
                  }`}
                >
                  {isFocused || email ? 'Email Address' : 'THE-ELITE@DOMAIN.COM'}
                </label>
              </div>

              {/* Submit button with shimmer */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-[#ba1f3d] hover:bg-gray-900 text-white px-10 py-6 font-black uppercase tracking-[0.35em] text-[10px] transition-all duration-300 flex-shrink-0 flex items-center space-x-3 border-l-2 border-gray-900 disabled:opacity-60 relative overflow-hidden group/btn"
              >
                {status === 'loading' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Join</span>
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform duration-200" />
                  </>
                )}
                {/* Shimmer sweep */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-600 ease-out" />
              </button>
            </div>

            <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.5em] mt-6 opacity-50">
              Privacy first. Use code{' '}
              <span className="text-[#ba1f3d] underline decoration-2 underline-offset-4 cursor-pointer">
                CARDINAL20
              </span>{' '}
              for 20% off your first order.
            </p>
          </form>
        )}
      </div>
    </section>
  );
};

export default Newsletter;