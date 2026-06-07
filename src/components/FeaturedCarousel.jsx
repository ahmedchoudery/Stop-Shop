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

const CarouselCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();

  const [cartAdded, setCartAdded] = useState(false);
  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock === 0;

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
      className="group relative cursor-pointer flex-shrink-0"
      style={{ width: 'clamp(220px, 28vw, 290px)' }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image Wrapper */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 mb-3.5">
        <MediaRenderer
          src={product.mediaType === 'embed' ? null : product.image}
          embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
          mediaType={product.mediaType}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />

        {/* Clean border outline */}
        <div className="absolute inset-0 border border-gray-100 group-hover:border-black/20 transition-colors duration-500 z-10 pointer-events-none" />

        {/* Top-Right Wishlist Button - Transparent and Minimalist */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-8 h-8 rounded-[4px] bg-white/80 border border-gray-200/40 backdrop-blur-sm shadow-sm flex items-center justify-center transition-all duration-300 hover:bg-black hover:text-white group/wishlist z-20"
        >
          <Heart 
            size={12} 
            className={`transition-all duration-300 ${
              wishlisted 
                ? 'fill-black text-black group-hover/wishlist:fill-white group-hover/wishlist:text-white' 
                : 'text-gray-600 group-hover/wishlist:text-white'
            }`} 
          />
        </button>

        {/* Bottom-Right Add to Bag Button - Elegant Quick Add */}
        {!outOfStock && (
          <button
            onClick={handleAddToCart}
            className={`absolute bottom-3 right-3 w-9 h-9 rounded-[4px] ${
              cartAdded ? 'bg-black text-white' : 'bg-white/90 text-black hover:bg-black hover:text-white'
            } border border-gray-200/40 backdrop-blur-sm shadow-sm flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 z-20`}
          >
            <ShoppingBag size={13} className="transition-transform duration-200" />
          </button>
        )}

        {/* Out of Stock Label */}
        {outOfStock && (
          <div className="absolute top-3 left-3 bg-white/95 px-2 py-0.5 shadow-sm border border-gray-100 z-20">
            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-gray-500">Sold Out</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-0.5">
        <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-gray-400 mb-1">{category}</p>
        <h3 className="text-sm font-bold uppercase tracking-tight text-gray-900 leading-snug group-hover:text-black transition-colors duration-300 line-clamp-1 mb-1">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-black tracking-wide">
            {formatPrice(product.price)}
          </span>
          {cartAdded && (
            <span className="text-[9px] font-bold text-black uppercase tracking-wider animate-pulse">
              Added
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

/* ─── FeaturedCarousel ──────────────────────────────────────────────────── */

export default function FeaturedCarousel({ products = [], headline, subline }) {
  const scrollRef = useRef(null);
  const sectionRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [visible, setVisible] = useState(false);

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const scroll = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * CARD_WIDTH * 2, behavior: 'smooth' });
  }, []);

  if (!products.length) return null;

  return (
    <section
      ref={sectionRef}
      className="bg-white py-16 sm:py-24 overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* Section Header */}
        <div className="flex items-end justify-between mb-10 sm:mb-14 gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 mb-2">
              {subline}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black leading-none sm:whitespace-nowrap">
              {headline}
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center transition-all duration-300 hover:border-black hover:bg-black disabled:opacity-20 disabled:cursor-not-allowed group"
            >
              <ArrowLeft size={16} className="text-gray-600 group-hover:text-white transition-colors duration-300" />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center transition-all duration-300 hover:border-black hover:bg-black disabled:opacity-20 disabled:cursor-not-allowed group"
            >
              <ArrowRight size={16} className="text-gray-600 group-hover:text-white transition-colors duration-300" />
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
          {products.map((product) => (
            <div key={product.id} style={{ scrollSnapAlign: 'start' }}>
              <CarouselCard product={product} />
            </div>
          ))}
        </div>

        {/* Scroll indicator dots */}
        <div className="flex items-center gap-1.5 mt-6">
          <div className={`h-px transition-all duration-300 ${canScrollLeft ? 'w-6 bg-black' : 'w-3 bg-gray-200'}`} />
          <div className={`h-px transition-all duration-300 ${!canScrollLeft && !canScrollRight ? 'w-6 bg-black' : 'w-3 bg-gray-200'}`} />
          <div className={`h-px transition-all duration-300 ${!canScrollRight ? 'w-6 bg-black' : 'w-3 bg-gray-200'}`} />
        </div>
      </div>
    </section>
  );
}
