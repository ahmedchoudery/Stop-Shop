/**
 * @fileoverview SearchOverlay — Cinematic Editorial Edition
 * Replaced anime.js with Framer Motion for declarative physics and stagger.
 * Applies: design-spells (full-screen takeover, high-contrast typography),
 *          glass-premium (backdrop blur, deep saturation)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ArrowRight, TrendingUp, Tag, Command } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
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
          className="fixed inset-0 z-[200] flex flex-col bg-gray-950/80"
          onClick={onClose}
        >
          {/* Header Action */}
          <div className="absolute top-8 right-8 lg:top-12 lg:right-16 z-50">
            <button
              onClick={onClose}
              className="p-4 rounded-full glass-premium hover:bg-white/10 transition-all group active:scale-90"
            >
              <X size={24} className="text-white group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>

          {/* Main Search Interface */}
          <div className="flex-1 overflow-y-auto px-6 py-20 lg:py-32 scrollbar-hide">
            <motion.div
              variants={containerVariants}
              className="max-w-4xl w-full mx-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Giant Input Field — Editorial Style */}
              <div className="relative group">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-[#ba1f3d]" size={36} strokeWidth={3} />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="START TYPING..."
                  className="w-full bg-transparent border-b-4 border-white/10 text-white placeholder:text-white/10 text-4xl lg:text-7xl py-10 pl-16 lg:pl-24 pr-10 outline-none focus:border-[#ba1f3d] transition-all duration-700 font-black tracking-tighter uppercase"
                />
                <div className="absolute right-0 bottom-4 hidden lg:flex items-center space-x-2 text-white/20">
                  <Command size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">ESC to close</span>
                </div>
              </div>

              {/* Results Grid */}
              <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Search Results Column */}
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 border-b border-white/5 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ba1f3d]">Search Results</span>
                    <span className="h-[1px] flex-1 bg-white/5" />
                  </div>

                  {results.length > 0 ? (
                    <div className="space-y-4">
                      {results.map(product => (
                        <motion.button
                          key={product.id}
                          variants={itemVariants}
                          onClick={() => { openDrawer('product', product); onClose(); }}
                          className="w-full flex items-center space-x-6 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left border border-transparent hover:border-white/10"
                        >
                          <div className="w-20 h-24 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 relative">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                            <div className="absolute inset-0 bg-[#ba1f3d]/0 group-hover:bg-[#ba1f3d]/20 transition-colors" />
                          </div>
                          <div className="flex-grow">
                            <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">{product.bucket}</p>
                            <h3 className="text-white font-black uppercase tracking-tight text-lg leading-none mb-2 underline-draw">{product.name}</h3>
                            <p className="text-[#ba1f3d] font-black text-sm tracking-widest">{formatPrice(product.price)}</p>
                          </div>
                          <ArrowRight className="text-white/0 group-hover:text-white/40 -translate-x-4 group-hover:translate-x-0 transition-all duration-500" />
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/20 text-xs font-bold py-10 uppercase tracking-widest">
                      {query ? 'No matching products found.' : 'Enter a search term to begin.'}
                    </p>
                  )}
                </div>

                {/* Discovery / Trending Column */}
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 border-b border-white/5 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Popular Discovery</span>
                    <span className="h-[1px] flex-1 bg-white/5" />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {TRENDING.map((term, i) => (
                      <motion.button
                        key={term}
                        variants={itemVariants}
                        onClick={() => setQuery(term)}
                        className="px-6 py-4 bg-white/5 hover:bg-[#ba1f3d] border border-white/10 hover:border-[#ba1f3d] rounded-full text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 hover:-translate-y-2 group"
                      >
                        <span className="flex items-center space-x-3">
                          <TrendingUp size={14} className="text-[#ba1f3d] group-hover:text-white" />
                          <span>{term}</span>
                        </span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Suggestion Cards */}
                  <motion.div 
                    variants={itemVariants}
                    className="mt-12 glass-premium rounded-3xl p-8 border-[#ba1f3d]/20"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <Tag size={16} className="text-[#ba1f3d]" />
                      <h4 className="text-white font-black uppercase tracking-widest text-xs">Cardinal Collections</h4>
                    </div>
                    <p className="text-white/40 text-[11px] leading-relaxed mb-6 font-medium">
                      Explore our hand-picked selections for the current season. From linen essentials to signature Pakistan-made accessories.
                    </p>
                    <button className="text-[#ba1f3d] text-[10px] font-black uppercase tracking-[0.3em] hover:tracking-[0.4em] transition-all flex items-center space-x-2">
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
