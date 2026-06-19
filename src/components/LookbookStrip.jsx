'use client';

/**
 * @fileoverview LookbookStrip.jsx — Editorial Draggable Lookbook with Navigation
 * v3: Updated to pull real products from API with attitude section, supporting fallback to default looks.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { playPremiumChime } from '../utils/audio.js';
import { useNavigate } from '../utils/router-compat.jsx';
import Image from 'next/image';

const CARD_W_PX = 360; // approximate card width for step navigation
const GAP_PX    = 48;

const LOOKS = [];

export default function LookbookStrip({ products: initialProducts = [], onShopNow }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const [dbLooks, setDbLooks] = useState(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setDbLooks(initialProducts);
      setLoading(false);
      return;
    }
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
  }, [initialProducts]);

  const items = dbLooks.length > 0
    ? dbLooks.map((look, i) => ({
        id: look.id || look._id,
        image: look.lifestyleImage || look.image,
        tag: `Look ${String(i + 1).padStart(2, '0')}`,
        title: look.name,
        desc: look.description || look.specs?.[0] || `Premium ${look.subCategory || 'apparel'} designed for modern living.`,
        price: look.price,
        product: look,
      }))
    : LOOKS;



  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = CARD_W_PX + GAP_PX;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIdx(Math.max(0, Math.min(items.length - 1, idx)));
  }, [items.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState]);

  const stepTo = useCallback((idx) => {
    const el = scrollRef.current;
    if (!el) return;
    const clampedIdx = Math.max(0, Math.min(items.length - 1, idx));
    setActiveIdx(clampedIdx);
    const cardWidth = CARD_W_PX + GAP_PX;
    el.scrollTo({ left: clampedIdx * cardWidth, behavior: 'smooth' });
  }, [items.length]);

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

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className="bg-gradient-to-b from-[#FDFDFB] to-[#FAF8F5] py-20 sm:py-28 border-t border-[var(--border)] overflow-hidden"
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
            {/* Timeline progress line */}
            <div className="relative w-24 sm:w-32 h-0.5 bg-gray-250/50 mr-2 overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-black transition-all duration-500 ease-out"
                style={{ 
                  width: `${((activeIdx + 1) / items.length) * 100}%`
                }}
              />
            </div>

            {/* Arrows */}
            <button
              onClick={handlePrev}
              disabled={activeIdx === 0}
              className="w-10 h-10 border border-[var(--border-mid)] flex items-center justify-center text-gray-500 hover:border-black hover:text-black transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed active:scale-95 rounded-none"
              aria-label="Previous look"
            >
              <ArrowLeft size={15} strokeWidth={1.8} />
            </button>
            <button
              onClick={handleNext}
              disabled={activeIdx >= items.length - 1}
              className="w-10 h-10 border border-[var(--border-mid)] flex items-center justify-center text-gray-500 hover:border-black hover:text-black transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed active:scale-95 rounded-none"
              aria-label="Next look"
            >
              <ArrowRight size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Scroll Track Container */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-10 sm:gap-12 overflow-x-auto scroll-smooth pb-6 [&::-webkit-scrollbar]:hidden"
            style={{
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {items.map((look, idx) => (
              <div
                key={look.id}
                style={{ scrollSnapAlign: 'start' }}
                className="w-[280px] sm:w-[340px] md:w-[360px] flex-shrink-0 group cursor-pointer text-left relative"
                onClick={() => {
                  if (look.product) {
                    playPremiumChime();
                    navigate(`/product/${look.id}`);
                  }
                }}
              >
                {/* Watermark index behind image */}
                <div className="absolute -top-10 -left-4 font-mono text-[90px] font-black text-gray-200/20 select-none pointer-events-none transition-colors duration-500 group-hover:text-gray-300/30 leading-none z-0">
                  {String(idx + 1).padStart(2, '0')}
                </div>

                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 border border-[var(--border)] group-hover:shadow-[0_24px_48px_rgba(0,0,0,0.04)] transition-all duration-500 z-10 rounded-none">
                  <Image
                    src={look.image}
                    alt={look.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-[1.04] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  />
                  {/* Dark overlay that fades on hover */}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />

                  {/* Floating Tag */}
                  <span className="absolute top-4 left-4 font-mono text-[8px] font-black uppercase tracking-widest bg-white/90 backdrop-blur-sm border border-gray-100 px-3 py-1.5 shadow-sm z-20 rounded-none">
                    {look.tag}
                  </span>

                  {/* Bottom text overlay on hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
                    <p className="text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                      Shop This Look <ArrowRight size={10} />
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="mt-6 relative z-10">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 group-hover:text-black transition-colors duration-300 mb-2">
                    {look.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                    {look.desc}
                  </p>
                </div>
              </div>
            ))}

            {/* Final CTA Slide */}
            <div 
              style={{ scrollSnapAlign: 'start' }}
              className="w-[260px] sm:w-[300px] flex-shrink-0 flex flex-col justify-center items-center p-8 bg-[#F5F5F4]/60 border border-gray-200/40 text-center rounded-none"
            >
              <p className="text-[8px] font-black uppercase tracking-[0.5em] text-[#a4a4a2] mb-4">SS '26</p>
              <h4 className="text-sm font-black uppercase tracking-[0.15em] text-gray-950 mb-3">
                Curated Collection
              </h4>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-8 leading-relaxed">
                Explore the complete menswear collection online.
              </p>
              <button
                onClick={handleCtaClick}
                className="btn-primary rounded-none shadow-none flex items-center gap-3 w-full justify-center !py-4"
              >
                <span>Shop The Looks</span>
                <ArrowRight size={13} />
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
