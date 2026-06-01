'use client';

/**
 * @fileoverview CategoryTiles.jsx — Visual Men's Category Navigator
 * Theme: Unified dark, white accent on hover (not red).
 */

import React, { useRef, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';

const TILES = [
  {
    key: 'Tops',
    label: 'Tops',
    sub: 'Polos · Shirts · Hoodies · Sweatshirts',
    image: '/category-tops.jpg',
  },
  {
    key: 'Bottoms',
    label: 'Bottoms',
    sub: 'Jeans · Trousers · Shorts',
    image: '/category-bottoms.jpg',
  },
  {
    key: 'Footwear',
    label: 'Footwear',
    sub: 'Shoes · Slippers · Socks',
    image: '/category-footwear.jpg',
  },
  {
    key: 'Accessories',
    label: 'Accessories',
    sub: 'Watches · Chains · Bags · Caps',
    image: '/category-accessories.jpg',
  },
];

export default function CategoryTiles({ onSelect, activeBucket }) {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tiles = entry.target.querySelectorAll('[data-tile]');
            tiles.forEach((tile, i) => {
              setTimeout(() => {
                tile.style.opacity = '1';
                tile.style.transform = 'translateY(0)';
              }, i * 100);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const scrollToGrid = () => {
    const el = document.getElementById('product-grid');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <section ref={ref} className="bg-[#0d0d0d] py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* Section Header */}
        <div className="flex items-end justify-between mb-10 sm:mb-14">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#555] mb-2">
              Shop by Category
            </p>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white leading-none">
              Dress Like<br className="sm:hidden" /> You Mean It.
            </h2>
          </div>
          <button
            onClick={() => { onSelect?.('All'); scrollToGrid(); }}
            className="hidden sm:flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-[#555] hover:text-white transition-colors duration-300 border-b border-[#2a2a2a] hover:border-white pb-0.5"
          >
            View All
            <ArrowUpRight size={12} />
          </button>
        </div>

        {/* Tile Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {TILES.map(({ key, label, sub, image }) => {
            const isActive = activeBucket === key;
            return (
              <button
                key={key}
                data-tile
                onClick={() => { onSelect?.(key); scrollToGrid(); }}
                className="relative group aspect-[3/4] overflow-hidden text-left focus:outline-none"
                style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
              >
                {/* Background Image */}
                <img
                  src={image}
                  alt={label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                />

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0 transition-opacity duration-300 group-hover:from-black/90" />

                {/* Active border — white */}
                {isActive && (
                  <div className="absolute inset-0 border-2 border-white pointer-events-none z-20" />
                )}

                {/* White top accent bar on hover */}
                <div className="absolute top-0 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-500 z-10" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/40 mb-1.5">
                        {sub}
                      </p>
                      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-none group-hover:text-white transition-colors duration-300">
                        {label}
                      </h3>
                    </div>
                    <div className="w-8 h-8 border border-white/20 flex items-center justify-center group-hover:border-white group-hover:bg-white transition-all duration-300">
                      <ArrowUpRight size={14} className="text-white group-hover:text-black transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile "View All" */}
        <div className="mt-6 flex justify-center sm:hidden">
          <button
            onClick={() => { onSelect?.('All'); scrollToGrid(); }}
            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-[#555] hover:text-white transition-colors duration-300 border-b border-[#2a2a2a] hover:border-white pb-0.5"
          >
            View All Products
            <ArrowUpRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
}
