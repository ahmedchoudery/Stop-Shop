/**
 * ProductGrid — Premium Minimalist Edition
 * Clean section header, tight grid gaps, smooth filter transitions.
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import ProductCard from './ProductCard';

const SORT_OPTIONS = [
  { label: 'Featured',          value: 'popular' },
  { label: 'Price: Low to High', value: 'price-low' },
  { label: 'Price: High to Low', value: 'price-high' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

const ProductGrid = ({ products, activeBucket = 'All', activeSubCategory = null }) => {
  const [sortBy, setSortBy] = useState('popular');
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => { setVisibleCount(20); }, [activeBucket, activeSubCategory]);

  const sortedProducts = useMemo(() => {
    const filtered = products.filter(item => {
      const bucketMatch = activeBucket === 'All' || item.bucket === activeBucket;
      const subMatch = !activeSubCategory || item.subCategory === activeSubCategory;
      return bucketMatch && subMatch;
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === 'popular')    return b.rating - a.rating;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'price-low')  return a.price - b.price;
      return 0;
    });
  }, [products, activeBucket, activeSubCategory, sortBy]);

  return (
    <div id="product-grid" className="bg-white py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* ── Section Header ─────────────────────────────────── */}
        <div className="flex items-end justify-between mb-12">
          <motion.div
            key={activeBucket}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeSubCategory && (
              <p className="text-[8px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">
                {activeBucket}
              </p>
            )}
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-gray-900 leading-none">
              {activeSubCategory ?? (activeBucket !== 'All' ? activeBucket : 'Collection')}
            </h2>
            {sortedProducts.length > 0 && (
              <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">
                {sortedProducts.length} {sortedProducts.length === 1 ? 'piece' : 'pieces'}
              </p>
            )}
          </motion.div>

          {/* Sort */}
          <div className="flex items-center space-x-3">
            <SlidersHorizontal size={13} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent border-b border-gray-200 focus:border-gray-900 text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 outline-none cursor-pointer py-1 pr-5 transition-colors duration-200 appearance-none"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Grid ────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {sortedProducts.length > 0 ? (
            <motion.div
              key={`${activeBucket}-${activeSubCategory}-${sortBy}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10 sm:gap-x-8 sm:gap-y-14"
            >
              {sortedProducts.slice(0, visibleCount).map(product => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-28 border border-dashed border-gray-200"
            >
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-300 mb-2">
                Dropping Soon
              </p>
              <p className="text-[9px] font-bold text-gray-200 uppercase tracking-widest">
                {activeSubCategory ? `${activeSubCategory} · ` : ''}{activeBucket !== 'All' ? activeBucket : 'New Arrivals'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Load More ────────────────────────────────────────── */}
        {sortedProducts.length > visibleCount && (
          <div className="flex justify-center mt-16">
            <button
              onClick={() => setVisibleCount(c => c + 20)}
              className="group flex items-center space-x-4 px-10 py-4 border border-gray-300 text-[10px] font-black uppercase tracking-[0.35em] text-gray-700 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 transition-all duration-300"
            >
              <span>Load More</span>
              <span className="text-[8px] text-gray-400 font-bold">
                ({sortedProducts.length - visibleCount} remaining)
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ProductGrid);