'use client';

/**
 * @fileoverview PiecesThatSpeak.jsx — Dedicated Best Sellers Showcase
 * Personality: Bright, airy, sophisticated, gallery-like feel.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Heart, ShoppingBag } from 'lucide-react';
import { useNavigate } from '../utils/router-compat.jsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import MediaRenderer from './MediaRenderer.jsx';

/* ─── Pieces Card ───────────────────────────────────────────────────────── */

const PiecesCard = ({ product, index }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();

  const [cartAdded, setCartAdded] = useState(false);
  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock === 0;

  const hasDiscount = product.discount > 0;
  const discountedPrice = hasDiscount ? product.price * (1 - product.discount / 100) : product.price;

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    if (outOfStock) return;
    addToCart({ 
      ...product, 
      selectedSize: product.sizes?.[0] ?? '', 
      selectedColor: product.colors?.[0] ?? '', 
      quantity: 1 
    });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1800);
  }, [addToCart, product, outOfStock]);

  const handleWishlist = useCallback((e) => {
    e.stopPropagation();
    toggleWishlist(product);
  }, [product, toggleWishlist]);

  const renderStars = (rating = 5) => {
    const rounded = Math.round(rating);
    return (
      <div className="flex gap-0.5 text-amber-500">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-[10px]">
            {i < rounded ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  return (
    <article
      className="group relative cursor-pointer flex-shrink-0 transition-all duration-500 bg-[#FAF9F6] border border-gray-150/70 p-4 hover:bg-white hover:shadow-[0_16px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1"
      style={{ width: 'clamp(230px, 28vw, 300px)' }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Index Badge */}
      <span className="absolute top-6 left-6 font-mono text-[8px] font-black text-gray-300 group-hover:text-black transition-colors duration-300 z-20">
        TOP {String(index + 1).padStart(2, '0')}
      </span>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlist}
        className="absolute top-6 right-6 w-8 h-8 rounded-none border border-gray-100 bg-white/80 backdrop-blur-sm text-gray-500 hover:bg-black hover:text-white hover:border-black transition-all duration-300 z-20"
      >
        <Heart 
          size={11} 
          className={wishlisted ? 'fill-black text-black group-hover:fill-white group-hover:text-white' : 'text-gray-500'} 
        />
      </button>

      {/* Image Container with Inner Shadow/Border */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 mb-4 mt-6">
        <MediaRenderer
          src={product.mediaType === 'embed' ? null : product.image}
          embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
          mediaType={product.mediaType}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 border border-black/5 pointer-events-none" />

        {/* Quick Add Overlay */}
        {!outOfStock && (
          <button
            onClick={handleAddToCart}
            className={`absolute bottom-3 right-3 w-9 h-9 rounded-none border backdrop-blur-md shadow-sm flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 z-20 ${
              cartAdded 
                ? 'bg-white text-black border-white' 
                : 'bg-white/95 text-black border-gray-200 hover:bg-black hover:text-white hover:border-black'
            }`}
          >
            <ShoppingBag size={13} />
          </button>
        )}
      </div>

      {/* Metadata & Rating */}
      <div className="px-0.5 relative">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
            {product.subCategory || product.bucket}
          </p>
          {renderStars(product.rating)}
        </div>

        <h3 className="text-[13px] font-bold uppercase tracking-tight text-gray-900 group-hover:text-black transition-colors duration-300 line-clamp-1 mb-2">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-sm font-black text-cardinal font-mono">
                  {formatPrice(discountedPrice)}
                </span>
                <span className="text-xs text-gray-400 line-through font-mono">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold tracking-wide font-mono text-black">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          
          {cartAdded && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-black animate-pulse">
              Added
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

/* ─── Main Component ────────────────────────────────────────────────────── */

export default function PiecesThatSpeak({ products: initialProducts = [], fallbackProducts = [] }) {
  const scrollRef = useRef(null);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }
    fetch('/api/public/featured?section=pieces')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setProducts(data && data.length > 0 ? data : fallbackProducts);
      })
      .catch(err => {
        console.error('[PiecesThatSpeak] fetch failed:', err);
        setProducts(fallbackProducts);
      })
      .finally(() => setLoading(false));
  }, [initialProducts, fallbackProducts]);

  const displayProducts = products.length > 0 ? products : fallbackProducts;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    setScrollProgress((el.scrollLeft / maxScroll) * 100);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    // Initial compute
    setTimeout(handleScroll, 100);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, displayProducts]);

  const scroll = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 320;
    el.scrollBy({ left: dir * cardWidth * 2, behavior: 'smooth' });
  }, []);

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <section id="pieces-speak" className="bg-gradient-to-b from-[#FAF9F6] via-white to-[#FDFCFB] py-20 sm:py-28 border-t border-[var(--border)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16 gap-6">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.55em] text-gray-400 mb-3">
              Best Sellers · Fan Favourites
            </p>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black leading-none">
              Pieces That Speak for Themselves.
            </h2>
          </div>

          {/* Timeline progress line & navigation */}
          <div className="flex items-center gap-4">
            {/* Timeline Progress */}
            <div className="relative w-24 sm:w-32 h-0.5 bg-gray-200 mr-2 overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-black transition-all duration-300 ease-out"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            {/* Arrows */}
            <button
              onClick={() => scroll(-1)}
              className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-black hover:text-black transition-all duration-200 active:scale-95 rounded-none"
              aria-label="Previous items"
            >
              <ArrowLeft size={15} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-black hover:text-black transition-all duration-200 active:scale-95 rounded-none"
              aria-label="Next items"
            >
              <ArrowRight size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Horizontal scroll track */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4 [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {displayProducts.map((product, idx) => (
            <div key={product.id} style={{ scrollSnapAlign: 'start' }}>
              <PiecesCard product={product} index={idx} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
