/**
 * @fileoverview SearchOverlay — Design Spells Edition
 * Applies: animejs-animation (backdrop scale, result stagger),
 *          design-spells (full-screen takeover, live search magic)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, ArrowRight, TrendingUp, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { useDebounce } from '../hooks/useUtils.js';
import { EASING } from '../hooks/useAnime.js';

const TRENDING = ['Polo Shirts', 'Linen Shirts', 'Canvas Sneakers', 'Slim Denim', 'Hoodies'];

const SearchOverlay = ({ isOpen, onClose, products = [] }) => {
  const [query, setQuery] = useState('');
  const { openDrawer } = useCart();
  const { formatPrice } = useCurrency();
  const inputRef = useRef(null);
  const overlayRef = useRef(null);
  const resultsRef = useRef(null);

  const debouncedQuery = useDebounce(query, 180);

  const results = debouncedQuery.trim().length > 0
    ? products.filter(p =>
        p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        p.bucket?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        p.subCategory?.toLowerCase().includes(debouncedQuery.toLowerCase())
      ).slice(0, 7)
    : [];

  // ── Entrance animation ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;

    let anime;
    try { anime = require('animejs').default ?? require('animejs'); } catch { return; }

    anime.set(overlayRef.current, { opacity: 0 });
    anime({
      targets: overlayRef.current,
      opacity: [0, 1],
      duration: 250,
      easing: 'easeOutQuad',
    });

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // ── Results stagger ───────────────────────────────────────────
  useEffect(() => {
    if (!resultsRef.current || !results.length) return;
    let anime;
    try { anime = require('animejs').default ?? require('animejs'); } catch { return; }

    const items = resultsRef.current.querySelectorAll('[data-result]');
    anime.set(items, { opacity: 0, translateY: 10 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 300,
      delay: anime.stagger(40),
      easing: EASING.QUART_OUT,
    });
  }, [results.length, debouncedQuery]);

  // ── Keyboard navigation ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // ── Body scroll lock ──────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex flex-col"
      onClick={onClose}
      style={{ opacity: 0 }}
    >
      {/* Frosted backdrop */}
      <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-md" />

      {/* Content */}
      <div
        className="relative z-10 max-w-2xl w-full mx-auto mt-20 px-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="relative flex items-center mb-4 animate-slide-up">
          <Search className="absolute left-5 text-white/40" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search collection..."
            className="w-full bg-white/8 backdrop-blur-sm border border-white/15 text-white placeholder:text-white/30 text-xl font-medium py-5 pl-14 pr-14 rounded-2xl outline-none focus:border-white/35 focus:bg-white/12 transition-all duration-300 font-bold tracking-tight"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-5 text-white/40 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Results / Trending */}
        <div
          className="bg-white/6 backdrop-blur-xl border border-white/12 rounded-2xl overflow-hidden"
          style={{ animation: 'slideUp 0.3s ease-out forwards' }}
        >
          {/* No results */}
          {debouncedQuery && results.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-white/50 font-bold uppercase tracking-widest text-sm">
                No results for "{debouncedQuery}"
              </p>
            </div>
          )}

          {/* Search results */}
          {results.length > 0 && (
            <div ref={resultsRef} className="divide-y divide-white/8">
              {results.map(product => (
                <button
                  key={product.id}
                  data-result
                  onClick={() => { openDrawer('product', product); onClose(); }}
                  className="w-full flex items-center space-x-4 p-4 hover:bg-white/8 transition-all duration-200 text-left group"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-white font-black uppercase tracking-tight text-sm truncate">
                      {product.name}
                    </p>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mt-0.5">
                      {product.bucket} · {product.subCategory}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[#ba1f3d] font-black text-sm">{formatPrice(product.price)}</p>
                    <ArrowRight size={13} className="text-white/20 group-hover:text-white/60 ml-auto mt-1 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Trending — shown when no query */}
          {!debouncedQuery && (
            <div className="p-5">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp size={13} className="text-[#ba1f3d]" />
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">
                  Trending Searches
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING.map(term => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-4 py-2 bg-white/8 hover:bg-white/15 border border-white/12 hover:border-white/30 rounded-xl text-white text-[10px] font-bold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-white/20 text-[9px] font-black uppercase tracking-[0.4em] mt-5">
          Press ESC or click outside to close
        </p>
      </div>
    </div>
  );
};

export default SearchOverlay;