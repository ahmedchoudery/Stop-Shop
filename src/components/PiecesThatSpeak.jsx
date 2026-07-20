'use client';

/**
 * @fileoverview PiecesThatSpeak.jsx — Curated Best Sellers Showcase Carousel
 * Personality: Bright, airy, sophisticated, gallery-like feel.
 * Reuses the standard ProductCard for consistent UX, photo-switching, and animations.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard.jsx';

export default function PiecesThatSpeak({ products: initialProducts = [] }) {
  const scrollRef = useRef(null);
  const [products, setProducts] = useState(initialProducts);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
      return;
    }
    fetch('/api/v1/public/featured?section=pieces')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setProducts(data || []);
      })
      .catch(err => {
        console.error('[PiecesThatSpeak] fetch failed:', err);
        setProducts([]);
      });
  }, [initialProducts]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    setScrollProgress((el.scrollLeft / maxScroll) * 100);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    // Initial compute
    setTimeout(handleScroll, 100);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, products]);

  const scroll = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 320;
    el.scrollBy({ left: dir * cardWidth * 2, behavior: 'smooth' });
  }, []);

  if (products.length === 0) {
    return null;
  }

  return (
    <section id="pieces-speak" className="bg-gradient-to-b from-[#FAF9F6] via-white to-[#FDFCFB] py-20 sm:py-28 border-t border-[var(--border)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16 gap-6">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.55em] text-gray-400 mb-3">
              Best Sellers · Fan Favourites
            </p>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black leading-none">
              Pieces That Speak for Themselves.
            </h2>
          </div>

          {/* Timeline progress line & navigation */}
          <div className="flex items-center gap-4">
            {/* Timeline Progress */}
            <div className="relative w-24 sm:w-32 h-0.5 bg-gray-200 mr-2 overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-black transition-all duration-300 ease-out"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            {/* Arrows */}
            <button
              onClick={() => scroll(-1)}
              className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-black hover:text-black transition-all duration-200 active:scale-95 rounded-none"
              aria-label="Previous items"
            >
              <ArrowLeft size={15} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-black hover:text-black transition-all duration-200 active:scale-95 rounded-none"
              aria-label="Next items"
            >
              <ArrowRight size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Horizontal scroll track */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4 [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {products.map((product) => (
            <div 
              key={product.id} 
              style={{ 
                scrollSnapAlign: 'start',
                width: 'clamp(230px, 28vw, 300px)',
                flexShrink: 0
              }}
            >
              <ProductCard product={product} variant="editorial" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
