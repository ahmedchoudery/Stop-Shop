'use client';

/**
 * @fileoverview CategoryTiles.jsx — Visual Men's Category Navigator
 * Theme: Minimalist editorial lookbook. White section, clean label below images.
 */

import React, { useRef, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';

const TILES = [
  {
    key: 'Tops',
    label: 'Tops',
    image: '/Tops.jpeg',
    num: '01',
    desc: 'Tailored Shirts & Tees'
  },
  {
    key: 'Bottoms',
    label: 'Bottoms',
    image: '/Bottoms.jpeg',
    num: '02',
    desc: 'Structured Trousers & Denim'
  },
  {
    key: 'Footwear',
    label: 'Footwear',
    image: '/FootWears.jpeg',
    num: '03',
    desc: 'Handcrafted Leather Boots'
  },
  {
    key: 'Accessories',
    label: 'Accessories',
    image: '/Accessories.jpeg',
    num: '04',
    desc: 'Signature Leather Belts'
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
    <section ref={ref} className="bg-gradient-to-b from-[#FDFCF9] via-[#FAF9F6] to-[#F5F4F0] py-16 sm:py-24 border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* Section Header */}
        <div className="flex items-end justify-between mb-10 sm:mb-14">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 mb-2">
              Shop by Category
            </p>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black leading-none">
              Dress Like You Mean It.
            </h2>
          </div>
          <button
            onClick={() => { onSelect?.('All'); scrollToGrid(); }}
            className="hidden sm:flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-gray-500 hover:text-black transition-colors duration-300 border-b border-gray-300 hover:border-black pb-0.5"
          >
            View All
            <ArrowUpRight size={12} />
          </button>
        </div>

        {/* Tile Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {TILES.map(({ key, label, image, num, desc }) => {
            const isActive = activeBucket === key;
            return (
              <button
                key={key}
                data-tile
                onClick={() => { onSelect?.(key); scrollToGrid(); }}
                className="group flex flex-col text-left focus:outline-none w-full bg-white border border-gray-150/70 p-4 transition-all duration-500 hover:shadow-[0_16px_40px_rgba(0,0,0,0.035)] hover:-translate-y-1 relative rounded-none"
                style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease, box-shadow 0.5s ease, transform 0.5s ease' }}
              >
                {/* Num and Action Row */}
                <div className="flex justify-between items-center mb-3 w-full">
                  <span className="font-mono text-[9px] font-black tracking-widest text-gray-400 group-hover:text-black transition-colors duration-300">
                    {num}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-black transition-all duration-300 translate-x-1 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    Explore <ArrowUpRight size={10} />
                  </span>
                </div>

                {/* Image Wrapper */}
                <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-50 mb-4">
                  <Image
                    src={image}
                    alt={label}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                  
                  {/* Clean borders overlay */}
                  <div className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
                    isActive 
                      ? 'border-2 border-black z-20' 
                      : 'border border-gray-200/50 group-hover:border-black/20 z-20'
                  }`} />
                </div>

                {/* Details Row - Pure Minimalism */}
                <div className="w-full px-0.5">
                  <h3 className={`text-[11px] font-black uppercase tracking-[0.25em] transition-colors duration-300 ${
                    isActive ? 'text-black' : 'text-gray-900 group-hover:text-black'
                  }`}>
                    {label}
                  </h3>
                  <p className="text-[9px] text-gray-400 font-medium tracking-wide mt-1 line-clamp-1 group-hover:text-gray-500 transition-colors duration-300">
                    {desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile "View All" */}
        <div className="mt-8 flex justify-center sm:hidden">
          <button
            onClick={() => { onSelect?.('All'); scrollToGrid(); }}
            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-gray-500 hover:text-black transition-colors duration-300 border-b border-gray-300 hover:border-black pb-0.5"
          >
            View All Products
            <ArrowUpRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
}
