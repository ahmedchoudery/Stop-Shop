'use client';

/**
 * @fileoverview ProductCard — Premium Dark Edition
 * Refinements:
 *  - Added GPU-accelerated 3D parallax tilt interaction on image container.
 *  - Integrated anime.js spring/elastic micro-interactions on hover and click actions.
 *  - Clean typography and premium luxury animations per design-spells.
 */

import React, { useState, useCallback } from 'react';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import anime from 'animejs';
import { useNavigate } from '../utils/router-compat.jsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import MediaRenderer from './MediaRenderer.jsx';
import { playPremiumChime } from '../utils/audio.js';
import MagneticElement from './MagneticElement.jsx';
const getBackgroundStyle = (color) => {
  if (!color) return {};
  if (color.includes('|')) {
    const parts = color.split('|');
    const part0 = parts[0].trim();
    const part1 = parts[1].trim();
    const isHex = (str) => /^#([0-9A-F]{3}){1,2}$/i.test(str);
    if (isHex(part0) && !isHex(part1)) {
      return { backgroundColor: part0 };
    } else {
      return { background: `linear-gradient(135deg, ${part0} 50%, ${part1} 50%)` };
    }
  }
  return { backgroundColor: color };
};

const getColorName = (color) => {
  if (!color) return '';
  if (color.includes('|')) {
    const parts = color.split('|');
    const part0 = parts[0].trim();
    const part1 = parts[1].trim();
    const isHex = (str) => /^#([0-9A-F]{3}){1,2}$/i.test(str);
    if (isHex(part0) && !isHex(part1)) {
      return part1;
    } else {
      return parts.join(' / ');
    }
  }
  return color;
};

const ProductCard = ({ product, onImageLoad }) => {
  const navigate      = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();

  const [activeColor, setActiveColor] = useState(product.colors?.[0] ?? null);
  const [cartAdded,   setCartAdded]   = useState(false);
  const [isHovered,   setIsHovered]   = useState(false);
  const [tiltStyle,   setTiltStyle]   = useState({});

  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock === 0;

  const isNew = product.isNew
    ?? (product.createdAt
        ? Date.now() - new Date(product.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
        : false);

  const hasDiscount = product.discount > 0;
  const discountedPrice = hasDiscount ? product.price * (1 - product.discount / 100) : product.price;

  const category =
    product.subCategory && product.subCategory.toLowerCase() !== 'general'
      ? product.subCategory
      : product.bucket;

  // ── 3D Parallax Tilt interactions ────────────────────────────────
  const handleCardMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Smoothly tilt card based on cursor coordinates
    const rotateX = -(y / (rect.height / 2)) * 8; // Max 8 deg tilt
    const rotateY = (x / (rect.width / 2)) * 8;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleAddToCart = useCallback(
    (e) => {
      e.stopPropagation();
      if (outOfStock) return;
      playPremiumChime();
      addToCart({
        ...product,
        image: product.image,
        selectedSize: product.sizes?.[0] ?? '',
        selectedColor: activeColor ?? '',
        quantity: 1,
      });
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 1800);

      // Spring click feedback pop
      anime({
        targets: e.currentTarget,
        scale: [1, 1.3, 1],
        duration: 450,
        easing: 'easeOutElastic(1, .6)'
      });
    },
    [addToCart, product, activeColor, outOfStock]
  );

  const handleWishlist = useCallback(
    (e) => {
      e.stopPropagation();
      playPremiumChime();
      toggleWishlist(product);

      // Elastic heart pop feedback
      anime({
        targets: e.currentTarget,
        scale: [1, 1.4, 1],
        duration: 500,
        easing: 'easeOutElastic(1, .5)'
      });
    },
    [product, toggleWishlist]
  );

  const handleCardClick = useCallback(
    () => navigate(`/product/${product.id}`),
    [navigate, product.id]
  );

  return (
    <article
      className="group relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleCardMouseLeave}
      onMouseMove={handleCardMouseMove}
      onClick={handleCardClick}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* ── Image Container with 3D Tilt ──────────────────────── */}
      <div 
        className="relative aspect-[3/4] overflow-hidden mb-3.5"
        style={{
          ...tiltStyle,
          transformStyle: 'preserve-3d',
          willChange: 'transform'
        }}
      >
        {/* Main Image */}
        <div style={{ transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }} className="w-full h-full">
          <MediaRenderer
            src={product.mediaType === 'embed' ? null : product.image}
            embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
            mediaType={product.mediaType}
            alt={product.name}
            onLoad={() => onImageLoad?.()}
            className={[
              'w-full h-full object-cover transition-transform duration-700 ease-out',
              isHovered ? 'scale-[1.04]' : 'scale-100',
              outOfStock ? 'opacity-35' : '',
            ].join(' ')}
          />
        </div>

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          style={{ transform: 'translateZ(15px)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Quick View Button */}
          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}
              className="w-full flex items-center justify-center gap-2.5 bg-white text-black py-3 text-[9px] font-black uppercase tracking-[0.3em] transition-all duration-300 hover:bg-black hover:text-white active-scale"
            >
              <Eye size={11} />
              <span>Quick View</span>
            </button>
          </div>
        </div>

        {/* Wishlist — top right */}
        <MagneticElement className="absolute top-3 right-3 z-10">
          <button
            onClick={handleWishlist}
            className={[
              'w-8 h-8 flex items-center justify-center rounded-[4px] border border-gray-200/40 transition-all duration-300 shadow-sm active-scale',
              wishlisted
                ? 'bg-cardinal opacity-100 text-white'
                : 'bg-white/95 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:bg-cardinal hover:text-white',
            ].join(' ')}
            style={{ transform: 'translateZ(20px)' }}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={12} className={wishlisted ? 'fill-white text-white' : 'text-black hover:text-white transition-colors duration-200'} />
          </button>
        </MagneticElement>

        {/* Add to cart — top left */}
        {!outOfStock && (
          <MagneticElement className="absolute top-3 left-3 z-10">
            <button
              onClick={handleAddToCart}
              className={[
                'w-8 h-8 flex items-center justify-center rounded-[4px] border border-gray-200/40 transition-all duration-300 shadow-sm active-scale',
                cartAdded ? 'bg-cardinal text-white' : 'bg-white/95 text-black',
                'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:bg-black hover:text-white',
              ].join(' ')}
              style={{ transform: 'translateZ(20px)' }}
              aria-label="Add to cart"
            >
              <ShoppingBag size={12} className={cartAdded ? 'text-white' : 'text-black hover:text-white transition-colors duration-200'} />
            </button>
          </MagneticElement>
        )}

        {/* Status badges — mutually exclusive */}
        {outOfStock ? (
          <div className="absolute top-3 left-3 z-10 bg-white/90 px-2 py-1 border border-gray-300" style={{ transform: 'translateZ(25px)' }}>
            <span className="text-[7px] font-black uppercase tracking-[0.35em] text-gray-500">
              Sold Out
            </span>
          </div>
        ) : (
          <>
            {isNew && (
              <div className="absolute top-3 left-3 z-10 bg-cardinal px-2.5 py-1" style={{ transform: 'translateZ(25px)' }}>
                <span className="text-[7px] font-black uppercase tracking-[0.35em] text-white">
                  New
                </span>
              </div>
            )}
            {hasDiscount && (
              <div
                className="absolute z-10 bg-black px-2.5 py-1 border border-white/20"
                style={{
                  transform: 'translateZ(25px)',
                  top: isNew ? '34px' : '12px',
                  left: '12px'
                }}
              >
                <span className="text-[7px] font-black uppercase tracking-[0.35em] text-white">
                  {product.discount}% OFF
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Product Info ────────────────────────────────────── */}
      <div className="px-0.5">
        {/* Category */}
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.45em] mb-1">
          {category}
        </p>

        {/* Name */}
        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-900 leading-snug mb-1.5 group-hover:text-cardinal transition-colors duration-300 line-clamp-1">
          {product.name}
        </h3>

        {/* Price + Colors */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-xs font-mono font-black text-cardinal">
                  {formatPrice(discountedPrice)}
                </span>
                <span className="text-[10px] font-mono text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-xs font-bold font-mono text-gray-900">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Color swatches */}
          {product.colors?.length > 0 && (
            <div className="flex items-center gap-1.5">
              {product.colors.slice(0, 4).map((color) => {
                const isSelected = activeColor === color;
                return (
                  <button
                    key={color}
                    onClick={(e) => { e.stopPropagation(); setActiveColor(color); }}
                    aria-label={`Select colour ${getColorName(color)}`}
                    className={[
                      'w-3.5 h-3.5 rounded-full border transition-all duration-200 focus:outline-none',
                      isSelected
                        ? 'border-black ring-2 ring-black ring-offset-2 ring-offset-white z-10'
                        : 'border-gray-450 hover:border-black/60',
                    ].join(' ')}
                    style={getBackgroundStyle(color)}
                  />
                );
              })}
              {product.colors.length > 4 && (
                <span className="text-[8px] text-gray-500 font-bold ml-0.5">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Cart feedback */}
        {cartAdded && (
          <p className="text-[8px] font-black text-cardinal uppercase tracking-[0.35em] mt-2 animate-fade-up">
            ✓ Added to bag
          </p>
        )}
      </div>
    </article>
  );
};

export default React.memo(ProductCard);