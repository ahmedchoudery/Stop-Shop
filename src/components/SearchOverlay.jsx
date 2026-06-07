/**
 * @fileoverview SearchOverlay — Cinematic Editorial Edition
 * Theme: Light glass overlay matching the Warm Bone & Charcoal theme.
 * Replaced dark styling with high-contrast editorial typography, light cards, and iOS-native touch states.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ArrowRight, TrendingUp, Tag, Command } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { useDebounce, useScrollLock } from '../hooks/useUtils.js';

const TRENDING = ['Polo Shirts', 'Linen Shirts', 'Canvas Sneakers', 'Slim Denim', 'Hoodies'];

const SearchOverlay = ({ isOpen, onClose, products = [] }) => {
  const [query, setQuery] = useState('');
  const { openDrawer } = useCart();
  const { formatPrice } = useCurrency();
  const inputRef = useRef(null);

  const debouncedQuery = useDebounce(query, 180);

  const results = debouncedQuery.trim().length > 0
    ? products.filter(p =>
        p.name?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        p.bucket?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        p.subCategory?.toLowerCase().includes(debouncedQuery.toLowerCase())
      ).slice(0, 10)
    : [];

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Body scroll lock
  useScrollLock(isOpen);

  // Framer Motion Variants
  const overlayVariants = {
    closed: { opacity: 0, backdropFilter: 'blur(0px)' },
    open: { 
      opacity: 1, 
      backdropFilter: 'blur(24px)',
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const containerVariants = {
    closed: { opacity: 0, scale: 0.98, y: 20 },
    open: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: -10 },
    open: { opacity: 1, x: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={overlayVariants}
          className="fixed inset-0 z-[200] flex flex-col bg-[#F7F6F3]/95"
          onClick={onClose}
        >
          {/* Header Action */}
          <div className="absolute top-8 right-8 lg:top-12 lg:right-16 z-50">
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-[4px] glass-premium hover:bg-black/5 flex items-center justify-center transition-all active-scale"
              aria-label="Close search"
            >
              <X size={22} className="text-black hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>

          {/* Main Search Interface */}
          <div className="flex-1 overflow-y-auto px-6 py-20 lg:py-32 scrollbar-hide -webkit-overflow-scrolling-touch">
            <motion.div
              variants={containerVariants}
              className="max-w-4xl w-full mx-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Giant Input Field — Editorial Style */}
              <div className="relative group">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-cardinal" size={32} strokeWidth={2.5} />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="START TYPING..."
                  className="w-full bg-transparent border-b-4 border-black/10 text-gray-900 placeholder:text-gray-300/60 text-3xl lg:text-6xl py-8 pl-14 lg:pl-20 pr-10 outline-none focus:border-cardinal transition-all duration-700 font-black tracking-tighter uppercase"
                />
                <div className="absolute right-0 bottom-4 hidden lg:flex items-center space-x-2 text-gray-400/60">
                  <Command size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">ESC to close</span>
                </div>
              </div>

              {/* Results Grid */}
              <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Search Results Column */}
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 border-b border-gray-200/60 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cardinal font-heading">Search Results</span>
                    <span className="h-[1px] flex-1 bg-gray-200/60" />
                  </div>

                  {results.length > 0 ? (
                    <div className="space-y-3">
                      {results.map(product => (
                        <motion.button
                          key={product.id}
                          variants={itemVariants}
                          onClick={() => { openDrawer('product', product); onClose(); }}
                          className="w-full flex items-center space-x-5 p-3.5 bg-white border border-gray-200/60 rounded-[4px] hover:border-black/20 hover:shadow-sm active-scale transition-all group text-left"
                        >
                          <div className="w-16 h-20 rounded-[4px] overflow-hidden bg-gray-100 flex-shrink-0 relative">
                            {product.image && (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                            )}
                            <div className="absolute inset-0 bg-cardinal/0 group-hover:bg-cardinal/10 transition-colors" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-1">{product.bucket}</p>
                            <h3 className="text-gray-900 font-black uppercase tracking-tight text-sm leading-tight mb-1 truncate">{product.name}</h3>
                            <p className="text-cardinal font-black text-xs tracking-wider">{formatPrice(product.price)}</p>
                          </div>
                          <ArrowRight className="text-gray-400/0 group-hover:text-gray-400/80 -translate-x-3 group-hover:translate-x-0 transition-all duration-300 flex-shrink-0" size={16} />
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs font-bold py-10 uppercase tracking-widest pl-2">
                      {query ? 'No matching products found.' : 'Enter a search term to begin.'}
                    </p>
                  )}
                </div>

                {/* Discovery / Trending Column */}
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 border-b border-gray-200/60 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Popular Discovery</span>
                    <span className="h-[1px] flex-1 bg-gray-200/60" />
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {TRENDING.map((term) => (
                      <motion.button
                        key={term}
                        variants={itemVariants}
                        onClick={() => setQuery(term)}
                        className="px-5 py-3 bg-white hover:bg-black border border-gray-200/80 hover:border-black rounded-[4px] text-gray-800 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 active-scale group shadow-sm flex items-center"
                      >
                        <span className="flex items-center space-x-2.5">
                          <TrendingUp size={13} className="text-cardinal group-hover:text-white transition-colors" />
                          <span>{term}</span>
                        </span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Suggestion Cards */}
                  <motion.div 
                    variants={itemVariants}
                    className="mt-12 bg-white border border-gray-200 rounded-[4px] p-6 shadow-sm"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <Tag size={15} className="text-cardinal" />
                      <h4 className="text-gray-900 font-black uppercase tracking-widest text-[10px]">Cardinal Collections</h4>
                    </div>
                    <p className="text-gray-500 text-[11px] leading-relaxed mb-5 font-bold uppercase tracking-wider">
                      Explore our hand-picked selections for the current season. From linen essentials to signature Pakistan-made accessories.
                    </p>
                    <button className="text-cardinal text-[10px] font-black uppercase tracking-[0.3em] hover:tracking-[0.35em] transition-all flex items-center space-x-2 active-scale py-1">
                      <span>Browse All Collections</span>
                      <span>→</span>
                    </button>
                  </motion.div>
                </div>

              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
