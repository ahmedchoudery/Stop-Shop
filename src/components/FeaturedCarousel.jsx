'use client';

/**
 * @fileoverview FeaturedCarousel.jsx — Horizontal Product Carousel
 * Theme: Minimalist editorial lookbook. White/Dark section, standard size swatches, 1-line headline.
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Heart, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from '../utils/router-compat.jsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import MediaRenderer from './MediaRenderer.jsx';
import { getColorName, getBackgroundStyle } from '../utils/color-namer.js';

const getVariantImages = (product, color) => {
  if (!color) return null;
  if (product.variantImages) {
    const imagesObj = product.variantImages instanceof Map
      ? Object.fromEntries(product.variantImages)
      : product.variantImages;

    if (typeof imagesObj === 'object') {
      const searchColor = color.trim().toLowerCase();
      const searchParts = searchColor.split('|').map(p => p.trim());
      const searchHex = searchParts[0];
      const searchName = searchParts[1] || '';

      let matchedVal = null;
      if (typeof color === 'string' && Object.prototype.hasOwnProperty.call(imagesObj, color)) {
        matchedVal = Reflect.get(imagesObj, color) || null;
      }

      if (!matchedVal) {
        for (const [key, val] of Object.entries(imagesObj)) {
          const keyLower = key.trim().toLowerCase();
          if (keyLower === searchColor) { matchedVal = val; break; }
          const keyParts = keyLower.split('|').map(p => p.trim());
          const keyHex = keyParts[0];
          const keyName = keyParts[1] || '';
          if (searchHex && keyHex === searchHex) { matchedVal = val; break; }
          if (searchName && keyName && keyName === searchName) { matchedVal = val; break; }
          if (keyLower === searchHex || keyLower === searchName) { matchedVal = val; break; }
        }
      }

      if (Array.isArray(matchedVal) && matchedVal.length > 0) {
        return matchedVal.filter(u => u && typeof u === 'string' && u.trim());
      }
      if (typeof matchedVal === 'string' && matchedVal.trim()) {
        return [matchedVal];
      }
    }
  }
  return null;
};

/* ─── Carousel Card ─────────────────────────────────────────────────────── */

const CarouselCard = ({ product, theme, index = 0 }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();

  const [selectedColor, setSelectedColor] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cartAdded, setCartAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const touchTimeoutRef = useRef(null);

  const activeColor = selectedColor || product.colors?.[0] || null;

  const cardImages = useMemo(() => {
    if (selectedColor) {
      const colorImgs = getVariantImages(product, selectedColor);
      if (colorImgs && colorImgs.length > 0) return colorImgs;
    } else if (product.colors && product.colors.length > 0) {
      const firstColor = product.colors[0];
      const colorImgs = getVariantImages(product, firstColor);
      if (colorImgs && colorImgs.length > 0) return colorImgs;
    }

    const list = [];
    if (product.image && typeof product.image === 'string' && product.image.trim()) {
      list.push(product.image.trim());
    }
    if (product.gallery && Array.isArray(product.gallery)) {
      product.gallery.forEach((img) => {
        if (img && typeof img === 'string' && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      });
    }
    return list.length > 0 ? list : [product.image];
  }, [product, selectedColor]);

  const displayImage = cardImages.at(currentImageIndex) ?? product.image;
  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock === 0;

  const hasDiscount = product.discount > 0;
  const discountedPrice = hasDiscount ? product.price * (1 - product.discount / 100) : product.price;

  const handleTouchStart = useCallback(() => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    setIsHeld(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    touchTimeoutRef.current = setTimeout(() => setIsHeld(false), 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    };
  }, []);

  const handlePrevImage = useCallback(
    (e) => {
      e.stopPropagation();
      setCurrentImageIndex((prev) => (prev - 1 + cardImages.length) % cardImages.length);
    },
    [cardImages.length]
  );

  const handleNextImage = useCallback(
    (e) => {
      e.stopPropagation();
      setCurrentImageIndex((prev) => (prev + 1) % cardImages.length);
    },
    [cardImages.length]
  );

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    if (outOfStock) return;
    addToCart({ 
      ...product, 
      selectedSize: product.sizes?.[0] ?? '', 
      selectedColor: activeColor ?? '', 
      quantity: 1 
    });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1800);
  }, [addToCart, product, outOfStock, activeColor]);

  const handleWishlist = useCallback((e) => {
    e.stopPropagation();
    toggleWishlist(product);
  }, [product, toggleWishlist]);

  const handleSelectColor = useCallback((color) => {
    setSelectedColor(color);
    setCurrentImageIndex(0);
  }, []);

  const category = product.subCategory && product.subCategory.toLowerCase() !== 'general'
    ? product.subCategory
    : product.bucket;

  return (
    <article
      className="group relative flex-shrink-0 cursor-pointer select-none transition-all duration-500"
      style={{ width: 'clamp(220px, 28vw, 290px)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image Wrapper */}
      <div className="relative mb-4 aspect-[3/4] overflow-hidden bg-gray-50 transition-all duration-500 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
        <MediaRenderer
          src={product.mediaType === 'embed' ? null : displayImage}
          embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
          mediaType={product.mediaType}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
        />

        {/* Clean border outline */}
        <div className={`pointer-events-none absolute inset-0 z-10 border transition-all duration-500 ${
          theme === 'dark' 
            ? 'border-white/5 group-hover:border-white/20 group-hover:shadow-[inset_0_0_24px_rgba(255,255,255,0.03)]' 
            : 'border-gray-100 group-hover:border-black/20'
        }`} />

        {/* Gallery navigation arrows (Desktop hover & Mobile hold) */}
        {cardImages.length > 1 && (isHovered || isHeld) && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => { e.stopPropagation(); handlePrevImage(e); }}
              className="border-gray-250/65 absolute left-2.5 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[2px] border bg-white/95 text-black shadow-md transition-all duration-200 hover:bg-black hover:text-white"
              aria-label="Previous image"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => { e.stopPropagation(); handleNextImage(e); }}
              className="border-gray-250/65 absolute right-2.5 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[2px] border bg-white/95 text-black shadow-md transition-all duration-200 hover:bg-black hover:text-white"
              aria-label="Next image"
            >
              <ChevronRight size={13} />
            </button>
          </>
        )}

        {/* Top-Right Wishlist Button - Transparent and Minimalist */}
        <button
          onClick={handleWishlist}
          onTouchStart={(e) => e.stopPropagation()}
          className={`group/wishlist absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-none border shadow-sm backdrop-blur-sm transition-all duration-300 ${
            theme === 'dark'
              ? 'border-white/10 bg-[#1a1a1a]/85 text-white hover:bg-white hover:text-black'
              : 'text-gray-650 border-gray-200 bg-white/85 hover:bg-black hover:text-white'
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
            className={`absolute bottom-3 right-3 z-20 flex h-9 w-9 translate-y-2 transform items-center justify-center rounded-none border opacity-0 shadow-sm backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 ${
              cartAdded 
                ? 'border-white bg-white text-black' 
                : theme === 'dark'
                  ? 'border-white/15 bg-[#1a1a1b]/95 text-white hover:border-white hover:bg-white hover:text-black'
                  : 'border-gray-200 bg-white/90 text-black hover:border-black hover:bg-black hover:text-white'
            }`}
          >
            <ShoppingBag size={13} className="transition-transform duration-200" />
          </button>
        )}

        {/* Limited Drop Pulse Tag */}
        {theme === 'dark' && !outOfStock && (
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-none border border-white/10 bg-black/70 px-2 py-0.5 shadow-sm backdrop-blur-sm">
            <span className="h-1 w-1 animate-ping rounded-full bg-white" />
            <span className="text-[7px] font-black uppercase tracking-[0.25em] text-white">
              LIMITED
            </span>
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && !outOfStock && (
          <div className={`absolute left-3 top-3 z-20 border px-2 py-1 shadow-none ${
            theme === 'dark'
              ? 'border-black/10 bg-white text-black'
              : 'border-white/10 bg-black text-white'
          }`}>
            <span className="text-[7px] font-black uppercase tracking-[0.35em]">
              {product.discount}% OFF
            </span>
          </div>
        )}

        {/* Out of Stock Label */}
        {outOfStock && (
          <div className={`absolute left-3 top-3 z-20 border px-2 py-0.5 ${
            theme === 'dark'
              ? 'border-white/5 bg-[#1a1a1a]/90 text-gray-400'
              : 'border-gray-100 bg-white/95 text-gray-500'
          }`}>
            <span className="text-[8px] font-black uppercase tracking-[0.25em]">Sold Out</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="relative z-10 px-0.5">
        {/* Large low-opacity numbered index behind details */}
        {theme === 'dark' && (
          <div className="pointer-events-none absolute -top-4 right-0 z-0 select-none font-mono text-[80px] font-black leading-none text-white/[0.02] transition-colors duration-500 group-hover:text-white/[0.05]">
            {String(index + 1).padStart(2, '0')}
          </div>
        )}

        <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.25em] text-gray-400">{category}</p>
        <h3 className={`mb-1 line-clamp-1 text-sm font-bold uppercase leading-snug tracking-tight transition-colors duration-300 ${
          theme === 'dark' ? 'text-white group-hover:text-white/80' : 'text-gray-900 group-hover:text-black'
        }`}>
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="font-mono text-sm font-black text-cardinal">
                  {formatPrice(discountedPrice)}
                </span>
                <span className="font-mono text-xs text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className={`font-mono text-sm font-bold tracking-wide ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}>
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          {cartAdded && (
            <span className={`animate-pulse text-[9px] font-bold uppercase tracking-wider ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              Added
            </span>
          )}
        </div>

        {/* Color variants section (Same size & layout functionality as Pieces card) */}
        {product.colors?.length > 1 ? (
          <div className={`mt-3.5 flex items-center gap-1.5 border-t pt-2.5 ${
            theme === 'dark' ? 'border-white/10' : 'border-gray-150/40'
          }`}>
            {product.colors.slice(0, 6).map((color) => {
              const isSelected = activeColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleSelectColor(color); }}
                  aria-label={`Select colour ${getColorName(color)}`}
                  className={`h-3.5 w-3.5 rounded-[4px] border transition-all duration-200 focus:outline-none ${
                    isSelected
                      ? (theme === 'dark' 
                          ? 'z-10 border-white ring-2 ring-white ring-offset-2 ring-offset-black'
                          : 'z-10 border-black ring-2 ring-black ring-offset-2 ring-offset-white')
                      : (theme === 'dark'
                          ? 'border-white/20 hover:border-white'
                          : 'border-gray-250 hover:border-black')
                  }`}
                  style={getBackgroundStyle(color)}
                />
              );
            })}
            {product.colors.length > 6 && (
              <span className={`ml-0.5 font-mono text-[8px] font-bold ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                +{product.colors.length - 6}
              </span>
            )}
          </div>
        ) : (
          <div className={`mt-3.5 h-[25px] border-t border-transparent pt-2.5`} />
        )}
      </div>
    </article>
  );
};

/* ─── FeaturedCarousel ──────────────────────────────────────────────────── */

export default function FeaturedCarousel({ products = [], headline: _headline, subline, theme = 'light' }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const CARD_WIDTH = 306;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < maxScroll - 8);
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
      className={`overflow-hidden border-t py-16 sm:py-24 ${
        theme === 'dark'
          ? 'border-white/10 bg-gradient-to-tr from-[#050507] via-[#0E0E12] to-[#08080A] text-white'
          : 'border-[var(--border)] bg-white text-black'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">

        {/* Section Header */}
        <div className="mb-8 flex flex-row items-end justify-between gap-4 sm:mb-14">
          <div>
            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.5em] text-gray-500">
              {subline}
            </p>
            <h2 className="text-2xl font-black uppercase leading-none tracking-tight sm:whitespace-nowrap sm:text-3xl">
              {theme === 'dark' ? "The Drop You've Been Waiting For." : "Pieces That Speak for Themselves."}
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className={`shadow-2xs group flex h-10 w-10 items-center justify-center rounded-[2px] border transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-20 ${
                theme === 'dark'
                  ? 'border-white/15 bg-white/5 text-white hover:border-white hover:bg-white hover:text-black'
                  : 'border-gray-200 bg-white text-black hover:border-black hover:bg-black hover:text-white'
              }`}
              aria-label="Previous items"
            >
              <ArrowLeft size={15} strokeWidth={1.8} className="transition-colors duration-300" />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className={`shadow-2xs group flex h-10 w-10 items-center justify-center rounded-[2px] border transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-20 ${
                theme === 'dark'
                  ? 'border-white/15 bg-white/5 text-white hover:border-white hover:bg-white hover:text-black'
                  : 'border-gray-200 bg-white text-black hover:border-black hover:bg-black hover:text-white'
              }`}
              aria-label="Next items"
            >
              <ArrowRight size={15} strokeWidth={1.8} className="transition-colors duration-300" />
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
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {products.map((product, idx) => (
            <div key={product.id} style={{ scrollSnapAlign: 'start' }}>
              <CarouselCard product={product} theme={theme} index={idx} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
