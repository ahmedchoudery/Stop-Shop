'use client';

/**
 * ProductGrid — Unified Dark Edition
 * Pure layout renderer — all filtering/sorting delegated to useProducts hook.
 */

import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, FolderOpen, RotateCcw, ChevronDown } from 'lucide-react';
import ProductCard from './ProductCard';
import { useProducts } from '../hooks/useProducts.js';
import { useCart } from '../context/CartContext.tsx';
import SplitText from './SplitText.jsx';

const SORT_OPTIONS = [
  { label: 'Featured',           value: 'popular' },
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

const getAsymmetricClass = () => {
  return "col-span-1";
};

const ProductGrid = ({ products, activeBucket = 'All', activeSubCategory = null }) => {
  const [sortBy, setSortBy] = useState('popular');
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => { setVisibleCount(20); }, [activeBucket, activeSubCategory]);

  const { sortedProducts } = useProducts(products, activeBucket, activeSubCategory, sortBy);
  const { setActiveBucket } = useCart();

  const handleResetFilters = () => {
    if (setActiveBucket) {
      setActiveBucket('All');
    }
  };

  return (
    <div id="product-grid" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">

        {/* ── Section Header ──────────────────────────────── */}
        <div className="mb-10 flex flex-col justify-between gap-6 sm:mb-14 sm:flex-row sm:items-end sm:gap-4">
          <motion.div
            key={activeBucket}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeSubCategory && (
              <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">
                {activeBucket}
              </p>
            )}
            <h2 className="text-2xl font-black uppercase leading-none tracking-tighter text-black sm:text-4xl">
              <SplitText>
                {activeSubCategory ?? (activeBucket !== 'All' ? activeBucket : 'Collection')}
              </SplitText>
            </h2>
            {sortedProducts.length > 0 && (
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {sortedProducts.length} {sortedProducts.length === 1 ? 'piece' : 'pieces'}
              </p>
            )}
          </motion.div>

          {/* Sort Control */}
          <div className="flex w-full items-center justify-between border-t border-gray-100 pt-3 sm:w-auto sm:justify-end sm:border-t-0 sm:pt-0">
            <div className="flex items-center space-x-2 text-gray-400">
              <SlidersHorizontal size={12} className="text-gray-900" />
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-600">Sort</span>
            </div>

            <div className="relative ml-4 inline-flex items-center">
            <label
              htmlFor="sort-select"
              className="sr-only"
            >
              Sort products
            </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="cursor-pointer appearance-none border-b border-gray-900 bg-transparent py-1 pl-2 pr-5 text-right text-[10px] font-black uppercase tracking-[0.15em] text-gray-900 outline-none transition-colors duration-200 focus:border-cardinal sm:text-left"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-white text-gray-900">{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-0 text-gray-900" />
            </div>
          </div>
        </div>

        {/* ── Grid ─────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {sortedProducts.length > 0 ? (
            <motion.div
              key={`${activeBucket}-${activeSubCategory}-${sortBy}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="grid grid-flow-row-dense grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 sm:gap-x-10 sm:gap-y-16 lg:grid-cols-4"
            >
              {sortedProducts.slice(0, visibleCount).map((product, index) => (
                <motion.div key={product.id} variants={itemVariants} className={getAsymmetricClass(index)}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center rounded-[4px] border border-dashed border-[var(--border-mid)] bg-[var(--bg-base)] px-6 py-20 text-center"
            >
              <FolderOpen size={36} className="mb-6 stroke-[1.25] text-gray-400" />
              <h3 className="mb-3 text-lg font-black uppercase tracking-[0.2em] text-black">
                No Pieces Found
              </h3>
              <p className="mb-8 max-w-sm text-xs font-medium leading-relaxed text-gray-500">
                We couldn't find any items in {activeSubCategory ? `"${activeSubCategory}"` : `"${activeBucket}"`}. Check back soon for new additions, or clear the filters to view the full collection.
              </p>
              <button
                onClick={handleResetFilters}
                className="btn-primary flex items-center gap-2.5 rounded-[4px] !py-3.5"
              >
                <RotateCcw size={11} />
                <span>Reset Filters</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Load More ────────────────────────────────────── */}
        {sortedProducts.length > visibleCount && (
          <div className="mt-16 flex justify-center">
            <button
              onClick={() => setVisibleCount(c => c + 20)}
              className="group inline-flex items-center justify-center space-x-4 rounded-[4px] border border-[var(--border-mid)] px-10 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-gray-700 transition-all duration-300 hover:border-black hover:bg-gray-50 active:scale-[0.98]"
            >
              <span>Load More</span>
              <span className="text-[8px] font-bold text-gray-400">
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