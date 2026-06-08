'use client';

/**
 * @fileoverview LookbookStrip.jsx — Editorial Draggable Lookbook with Navigation
 * v3: Updated to pull real products from API with attitude section, supporting fallback to default looks.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { playPremiumChime } from '../utils/audio.js';
import { useNavigate } from '../utils/router-compat.jsx';

const CARD_W_PX = 360; // approximate card width for step navigation
const GAP_PX    = 48;

const LOOKS = [
  {
    id: 1,
    image: '/Hero-Desktop.jpeg',
    tag: 'Look 01',
    title: 'The Linen Silhouette',
    desc: 'Lightweight linen shirt paired with pleated sand-colored trousers.',
  },
  {
    id: 2,
    image: '/lookbook-strip.jpg',
    tag: 'Look 02',
    title: 'Structured Modernism',
    desc: 'Heavy cotton boxy overshirt over dry indigo raw denim.',
  },
  {
    id: 3,
    image: '/Hero-Tablet.jpeg',
    tag: 'Look 03',
    title: 'Monochrome Utilitarian',
    desc: 'Water-resistant technical windbreaker with dark grey cargo pants.',
  },
  {
    id: 4,
    image: '/Hero-Mobile.jpeg',
    tag: 'Look 04',
    title: 'Relaxed Athleisure',
    desc: 'Premium French Terry cotton pullover in charcoal wash.',
  },
];

export default function LookbookStrip({ onShopNow }) {
  const navigate = useNavigate();
  const containerRef  = useRef(null);
  const innerRef      = useRef(null);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  const [dragX, setDragX]     = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);

  const [dbLooks, setDbLooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/featured?section=attitude')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setDbLooks(data || []);
      })
      .catch(err => console.error('[Lookbook] fetch failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const items = dbLooks.map((look, i) => ({
    id: look.id || look._id,
    image: look.lifestyleImage || look.image,
    tag: `Look ${String(i + 1).padStart(2, '0')}`,
    title: look.name,
    desc: look.specs?.[0] || `Premium ${look.subCategory || 'apparel'} designed for modern living.`,
    price: look.price,
    product: look,
  }));

  useEffect(() => {
    const updateConstraints = () => {
      if (containerRef.current && innerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const innerWidth     = innerRef.current.scrollWidth;
        setDragConstraints({ left: Math.min(0, containerWidth - innerWidth - 64), right: 0 });
      }
    };
    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    const t = setTimeout(updateConstraints, 500);
    return () => { window.removeEventListener('resize', updateConstraints); clearTimeout(t); };
  }, [items.length]);

  const stepTo = useCallback((idx) => {
    const clampedIdx = Math.max(0, Math.min(items.length - 1, idx));
    setActiveIdx(clampedIdx);
    const newX = Math.max(dragConstraints.left, -(clampedIdx * (CARD_W_PX + GAP_PX)));
    setDragX(newX);
  }, [dragConstraints.left, items.length]);

  const handlePrev = () => { playPremiumChime(); stepTo(activeIdx - 1); };
  const handleNext = () => { playPremiumChime(); stepTo(activeIdx + 1); };

  const scrollToGrid = () => {
    const el = document.getElementById('product-grid');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleCtaClick = () => {
    playPremiumChime();
    onShopNow?.('All');
    scrollToGrid();
  };

  if (loading || dbLooks.length === 0) {
    return null;
  }

  return (
    <section
      ref={containerRef}
      className="bg-[var(--bg-base)] py-20 sm:py-28 border-t border-[var(--border)] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16 gap-6">
          <div className="max-w-xl">
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-[#a4a4a2] mb-4">
              Seasonal Looks · SS '26
            </p>
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-black leading-none">
              Defined by Attitude.
            </h2>
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-4">
            {/* Dots */}
            <div className="flex items-center gap-2 mr-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => stepTo(i)}
                  className="group"
                  aria-label={`Go to look ${i + 1}`}
                >
                  <span
                    className={`block rounded-full transition-all duration-300 ${
                      i === activeIdx
                        ? 'w-5 h-1.5 bg-black'
                        : 'w-1.5 h-1.5 bg-gray-300 group-hover:bg-gray-500'
                    }`}
                  />
                </button>
              ))}
            </div>
            {/* Arrows */}
            <button
              onClick={handlePrev}
              disabled={activeIdx === 0}
              className="w-10 h-10 border border-[var(--border-mid)] flex items-center justify-center text-gray-500 hover:border-black hover:text-black transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed active:scale-95"
              aria-label="Previous look"
            >
              <ArrowLeft size={15} strokeWidth={1.8} />
            </button>
            <button
              onClick={handleNext}
              disabled={activeIdx >= items.length - 1}
              className="w-10 h-10 border border-[var(--border-mid)] flex items-center justify-center text-gray-500 hover:border-black hover:text-black transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed active:scale-95"
              aria-label="Next look"
            >
              <ArrowRight size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Drag Container */}
        <div className="relative cursor-grab active:cursor-grabbing">
          <motion.div
            ref={innerRef}
            drag="x"
            dragConstraints={dragConstraints}
            dragElastic={0.1}
            dragTransition={{ power: 0.2, timeConstant: 300 }}
            animate={{ x: dragX }}
            onDragEnd={(_, info) => {
              const newX = Math.max(dragConstraints.left, Math.min(0, dragX + info.offset.x));
              setDragX(newX);
              const estIdx = Math.round(-newX / (CARD_W_PX + GAP_PX));
              setActiveIdx(Math.max(0, Math.min(items.length - 1, estIdx)));
            }}
            className="flex gap-10 sm:gap-12 w-max"
          >
            {items.map((look) => (
              <div
                key={look.id}
                className="w-[280px] sm:w-[340px] md:w-[360px] flex-shrink-0 group cursor-pointer text-left"
                onClick={() => {
                  if (look.product) {
                    playPremiumChime();
                    navigate(`/product/${look.id}`);
                  }
                }}
              >
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 border border-[var(--border)]">
                  <motion.img
                    src={look.image}
                    alt={look.title}
                    className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-[1.04] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
                    viewport={{ once: true, margin: '-5%' }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  />
                  {/* Dark overlay that fades on hover */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />

                  {/* Floating Tag */}
                  <span className="absolute top-4 left-4 font-mono text-[9px] font-bold uppercase tracking-widest bg-white border border-gray-100 px-3 py-1.5">
                    {look.tag}
                  </span>

                  {/* Bottom text overlay on hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
                    <p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Shop This Look</p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="mt-6">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 mb-2">
                    {look.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                    {look.desc}
                  </p>
                </div>
              </div>
            ))}

            {/* Final CTA Slide */}
            <div className="w-[260px] sm:w-[300px] flex-shrink-0 flex flex-col justify-center items-center p-8 border border-dashed border-[var(--border-mid)] bg-white/60 text-center">
              <p className="text-[8px] font-black uppercase tracking-[0.5em] text-[#a4a4a2] mb-4">SS '26</p>
              <h4 className="text-sm font-black uppercase tracking-[0.15em] text-gray-950 mb-3">
                Curated Collection
              </h4>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-8 leading-relaxed">
                Explore the complete menswear collection online.
              </p>
              <button
                onClick={handleCtaClick}
                className="btn-primary flex items-center gap-3 w-full justify-center !py-4"
              >
                <span>Shop The Looks</span>
                <ArrowRight size={13} />
              </button>
            </div>

          </motion.div>
        </div>

      </div>
    </section>
  );
}
