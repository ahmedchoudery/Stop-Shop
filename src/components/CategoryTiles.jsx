'use client';

/**
 * @fileoverview CategoryTiles.jsx — Visual Men's Category Navigator
 * Theme: Minimalist editorial lookbook. White section, clean label below images.
 */

import React, { useRef, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';

const TILES = [
  {
    key: 'Tops',
    label: 'Tops',
    image: '/Tops.jpeg',
  },
  {
    key: 'Bottoms',
    label: 'Bottoms',
    image: '/Bottoms.jpeg',
  },
  {
    key: 'Footwear',
    label: 'Footwear',
    image: '/FootWears.jpeg',
  },
  {
    key: 'Accessories',
    label: 'Accessories',
    image: '/Accessories.jpeg',
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
    <section ref={ref} className="bg-white py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* Section Header */}
        <div className="flex items-end justify-between mb-10 sm:mb-14">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 mb-2">
              Shop by Category
            </p>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black leading-none">
              Dress Like<br className="sm:hidden" /> You Mean It.
            </h2>
          </div>
          <button
            onClick={() => { onSelect?.('All'); scrollToGrid(); }}
            className="hidden sm:flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-gray-500 hover:text-black transition-colors duration-300 border-b border-gray-300 hover:border-white pb-0.5"
          >
            View All
            <ArrowUpRight size={12} />
          </button>
        </div>

        {/* Tile Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {TILES.map(({ key, label, image }) => {
            const isActive = activeBucket === key;
            return (
              <button
                key={key}
                data-tile
                onClick={() => { onSelect?.(key); scrollToGrid(); }}
                className="group flex flex-col text-left focus:outline-none w-full"
                style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
              >
                {/* Image Wrapper */}
                <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-50">
                  <img
                    src={image}
                    alt={label}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  
                  {/* Clean borders overlay: thin outline by default, black on hover/active */}
                  <div className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
                    isActive 
                      ? 'border-2 border-black z-20' 
                      : 'border border-gray-200 group-hover:border-black/40 z-20'
                  }`} />
                </div>

                {/* Details Row - Pure Minimalism */}
                <div className="mt-3 w-full px-0.5 text-left">
                  <h3 className={`text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${
                    isActive ? 'text-black' : 'text-gray-400 group-hover:text-black'
                  }`}>
                    {label}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile "View All" */}
        <div className="mt-8 flex justify-center sm:hidden">
          <button
            onClick={() => { onSelect?.('All'); scrollToGrid(); }}
            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-gray-500 hover:text-black transition-colors duration-300 border-b border-gray-300 hover:border-white pb-0.5"
          >
            View All Products
            <ArrowUpRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
}
