'use client';

/**
 * @fileoverview PiecesThatSpeak.jsx — Dedicated Best Sellers Showcase
 * Personality: Bright, airy, sophisticated, gallery-like feel.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

/* ─── Pieces Card ───────────────────────────────────────────────────────── */

const PiecesCard = ({ product }) => {
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

  const category = product.subCategory && product.subCategory.toLowerCase() !== 'general'
    ? product.subCategory
    : product.bucket;

  return (
    <article
      className="border-gray-150/70 group relative flex-shrink-0 cursor-pointer select-none border bg-[#FAF9F6] p-4 transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_40px_rgba(0,0,0,0.03)]"
      style={{ width: 'clamp(230px, 28vw, 300px)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image Container with Inner Shadow/Border */}
      <div className="relative mb-4 aspect-[3/4] overflow-hidden bg-gray-50">
        <MediaRenderer
          src={product.mediaType === 'embed' ? null : displayImage}
          embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
          mediaType={product.mediaType}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 border border-black/5" />

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

        {/* Wishlist Button inside image top-right */}
        <button
          onClick={handleWishlist}
          onTouchStart={(e) => e.stopPropagation()}
          className={`absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-none border backdrop-blur-md transition-all duration-300 ${
            wishlisted
              ? 'border-black bg-black text-white shadow-sm'
              : 'border-gray-200/80 bg-white/90 text-gray-700 hover:border-black hover:bg-black hover:text-white'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={12}
            className={wishlisted ? 'fill-white text-white' : 'text-gray-700 transition-colors hover:text-white'}
          />
        </button>

        {/* Quick Add Overlay */}
        {!outOfStock && (
          <button
            onClick={handleAddToCart}
            aria-label={cartAdded ? `${product.name} added to bag` : `Add ${product.name} to bag`}
            className={`absolute bottom-3 right-3 z-20 flex h-9 w-9 translate-y-2 transform items-center justify-center rounded-none border opacity-0 shadow-sm backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 ${
              cartAdded 
                ? 'border-white bg-white text-black' 
                : 'border-gray-200 bg-white/95 text-black hover:border-black hover:bg-black hover:text-white'
            }`}
          >
            <ShoppingBag size={13} />
          </button>
        )}
      </div>

      {/* Metadata & Rating */}
      <div className="relative px-3 pb-3 pt-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
            {category}
          </p>
          {renderStars(product.rating)}
        </div>

        <h3
          title={product.name}
          className="mb-2 block w-full truncate text-[13px] font-bold uppercase tracking-tight text-gray-900 transition-colors duration-300 group-hover:text-black"
        >
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="font-mono text-sm font-black text-cardinal">
                  {formatPrice(discountedPrice)}
                </span>
                <span className="font-mono text-xs text-gray-500 line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="font-mono text-sm font-bold tracking-wide text-black">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          
          {cartAdded && (
            <span className="animate-pulse text-[9px] font-bold uppercase tracking-wider text-black">
              Added
            </span>
          )}
        </div>

        {/* Color variants section (Dedicated row with space for 6 colors) */}
        {product.colors?.length > 1 ? (
          <div className="border-gray-150/40 mt-3.5 flex items-center gap-1.5 border-t pt-2.5">
            {product.colors.slice(0, 6).map((color) => {
              const isSelected = activeColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleSelectColor(color); }}
                  aria-label={`Select colour ${getColorName(color)}`}
                  aria-pressed={isSelected}
                  className={`h-3.5 w-3.5 rounded-[4px] border transition-all duration-200 focus:outline-none ${
                    isSelected
                      ? 'z-10 border-black ring-2 ring-black ring-offset-2 ring-offset-white'
                      : 'border-gray-250 hover:border-black'
                  }`}
                  style={getBackgroundStyle(color)}
                />
              );
            })}
            {product.colors.length > 6 && (
              <span className="ml-0.5 font-mono text-[8px] font-bold text-gray-500">
                +{product.colors.length - 6}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-3.5 h-[25px] border-t border-transparent pt-2.5" />
        )}
      </div>
    </article>
  );
};

/* ─── Main Component ────────────────────────────────────────────────────── */

export default function PiecesThatSpeak({ products: initialProducts = [] }) {
  const scrollRef = useRef(null);
  const [products, setProducts] = useState(initialProducts);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
      return;
    }
    fetch('/api/v1/public/featured?section=pieces')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setProducts(data || []);
      })
      .catch(_err => {
        setProducts([]);
      });
  }, [initialProducts]);

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
  }, [handleScroll, products]);

  const scroll = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 320;
    el.scrollBy({ left: dir * cardWidth * 2, behavior: 'smooth' });
  }, []);

  if (products.length === 0) {
    return null;
  }

  return (
    <section id="pieces-speak" className="overflow-hidden border-t border-[var(--border)] bg-gradient-to-b from-[#FAF9F6] via-white to-[#FDFCFB] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        
        {/* Editorial Header */}
        <div className="mb-8 flex flex-row items-end justify-between gap-4 sm:mb-12">
          <div>
            <p className="mb-2.5 text-[8px] font-black uppercase tracking-[0.55em] text-gray-400">
              Best Sellers · Fan Favourites
            </p>
            <h2 className="text-2xl font-black uppercase leading-none tracking-tighter text-black sm:text-4xl">
              Pieces That Speak for Themselves.
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => scroll(-1)}
              disabled={scrollProgress <= 2}
              className="shadow-2xs flex h-10 w-10 items-center justify-center rounded-[2px] border border-gray-200 bg-white text-black transition-all duration-300 hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
              aria-label="Previous items"
            >
              <ArrowLeft size={15} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={scrollProgress >= 98}
              className="shadow-2xs flex h-10 w-10 items-center justify-center rounded-[2px] border border-gray-200 bg-white text-black transition-all duration-300 hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
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
          {products.map((product) => (
            <div 
              key={product.id} 
              style={{ 
                scrollSnapAlign: 'start',
                width: 'clamp(230px, 28vw, 300px)',
                flexShrink: 0
              }}
            >
              <PiecesCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
