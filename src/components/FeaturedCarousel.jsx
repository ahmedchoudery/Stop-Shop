'use client';

/**
 * @fileoverview FeaturedCarousel.jsx — Horizontal Product Carousel
 * Theme: Minimalist editorial lookbook. White section, round actions, 1-line headline.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Heart, ShoppingBag } from 'lucide-react';
import { useNavigate } from '../utils/router-compat.jsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import MediaRenderer from './MediaRenderer.jsx';

/* ─── Carousel Card ─────────────────────────────────────────────────────── */

const CarouselCard = ({ product, theme, index = 0 }) => {
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
    addToCart({ ...product, selectedSize: product.sizes?.[0] ?? '', selectedColor: product.colors?.[0] ?? '', quantity: 1 });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1800);
  }, [addToCart, product, outOfStock]);

  const handleWishlist = useCallback((e) => {
    e.stopPropagation();
    toggleWishlist(product);
  }, [product, toggleWishlist]);

  const category = product.subCategory && product.subCategory.toLowerCase() !== 'general'
    ? product.subCategory
    : product.bucket;

  return (
    <article
      className="group relative cursor-pointer flex-shrink-0 transition-all duration-500"
      style={{ width: 'clamp(220px, 28vw, 290px)' }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image Wrapper */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 mb-4 transition-all duration-500 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
        <MediaRenderer
          src={product.mediaType === 'embed' ? null : product.image}
          embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
          mediaType={product.mediaType}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
        />

        {/* Clean border outline */}
        <div className={`absolute inset-0 border transition-all duration-500 z-10 pointer-events-none ${
          theme === 'dark' 
            ? 'border-white/5 group-hover:border-white/20 group-hover:shadow-[inset_0_0_24px_rgba(255,255,255,0.03)]' 
            : 'border-gray-100 group-hover:border-black/20'
        }`} />

        {/* Top-Right Wishlist Button - Transparent and Minimalist */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 w-8 h-8 rounded-none border backdrop-blur-sm shadow-sm flex items-center justify-center transition-all duration-300 group/wishlist z-20 ${
            theme === 'dark'
              ? 'bg-[#1a1a1a]/85 border-white/10 text-white hover:bg-white hover:text-black'
              : 'bg-white/85 border-gray-200 text-gray-650 hover:bg-black hover:text-white'
          }`}
        >
          <Heart 
            size={12} 
            className={`transition-all duration-300 ${
              wishlisted 
                ? (theme === 'dark' ? 'fill-white text-white group-hover/wishlist:fill-black group-hover/wishlist:text-black' : 'fill-black text-black group-hover/wishlist:fill-white group-hover/wishlist:text-white')
                : (theme === 'dark' ? 'text-gray-300 group-hover/wishlist:text-black' : 'text-gray-500 group-hover/wishlist:text-white')
            }`} 
          />
        </button>

        {/* Bottom-Right Add to Bag Button - Elegant Quick Add */}
        {!outOfStock && (
          <button
            onClick={handleAddToCart}
            className={`absolute bottom-3 right-3 w-9 h-9 rounded-none border backdrop-blur-md shadow-sm flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 z-20 ${
              cartAdded 
                ? 'bg-white text-black border-white' 
                : theme === 'dark'
                  ? 'bg-[#1a1a1b]/95 text-white border-white/15 hover:bg-white hover:text-black hover:border-white'
                  : 'bg-white/90 text-black border-gray-200 hover:bg-black hover:text-white hover:border-black'
            }`}
          >
            <ShoppingBag size={13} className="transition-transform duration-200" />
          </button>
        )}

        {/* Limited Drop Pulse Tag */}
        {theme === 'dark' && !outOfStock && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-0.5 z-20 bg-black/70 border border-white/10 backdrop-blur-sm shadow-sm rounded-none">
            <span className="w-1 h-1 rounded-full bg-white animate-ping" />
            <span className="text-[7px] font-black uppercase tracking-[0.25em] text-white">
              LIMITED
            </span>
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && !outOfStock && (
          <div className={`absolute top-3 left-3 px-2 py-1 z-20 shadow-none border ${
            theme === 'dark'
              ? 'bg-white text-black border-black/10'
              : 'bg-black text-white border-white/10'
          }`}>
            <span className="text-[7px] font-black uppercase tracking-[0.35em]">
              {product.discount}% OFF
            </span>
          </div>
        )}

        {/* Out of Stock Label */}
        {outOfStock && (
          <div className={`absolute top-3 left-3 px-2 py-0.5 border z-20 ${
            theme === 'dark'
              ? 'bg-[#1a1a1a]/90 text-gray-400 border-white/5'
              : 'bg-white/95 text-gray-500 border-gray-100'
          }`}>
            <span className="text-[8px] font-black uppercase tracking-[0.25em]">Sold Out</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-0.5 relative z-10">
        {/* Large low-opacity numbered index behind details */}
        {theme === 'dark' && (
          <div className="absolute right-0 -top-4 font-mono text-[80px] font-black text-white/[0.02] select-none pointer-events-none transition-colors duration-500 group-hover:text-white/[0.05] leading-none z-0">
            {String(index + 1).padStart(2, '0')}
          </div>
        )}

        <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-gray-400 mb-1">{category}</p>
        <h3 className={`text-sm font-bold uppercase tracking-tight leading-snug transition-colors duration-300 line-clamp-1 mb-1 ${
          theme === 'dark' ? 'text-white group-hover:text-white/80' : 'text-gray-900 group-hover:text-black'
        }`}>
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
              <span className={`text-sm font-bold tracking-wide font-mono ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}>
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          {cartAdded && (
            <span className={`text-[9px] font-bold uppercase tracking-wider animate-pulse ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              Added
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

/* ─── FeaturedCarousel ──────────────────────────────────────────────────── */

export default function FeaturedCarousel({ products = [], headline, subline, theme = 'light' }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const CARD_WIDTH = 306;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState]);

  const scroll = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * CARD_WIDTH * 2, behavior: 'smooth' });
  }, []);

  if (!products.length) return null;

  return (
    <section
      id={theme === 'dark' ? 'featured-drop' : 'pieces-speak'}
      className={`py-16 sm:py-24 overflow-hidden border-t ${
        theme === 'dark'
          ? 'bg-gradient-to-tr from-[#050507] via-[#0E0E12] to-[#08080A] text-white border-white/10'
          : 'bg-white text-black border-[var(--border)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* Section Header */}
        <div className="flex items-end justify-between mb-10 sm:mb-14 gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 mb-2">
              {subline}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none sm:whitespace-nowrap">
              {theme === 'dark' ? "The Drop You've Been Waiting For." : "Pieces That Speak for Themselves."}
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className={`w-10 h-10 rounded-none border flex items-center justify-center transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed group ${
                theme === 'dark'
                  ? 'border-white/10 hover:border-white hover:bg-white text-white hover:text-black'
                  : 'border-gray-200 hover:border-black hover:bg-black text-black hover:text-white'
              }`}
            >
              <ArrowLeft size={16} className="transition-colors duration-300" />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className={`w-10 h-10 rounded-none border flex items-center justify-center transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed group ${
                theme === 'dark'
                  ? 'border-white/10 hover:border-white hover:bg-white text-white hover:text-black'
                  : 'border-gray-200 hover:border-black hover:bg-black text-black hover:text-white'
              }`}
            >
              <ArrowRight size={16} className="transition-colors duration-300" />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Track */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {products.map((product, idx) => (
            <div key={product.id} style={{ scrollSnapAlign: 'start' }}>
              <CarouselCard product={product} theme={theme} index={idx} />
            </div>
          ))}
        </div>

        {/* Scroll indicator dots */}
        <div className="flex items-center gap-1.5 mt-6">
          <div className={`h-px transition-all duration-300 ${
            theme === 'dark'
              ? (canScrollLeft ? 'w-6 bg-white' : 'w-3 bg-white/10')
              : (canScrollLeft ? 'w-6 bg-black' : 'w-3 bg-gray-200')
          }`} />
          <div className={`h-px transition-all duration-300 ${
            theme === 'dark'
              ? (!canScrollLeft && !canScrollRight ? 'w-6 bg-white' : 'w-3 bg-white/10')
              : (!canScrollLeft && !canScrollRight ? 'w-6 bg-black' : 'w-3 bg-gray-200')
          }`} />
          <div className={`h-px transition-all duration-300 ${
            theme === 'dark'
              ? (!canScrollRight ? 'w-6 bg-white' : 'w-3 bg-white/10')
              : (!canScrollRight ? 'w-6 bg-black' : 'w-3 bg-gray-200')
          }`} />
        </div>
      </div>
    </section>
  );
}
