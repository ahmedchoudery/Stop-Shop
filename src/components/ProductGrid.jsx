/**
 * @fileoverview ProductGrid — Stagger reveal with anime.js
 * Fix: replaced require('animejs') with ESM import — card stagger animations now work
 */

import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import anime from 'animejs';
import ProductCard from './ProductCard.jsx';
import { useCart } from '../context/CartContext.jsx';
import { SlidersHorizontal } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-low', label: 'Price: Low → High' },
  { value: 'price-high', label: 'Price: High → Low' },
];

const ProductGrid = ({ products, activeBucket = 'All', activeSubCategory = null }) => {
  const { openDrawer, sortBy, setSortBy } = useCart();
  const gridRef = useRef(null);
  const headingRef = useRef(null);
  const prevBucket = useRef(activeBucket);

  const handleSelectProduct = useCallback((product) => {
    openDrawer('product', product);
  }, [openDrawer]);

  // ── Filtered + sorted products ────────────────────────────────
  const sortedProducts = useMemo(() => {
    const filtered = products.filter(item => {
      const bucketMatch = activeBucket === 'All' || item.bucket === activeBucket;
      const subMatch = !activeSubCategory || item.subCategory === activeSubCategory;
      return bucketMatch && subMatch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'popular') return b.rating - a.rating;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'price-low') return a.price - b.price;
      return 0;
    });
  }, [products, activeBucket, activeSubCategory, sortBy]);

  // ── Anime.js scroll-triggered stagger reveal ─────────────────
  useEffect(() => {
    if (!gridRef.current || sortedProducts.length === 0) return;

    const cards = gridRef.current.querySelectorAll('.product-card-wrap');
    const bucketChanged = prevBucket.current !== activeBucket;
    prevBucket.current = activeBucket;

    if (bucketChanged) {
      anime.set(cards, { opacity: 0, translateY: 40, scale: 0.96 });
    }

    const runAnimation = () => {
      anime({
        targets: cards,
        opacity: [0, 1],
        translateY: [40, 0],
        scale: [0.96, 1],
        duration: 800,
        delay: anime.stagger(70, { from: 'first' }),
        easing: EASING.FABRIC,
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -50px 0px' }
    );

    if (gridRef.current) observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, [sortedProducts, activeBucket]);

  // ── Heading stagger ───────────────────────────────────────────
  useEffect(() => {
    if (!headingRef.current) return;
    anime({
      targets: headingRef.current,
      opacity: [0, 1],
      translateX: [-20, 0],
      duration: 500,
      easing: EASING.QUART_OUT,
    });
  }, [activeBucket]);

  return (
    <div id="product-grid" className="bg-white py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Section Header */}
        <div className="flex items-end justify-between mb-16">
          <div ref={headingRef} style={{ opacity: 0 }}>
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-3">
              Curated Selection
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">
              {activeBucket !== 'All' ? activeBucket : 'Complete Catalog'}
            </h2>
            {sortedProducts.length > 0 && (
              <p className="text-sm text-gray-400 font-bold mt-2">
                {sortedProducts.length} {sortedProducts.length === 1 ? 'piece' : 'pieces'}
              </p>
            )}
          </div>

          {/* Sort control — design spell: smooth dropdown */}
          <div className="flex items-center space-x-3">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent border-b-2 border-gray-200 focus:border-[#ba1f3d] text-[10px] font-black uppercase tracking-widest text-gray-600 outline-none cursor-pointer py-1 transition-colors duration-200 appearance-none pr-6"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {sortedProducts.length > 0 ? (
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-14"
          >
            {sortedProducts.map((product) => (
              <div
                key={product.id}
                className="product-card-wrap"
                style={{ opacity: 0, willChange: 'transform, opacity' }}
              >
                <ProductCard
                  product={product}
                  onSelectProduct={() => handleSelectProduct(product)}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyGrid activeBucket={activeBucket} activeSubCategory={activeSubCategory} />
        )}
      </div>
    </div>
  );
};

const EmptyGrid = ({ activeBucket, activeSubCategory }) => (
  <div className="flex flex-col justify-center items-center h-[40vh] w-full border border-dashed border-gray-200 bg-gray-50/30 rounded-2xl animate-fade-in">
    <p className="text-gray-400 font-black tracking-[0.5em] uppercase text-xs mb-3">
      Collection Dropping Soon
    </p>
    <p className="text-gray-300 font-bold tracking-[0.2em] text-[10px] uppercase italic">
      {activeSubCategory ? `${activeSubCategory} · ` : ''}{activeBucket !== 'All' ? activeBucket : 'New Arrivals'}
    </p>
  </div>
);

export default memo(ProductGrid);
