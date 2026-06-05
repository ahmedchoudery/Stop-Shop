'use client';

/**
 * @fileoverview FeaturedCarousel.jsx — Horizontal Product Carousel
 * Theme: Unified dark, white accents on hover/active states.
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
      style={{ width: 'clamp(220px, 28vw, 300px)' }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 mb-4">
        <MediaRenderer
          src={product.mediaType === 'embed' ? null : product.image}
          embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
          mediaType={product.mediaType}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* White top bar on hover */}
        <div className="absolute top-0 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-500" />

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleWishlist}
            className={`w-8 h-8 flex items-center justify-center ${wishlisted ? 'bg-cardinal' : 'bg-white/60'} transition-colors duration-200`}
          >
            <Heart size={12} className={wishlisted ? 'fill-white text-black' : 'text-black'} />
          </button>
          {!outOfStock && (
            <button
              onClick={handleAddToCart}
              className={`w-8 h-8 flex items-center justify-center ${cartAdded ? 'bg-cardinal' : 'bg-white/60'} transition-colors duration-200`}
            >
              <ShoppingBag size={12} className="text-black" />
            </button>
          )}
        </div>

        {/* Out of stock */}
        {outOfStock && (
          <div className="absolute top-3 left-3 bg-white/80 border border-gray-300 px-2 py-1">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-600">Sold Out</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-gray-500 mb-1">{category}</p>
        <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 leading-snug group-hover:text-black transition-colors duration-300 line-clamp-1 mb-1.5">
          {product.name}
        </h3>
        <span className="text-sm font-black text-black tracking-wide">
          {formatPrice(product.price)}
        </span>
        {cartAdded && (
          <p className="text-[9px] font-black text-cardinal uppercase tracking-widest mt-1">✓ Added to bag</p>
        )}
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

  const CARD_WIDTH = 316;

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
        <div className="flex items-end justify-between mb-10 sm:mb-14">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 mb-2">
              {subline}
            </p>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black leading-none max-w-md">
              {headline}
            </h2>
          </div>

          {/* Navigation Arrows — white hover */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className="w-11 h-11 border border-gray-300 flex items-center justify-center transition-all duration-300 hover:border-white hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed group"
            >
              <ArrowLeft size={16} className="text-black group-hover:text-black transition-colors duration-300" />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className="w-11 h-11 border border-gray-300 flex items-center justify-center transition-all duration-300 hover:border-white hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed group"
            >
              <ArrowRight size={16} className="text-black group-hover:text-black transition-colors duration-300" />
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

        {/* Scroll indicator dots — white */}
        <div className="flex items-center gap-1.5 mt-6">
          <div className={`h-px transition-all duration-300 ${canScrollLeft ? 'w-6 bg-white' : 'w-3 bg-[#2a2a2a]'}`} />
          <div className={`h-px transition-all duration-300 ${!canScrollLeft && !canScrollRight ? 'w-6 bg-white' : 'w-3 bg-[#2a2a2a]'}`} />
          <div className={`h-px transition-all duration-300 ${!canScrollRight ? 'w-6 bg-white' : 'w-3 bg-[#2a2a2a]'}`} />
        </div>
      </div>
    </section>
  );
}
