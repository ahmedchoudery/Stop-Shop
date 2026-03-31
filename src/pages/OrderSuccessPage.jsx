/**
 * @fileoverview OrderSuccessPage — Design Spells Edition
 * Applies: animejs-animation (confetti burst, checkmark draw, stagger timeline),
 *          design-spells (celebratory moment, order ID reveal, timeline progress),
 *          design-md (Cardinal Red success, editorial typography)
 */

import React, { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home, ArrowRight } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';

// ─────────────────────────────────────────────────────────────────
// CONFETTI PARTICLE
// ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#ba1f3d', '#FBBF24', '#111827', '#F63049', '#ffffff'];

const spawnConfetti = (anime) => {
  const container = document.getElementById('confetti-container');
  if (!container) return;

  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const size = Math.random() * 8 + 4;
    const isRect = Math.random() > 0.5;

    el.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${isRect ? size * 0.4 : size}px;
      background: ${color};
      border-radius: ${isRect ? '1px' : '50%'};
      left: ${Math.random() * 100}%;
      top: -20px;
      opacity: 1;
      pointer-events: none;
    `;
    container.appendChild(el);

    anime({
      targets: el,
      translateY: [0, window.innerHeight * (0.6 + Math.random() * 0.4)],
      translateX: [(Math.random() - 0.5) * 300],
      rotate: [0, Math.random() * 720 * (Math.random() > 0.5 ? 1 : -1)],
      opacity: [1, 0],
      duration: 1800 + Math.random() * 1200,
      delay: Math.random() * 400,
      easing: 'cubicBezier(0.25, 0.46, 0.45, 0.94)',
      complete: () => el.remove(),
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// DELIVERY TIMELINE
// ─────────────────────────────────────────────────────────────────

const DeliveryTimeline = () => {
  const steps = [
    { icon: CheckCircle, label: 'Order Confirmed', sublabel: 'Just now', done: true },
    { icon: Package, label: 'Being Packed', sublabel: 'Today', done: true },
    { icon: Truck, label: 'Out for Delivery', sublabel: '2–5 days', done: false },
    { icon: Home, label: 'Delivered', sublabel: 'Soon!', done: false },
  ];

  return (
    <div className="w-full max-w-sm mx-auto">
      {steps.map((s, i) => (
        <div key={i} className="flex items-start space-x-4">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              s.done ? 'bg-[#ba1f3d] text-white shadow-lg shadow-red-200/60' : 'bg-gray-100 text-gray-400'
            }`}>
              <s.icon size={16} />
            </div>
            {i < steps.length - 1 && (
              <div className={`w-0.5 h-8 mt-1 ${s.done ? 'bg-[#ba1f3d]' : 'bg-gray-100'}`} />
            )}
          </div>
          <div className="pt-1.5 pb-6">
            <p className={`text-sm font-black uppercase tracking-tight ${s.done ? 'text-gray-900' : 'text-gray-400'}`}>
              {s.label}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {s.sublabel}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────

const OrderSuccessPage = () => {
  const [params] = useSearchParams();
  const orderID = params.get('orderID') ?? 'ORD-XXXXXXXX';

  const containerRef = useRef(null);
  const checkRef = useRef(null);
  const orderIdRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let anime;
    try { anime = require('animejs').default ?? require('animejs'); } catch {
      // CSS fallback
      containerRef.current.style.opacity = '1';
      return;
    }

    const tl = anime.timeline({ easing: EASING.FABRIC });

    const elements = containerRef.current.querySelectorAll('[data-success]');
    anime.set(elements, { opacity: 0, translateY: 30 });
    anime.set(checkRef.current, { scale: 0, opacity: 0 });

    tl
      // 1. Check icon springs in
      .add({
        targets: checkRef.current,
        scale: [0, 1.15, 1],
        opacity: [0, 1],
        duration: 700,
        easing: EASING.SPRING,
      })
      // 2. Confetti burst
      .add({
        duration: 1,
        complete: () => spawnConfetti(anime),
      }, '-=400')
      // 3. Content stagger
      .add({
        targets: elements,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: anime.stagger(100),
      }, '-=200')
      // 4. Order ID scramble reveal
      .add({
        duration: 1,
        complete: () => {
          if (!orderIdRef.current) return;
          const chars = 'ABCDEF0123456789-';
          let iter = 0;
          const final = orderID;
          const interval = setInterval(() => {
            orderIdRef.current.textContent = final
              .split('')
              .map((c, idx) => {
                if (c === '-') return '-';
                return idx < iter ? c : chars[Math.floor(Math.random() * chars.length)];
              })
              .join('');
            if (iter >= final.length) {
              clearInterval(interval);
              orderIdRef.current.textContent = final;
            }
            iter++;
          }, 50);
        },
      }, '+=100');

    return () => tl.pause();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">

      {/* Confetti container */}
      <div id="confetti-container" className="fixed inset-0 pointer-events-none z-50" />

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(186,31,61,0.06) 0%, transparent 70%)',
        }}
      />

      <div ref={containerRef} className="relative z-10 flex flex-col items-center text-center max-w-md w-full">

        {/* Animated checkmark */}
        <div
          ref={checkRef}
          className="w-24 h-24 bg-[#ba1f3d] rounded-full flex items-center justify-center mb-8 shadow-[0_30px_80px_rgba(186,31,61,0.35)]"
          style={{ opacity: 0 }}
        >
          <CheckCircle size={44} className="text-white" strokeWidth={2} />
        </div>

        {/* Heading */}
        <div data-success style={{ opacity: 0 }}>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-3">
            Order Confirmed
          </p>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-gray-900 mb-4 leading-tight">
            Thank You!
          </h1>
          <p className="text-gray-400 font-medium leading-relaxed mb-8">
            Your order has been placed successfully. You'll receive a confirmation email shortly.
          </p>
        </div>

        {/* Order ID — design spell: scramble reveal */}
        <div data-success className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8" style={{ opacity: 0 }}>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2">
            Order Reference
          </p>
          <p
            ref={orderIdRef}
            className="text-2xl font-black font-mono tracking-wider text-[#ba1f3d]"
          >
            {orderID}
          </p>
        </div>

        {/* Delivery Timeline */}
        <div data-success className="w-full mb-10" style={{ opacity: 0 }}>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 text-left">
            Delivery Timeline
          </p>
          <DeliveryTimeline />
        </div>

        {/* CTAs */}
        <div data-success className="flex flex-col sm:flex-row gap-3 w-full" style={{ opacity: 0 }}>
          <Link
            to="/"
            className="flex-1 flex items-center justify-center space-x-2 py-4 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-gray-900 transition-all duration-300 shadow-xl shadow-red-200/40 btn-shimmer group"
          >
            <span>Continue Shopping</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            onClick={() => window.print()}
            className="flex-1 py-4 border-2 border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all duration-300"
          >
            Save Invoice
          </button>
        </div>

        {/* Footer note */}
        <p data-success className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mt-8" style={{ opacity: 0 }}>
          Questions? WhatsApp us at 0306-84586556
        </p>
      </div>
    </div>
  );
};

export default OrderSuccessPage;