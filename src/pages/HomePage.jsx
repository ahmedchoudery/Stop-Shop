/**
 * @fileoverview HomePage — Main storefront
 * Applies: react-patterns (composition, custom hooks),
 *          animejs-animation (section entrance orchestration),
 *          design-spells (category filter morphing, bucket pill animation)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const BUCKETS = ['All', 'Tops', 'Bottoms', 'Footwear', 'Accessories'];

const CategoryBar = ({ active, onChange, products }) => {
  const pillRef = useRef(null);
  const tabRefs = useRef({});
  const containerRef = useRef(null);

  // Animate the sliding pill indicator — design spell
  const movePill = useCallback((bucket) => {
    const tab = tabRefs.current[bucket];
    const container = containerRef.current;
    const pill = pillRef.current;
    if (!tab || !container || !pill) return;

    const tabRect = tab.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const left = tabRect.left - containerRect.left;

    let anime;
    try { anime = require('animejs').default ?? require('animejs'); } catch {
      pill.style.left = `${left}px`;
      pill.style.width = `${tabRect.width}px`;
      return;
    }
    anime({
      targets: pill,
      left: [pill.offsetLeft, left],
      width: [pill.offsetWidth, tabRect.width],
      duration: 350,
      easing: EASING.SPRING,
    });
  }, []);

  useEffect(() => {
    movePill(active);
  }, [active, movePill]);

  // Count per bucket
  const counts = BUCKETS.reduce((acc, b) => {
    acc[b] = b === 'All' ? products.length : products.filter(p => p.bucket === b).length;
    return acc;
  }, {});

  return (
    <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div ref={containerRef} className="flex items-center space-x-1 py-3 relative overflow-x-auto scrollbar-hide">

          {/* Sliding pill background — design spell */}
          <div
            ref={pillRef}
            className="absolute h-8 bg-[#ba1f3d] rounded-lg pointer-events-none transition-none"
            style={{ top: '50%', transform: 'translateY(-50%)', willChange: 'left, width' }}
          />

          {BUCKETS.map(bucket => (
            <button
              key={bucket}
              ref={el => { tabRefs.current[bucket] = el; }}
              onClick={() => onChange(bucket)}
              className={`relative z-10 flex items-center space-x-1.5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors duration-200 rounded-lg flex-shrink-0 ${
                active === bucket ? 'text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>{bucket}</span>
              {counts[bucket] > 0 && (
                <span className={`text-[8px] font-black transition-colors duration-200 ${
                  active === bucket ? 'text-white/70' : 'text-gray-300'
                }`}>
                  {counts[bucket]}
                </span>
              )}
            </button>
          ))}
        </div>
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
  const { activeBucket, setActiveBucket, shouldScrollGrid } = useCart();

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