/**
 * @fileoverview RecentlyViewedSection — Design Spells Edition
 * Applies: animejs-animation (horizontal slide stagger, scroll trigger),
 *          design-spells (add-to-cart hover reveal, wishlist pulse)
 */

import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, X, Star } from 'lucide-react';
import { useRecentlyViewed } from './RecentlyViewedContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { EASING } from '../hooks/useAnime.js';
import { useIntersectionObserver } from '../hooks/useUtils.js';

const RecentlyViewedSection = () => {
  const { recentlyViewed, clearViewed } = useRecentlyViewed();
  const { openDrawer, addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();
  const scrollRef = useRef(null);
  const cardsRef = useRef(null);
  const hasAnimated = useRef(false);

  const { ref: sectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    if (!isIntersecting || hasAnimated.current || !cardsRef.current) return;
    hasAnimated.current = true;

    let anime;
    try { anime = require('animejs').default ?? require('animejs'); } catch { return; }

    const cards = cardsRef.current.querySelectorAll('[data-rv-card]');
    if (!cards.length) return;

    anime.set(cards, { opacity: 0, translateX: 30 });
    anime({
      targets: cards,
      opacity: [0, 1],
      translateX: [30, 0],
      duration: 500,
      delay: anime.stagger(70),
      easing: EASING.FABRIC,
    });
  }, [isIntersecting, recentlyViewed.length]);

  if (!recentlyViewed.length) return null;

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="bg-white py-16 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <Clock size={16} className="text-gray-500" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900">
                Recently Viewed
              </h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                {recentlyViewed.length} piece{recentlyViewed.length !== 1 ? 's' : ''} browsed
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => scroll(-1)}
              className="hidden sm:flex w-9 h-9 border border-gray-200 items-center justify-center hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll(1)}
              className="hidden sm:flex w-9 h-9 border border-gray-200 items-center justify-center hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={clearViewed}
              className="flex items-center space-x-1.5 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 border border-transparent hover:border-red-100 hover:bg-red-50 rounded-xl transition-all duration-200"
            >
              <X size={11} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
        >
          <div ref={cardsRef} className="flex space-x-4">
            {recentlyViewed.map((product, idx) => (
              <div
                key={`${product.id}-${idx}`}
                data-rv-card
                className="flex-shrink-0 w-48 group"
                style={{ opacity: 0 }}
              >
                {/* Image */}
                <div
                  onClick={() => openDrawer('product', product)}
                  className="relative w-full aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden cursor-pointer mb-3"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ${
                      product.stock === 0 ? 'grayscale opacity-60' : ''
                    }`}
                    loading="lazy"
                  />

                  {/* Sold out */}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg">
                        Sold Out
                      </span>
                    </div>
                  )}

                  {/* Quick add overlay */}
                  {product.stock !== 0 && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        className="bg-white text-black text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-xl hover:bg-[#ba1f3d] hover:text-white transition-all duration-300 active:scale-95"
                      >
                        + Add to Bag
                      </button>
                    </div>
                  )}

                  {/* Wishlist */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                    className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 ${
                      isWishlisted(product.id)
                        ? 'bg-[#ba1f3d] text-white scale-110'
                        : 'bg-white/90 text-gray-400 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Heart size={13} className={isWishlisted(product.id) ? 'fill-white' : ''} />
                  </button>
                </div>

                {/* Info */}
                <div className="px-1">
                  <h3
                    onClick={() => openDrawer('product', product)}
                    className="text-sm font-black uppercase tracking-tight text-gray-900 leading-tight cursor-pointer hover:text-[#ba1f3d] transition-colors duration-200 line-clamp-1"
                  >
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-black text-[#ba1f3d]">
                      {formatPrice(product.price)}
                    </p>
                    <div className="flex items-center space-x-0.5 opacity-50">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={9} className={i < (product.rating ?? 4) ? 'fill-[#ba1f3d] text-[#ba1f3d]' : 'text-gray-200'} />
                      ))}
                    </div>
                  </div>
                  {/* Color dots */}
                  {product.colors?.length > 0 && (
                    <div className="flex items-center space-x-1 mt-1.5">
                      {product.colors.slice(0, 4).map(c => (
                        <div key={c} className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{ background: c }} />
                      ))}
                      {product.colors.length > 4 && (
                        <span className="text-[8px] text-gray-400 font-bold">+{product.colors.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Missing import fix
const Heart = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export default RecentlyViewedSection;