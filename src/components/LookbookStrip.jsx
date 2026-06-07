'use client';

/**
 * @fileoverview LookbookStrip.jsx — Full-Bleed Draggable Lookbook Slider
 * Theme: Editorial layout, high-fashion styling notes, and momentum-physics drag interaction.
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MoveLeft } from 'lucide-react';
import { playPremiumChime } from '../utils/audio.js';

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
  const containerRef = useRef(null);
  const innerRef = useRef(null);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    // Calculate drag boundaries
    const updateConstraints = () => {
      if (containerRef.current && innerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const innerWidth = innerRef.current.scrollWidth;
        // Keep a little padding/margin at the end
        setDragConstraints({ left: Math.min(0, containerWidth - innerWidth - 64), right: 0 });
      }
    };

    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    
    // Slight delay to allow DOM nodes to mount and compute sizes correctly
    const timer = setTimeout(updateConstraints, 500);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateConstraints);
      clearTimeout(timer);
    };
  }, []);

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

  return (
    <section
      ref={containerRef}
      className="bg-[var(--bg-base)] py-20 sm:py-28 border-t border-b border-[var(--border)] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16">
          <div className="max-w-xl">
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-[#a4a4a2] mb-4">
              Seasonal Looks · SS '26
            </p>
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-black leading-none">
              Defined by Attitude.
            </h2>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <span>Drag horizontally to explore</span>
            <ArrowRight size={14} className="animate-pulse" />
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
            className="flex space-x-6 sm:space-x-8 lg:space-x-12 w-max"
          >
            {LOOKS.map((look) => (
              <div
                key={look.id}
                className="w-[280px] sm:w-[340px] md:w-[380px] flex-shrink-0 group"
              >
                {/* Image Mask Reveal */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-[4px] bg-gray-100 border border-[var(--border)]">
                  <motion.img
                    src={look.image}
                    alt={look.title}
                    className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
                    viewport={{ once: true, margin: '-5%' }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: look.id * 0.1 }}
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />
                  
                  {/* Floating Tag */}
                  <span className="absolute top-4 left-4 font-mono text-[9px] font-bold uppercase tracking-widest bg-white border border-gray-200 px-3 py-1.5 rounded-[4px]">
                    {look.tag}
                  </span>
                </div>

                {/* Metadata */}
                <div className="mt-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-2">
                    {look.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                    {look.desc}
                  </p>
                </div>
              </div>
            ))}

            {/* Final CTA Slide */}
            <div className="w-[260px] sm:w-[300px] flex-shrink-0 flex flex-col justify-center items-center p-8 border-2 border-dashed border-[var(--border-mid)] rounded-[4px] bg-white/50 text-center">
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gray-950 mb-3">
                Curated SS '26
              </h4>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-8">
                Explore the complete menswear collection online.
              </p>
              <button
                onClick={handleCtaClick}
                className="btn-primary rounded-[4px] flex items-center gap-3 w-full justify-center !py-4"
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
