/**
 * @fileoverview HomePage — Main storefront
 * Fix: replaced require('animejs') with ESM import — category pill animation now works
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import anime from 'animejs';
import PowerOfChoiceHero from '../components/PowerOfChoiceHero.jsx';
import MarqueeBar from '../components/MarqueeBar.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import ReviewsSection from '../components/ReviewsSection.jsx';
import Newsletter from '../components/Newsletter.jsx';
import RecentlyViewedSection from '../components/RecentlyViewedSection.jsx';
import { usePublicProducts } from '../hooks/useDomain.js';
import { useCart } from '../context/CartContext.jsx';
import { EASING } from '../hooks/useAnime.js';

// ─────────────────────────────────────────────────────────────────
// CATEGORY FILTER BAR — Design Spell: morphing active pill
// ─────────────────────────────────────────────────────────────────

import { motion, AnimatePresence as MotionAnimatePresence } from 'framer-motion';

const BUCKETS = ['All', 'Tops', 'Bottoms', 'Footwear', 'Accessories'];

const CategoryBar = ({ active, activeSub, onChange, products }) => {
  // Count per bucket
  const counts = useMemo(() => BUCKETS.reduce((acc, b) => {
    acc[b] = b === 'All' ? products.length : products.filter(p => p.bucket === b).length;
    return acc;
  }, {}), [products]);

  // Filter subcategories for the active bucket
  const subCategories = useMemo(() => {
    if (active === 'All') return [];
    return [...new Set(products
      .filter(p => p.bucket === active && p.subCategory && p.subCategory.toLowerCase() !== 'general')
      .map(p => p.subCategory)
    )].sort();
  }, [active, products]);

  return (
    <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center space-x-1 py-4 relative overflow-x-auto scrollbar-hide">
          {BUCKETS.map(bucket => (
            <button
              key={bucket}
              onClick={() => onChange(bucket)}
              className={`relative px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-colors duration-300 rounded-full flex-shrink-0 ${
                active === bucket ? 'text-white' : 'text-gray-500 hover:text-gray-900 group'
              }`}
            >
              <span className="relative z-10">{bucket}</span>
              {counts[bucket] > 0 && (
                <span className={`relative z-10 ml-2 text-[8px] font-black opacity-60 ${
                  active === bucket ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'
                }`}>
                  {counts[bucket]}
                </span>
              )}
              
              {active === bucket && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 bg-[#ba1f3d] rounded-full shadow-[0_8px_20px_rgba(186,31,61,0.25)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Subcategories — liquid entrance */}
        <MotionAnimatePresence mode="wait">
          {subCategories.length > 0 && (
            <motion.div 
              key={active}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center space-x-2 py-4 border-t border-gray-50 overflow-x-auto scrollbar-hide"
            >
              <button
                onClick={() => onChange(active, null)}
                className={`relative px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-full transition-all whitespace-nowrap ${
                  !activeSub ? 'text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                <span className="relative z-10">All {active}</span>
                {!activeSub && (
                  <motion.div
                    layoutId="activeSubCategoryPill"
                    className="absolute inset-0 bg-gray-900 rounded-full shadow-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
              {subCategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => onChange(active, sub)}
                  className={`relative px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-full transition-all whitespace-nowrap ${
                    activeSub === sub ? 'text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <span className="relative z-10">{sub}</span>
                  {activeSub === sub && (
                    <motion.div
                      layoutId="activeSubCategoryPill"
                      className="absolute inset-0 bg-gray-900 rounded-full shadow-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </MotionAnimatePresence>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// PRODUCT SKELETON LOADING STATE
// ─────────────────────────────────────────────────────────────────

const ProductSkeleton = () => (
  <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
    <div className="mb-16">
      <div className="h-3 w-32 bg-gray-100 rounded animate-shimmer mb-4" />
      <div className="h-10 w-64 bg-gray-100 rounded animate-shimmer" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-4" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="aspect-[4/5] bg-gray-100 rounded-sm animate-shimmer" />
          <div className="h-3 w-3/4 bg-gray-100 rounded animate-shimmer" />
          <div className="h-5 w-1/2 bg-gray-100 rounded animate-shimmer" />
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────────

const HomePage = ({ onProductsLoaded }) => {
  const { products, loading, error } = usePublicProducts();
  const { activeBucket, activeSubCategory, setActiveBucket, shouldScrollGrid } = useCart();

  // Notify parent of loaded products (for search overlay)
  useEffect(() => {
    if (products.length > 0 && onProductsLoaded) {
      onProductsLoaded(products);
    }
  }, [products, onProductsLoaded]);

  // Scroll to grid when bucket changes from navbar
  useEffect(() => {
    if (shouldScrollGrid > 0) {
      const grid = document.getElementById('product-grid');
      if (grid) {
        setTimeout(() => {
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [shouldScrollGrid]);

  return (
    <div>
      {/* Hero */}
      <PowerOfChoiceHero />

      {/* Category filter — sticky below navbar */}
      {!loading && products.length > 0 && (
        <CategoryBar
          active={activeBucket}
          activeSub={activeSubCategory}
          onChange={setActiveBucket}
          products={products}
        />
      )}

      {/* Products */}
      {loading ? (
        <ProductSkeleton />
      ) : error ? (
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <p className="text-gray-400 font-black uppercase tracking-widest text-sm mb-4">
            Could not load products
          </p>
          <p className="text-gray-300 text-xs">{error}</p>
        </div>
      ) : (
        <ProductGrid
          products={products}
          activeBucket={activeBucket}
          activeSubCategory={activeSubCategory}
        />
      )}

      {/* Reviews */}
      <ReviewsSection />

      {/* Recently Viewed */}
      <RecentlyViewedSection />

      {/* Newsletter */}
      <Newsletter />
    </div>
  );
};

export default HomePage;
