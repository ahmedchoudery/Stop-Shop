/**
 * ProductGrid — Unified Dark Edition
 * Pure layout renderer — all filtering/sorting delegated to useProducts hook.
 */

import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, FolderOpen, RotateCcw } from 'lucide-react';
import ProductCard from './ProductCard';
import { useProducts } from '../hooks/useProducts.js';
import { useCart } from '../context/CartContext.tsx';

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

const getAsymmetricClass = (index) => {
  const mod = index % 8;
  if (mod === 0) {
    return "col-span-2 sm:col-span-2 lg:col-span-2 row-span-2";
  }
  if (mod === 3) {
    return "col-span-1 lg:mt-12 sm:mt-6";
  }
  if (mod === 5) {
    return "col-span-1 lg:-mt-12 sm:-mt-6";
  }
  if (mod === 7) {
    return "col-span-1 lg:mt-6";
  }
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
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* ── Section Header ──────────────────────────────── */}
        <div className="flex items-end justify-between mb-12">
          <motion.div
            key={activeBucket}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeSubCategory && (
              <p className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-500 mb-2">
                {activeBucket}
              </p>
            )}
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black leading-none">
              {activeSubCategory ?? (activeBucket !== 'All' ? activeBucket : 'Collection')}
            </h2>
            {sortedProducts.length > 0 && (
              <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-widest">
                {sortedProducts.length} {sortedProducts.length === 1 ? 'piece' : 'pieces'}
              </p>
            )}
          </motion.div>

          {/* Sort */}
          <div className="flex items-center space-x-3">
            <SlidersHorizontal size={13} className="text-gray-500" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent border-b border-[var(--border-mid)] focus:border-black text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 outline-none cursor-pointer py-1 pr-5 transition-colors duration-200 appearance-none"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-white text-gray-900">{opt.label}</option>
              ))}
            </select>
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
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-flow-row-dense gap-x-6 gap-y-12 sm:gap-x-10 sm:gap-y-16"
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
              className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-[var(--border-mid)] text-center bg-[var(--bg-base)] rounded-[4px]"
            >
              <FolderOpen size={36} className="text-gray-400 mb-6 stroke-[1.25]" />
              <h3 className="text-lg font-black uppercase tracking-[0.2em] text-black mb-3">
                No Pieces Found
              </h3>
              <p className="text-gray-500 text-xs font-medium max-w-sm leading-relaxed mb-8">
                We couldn't find any items in {activeSubCategory ? `"${activeSubCategory}"` : `"${activeBucket}"`}. Check back soon for new additions, or clear the filters to view the full collection.
              </p>
              <button
                onClick={handleResetFilters}
                className="btn-primary rounded-[4px] !py-3.5 flex items-center gap-2.5"
              >
                <RotateCcw size={11} />
                <span>Reset Filters</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Load More ────────────────────────────────────── */}
        {sortedProducts.length > visibleCount && (
          <div className="flex justify-center mt-16">
            <button
              onClick={() => setVisibleCount(c => c + 20)}
              className="group inline-flex items-center justify-center space-x-4 border border-[var(--border-mid)] rounded-[4px] px-10 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-gray-700 hover:border-black hover:bg-gray-50 transition-all duration-300 active:scale-[0.98]"
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