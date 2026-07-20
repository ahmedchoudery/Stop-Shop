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

const getBackgroundStyle = (color) => {
  if (!color) return {};
  if (color.includes('|')) {
    const parts = color.split('|');
    const part0 = parts[0].trim();
    const part1 = parts[1].trim();
    const isHex = (str) => /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(str);
    if (isHex(part0) && !isHex(part1)) {
      return { backgroundColor: part0 };
    } else {
      return { background: `linear-gradient(135deg, ${part0} 50%, ${part1} 50%)` };
    }
  }
  return { backgroundColor: color };
};

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

  const displayImage = cardImages[currentImageIndex] || product.image;
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
      className="group relative cursor-pointer flex-shrink-0 transition-all duration-500 bg-[#FAF9F6] border border-gray-150/70 p-4 hover:bg-white hover:shadow-[0_16px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1 select-none"
      style={{ width: 'clamp(230px, 28vw, 300px)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image Container with Inner Shadow/Border */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 mb-4">
        <MediaRenderer
          src={product.mediaType === 'embed' ? null : displayImage}
          embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
          mediaType={product.mediaType}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 border border-black/5 pointer-events-none" />

        {/* Gallery navigation arrows (Desktop hover & Mobile hold) */}
        {cardImages.length > 1 && (isHovered || isHeld) && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => { e.stopPropagation(); handlePrevImage(e); }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 flex items-center justify-center bg-white/95 hover:bg-black hover:text-white border border-gray-250/65 text-black transition-all duration-200 shadow-md rounded-[2px]"
              aria-label="Previous image"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => { e.stopPropagation(); handleNextImage(e); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 flex items-center justify-center bg-white/95 hover:bg-black hover:text-white border border-gray-250/65 text-black transition-all duration-200 shadow-md rounded-[2px]"
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
          className={`absolute top-3 right-3 w-8 h-8 rounded-none border backdrop-blur-md flex items-center justify-center transition-all duration-300 z-20 ${
            wishlisted
              ? 'bg-black text-white border-black shadow-sm'
              : 'bg-white/90 text-gray-700 border-gray-200/80 hover:bg-black hover:text-white hover:border-black'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={12}
            className={wishlisted ? 'fill-white text-white' : 'text-gray-700 hover:text-white transition-colors'}
          />
        </button>

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
            {category}
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

        {/* Color variants section (Dedicated row with space for 6 colors) */}
        {product.colors?.length > 1 ? (
          <div className="flex items-center gap-1.5 mt-3.5 pt-2.5 border-t border-gray-150/40">
            {product.colors.slice(0, 6).map((color) => {
              const isSelected = activeColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleSelectColor(color); }}
                  className={`w-3.5 h-3.5 rounded-[4px] border transition-all duration-200 focus:outline-none ${
                    isSelected
                      ? 'border-black ring-2 ring-black ring-offset-2 ring-offset-white z-10'
                      : 'border-gray-250 hover:border-black'
                  }`}
                  style={getBackgroundStyle(color)}
                />
              );
            })}
            {product.colors.length > 6 && (
              <span className="text-[8px] text-gray-500 font-bold font-mono ml-0.5">
                +{product.colors.length - 6}
              </span>
            )}
          </div>
        ) : (
          <div className="h-[25px] mt-3.5 pt-2.5 border-t border-transparent" />
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
      .catch(err => {
        console.error('[PiecesThatSpeak] fetch failed:', err);
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
            <div className="relative w-24 sm:w-32 h-0.5 bg-gray-250/60 mr-2 overflow-hidden">
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
