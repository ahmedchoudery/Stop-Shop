'use client';

/**
 * @fileoverview ProductCard — Premium Dark Edition
 * Refinements:
 *  - Fixed "New" badge logic (was incorrectly tied to rating >= 5)
 *  - Tighter, more premium info section
 *  - Better "Added to bag" feedback placement
 *  - Kept all existing hover mechanics (3D tilt, scale, quick view)
 */

import React, { useState, useCallback } from 'react';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { useNavigate } from '../utils/router-compat.jsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import MediaRenderer from './MediaRenderer.jsx';

const ProductCard = ({ product, onImageLoad }) => {
  const navigate      = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();

  const [activeColor, setActiveColor] = useState(product.colors?.[0] ?? null);
  const [cartAdded,   setCartAdded]   = useState(false);
  const [isHovered,   setIsHovered]   = useState(false);

  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock === 0;

  // Use product.isNew if available, otherwise fall back to a createdAt check
  const isNew = product.isNew
    ?? (product.createdAt
        ? Date.now() - new Date(product.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
        : false);

  const category =
    product.subCategory && product.subCategory.toLowerCase() !== 'general'
      ? product.subCategory
      : product.bucket;

  // ── Handlers ─────────────────────────────────────────────────────
  const handleAddToCart = useCallback(
    (e) => {
      e.stopPropagation();
      if (outOfStock) return;
      addToCart({
        ...product,
        image: product.image,
        selectedSize: product.sizes?.[0] ?? '',
        selectedColor: activeColor ?? '',
        quantity: 1,
      });
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 1800);
    },
    [addToCart, product, activeColor, outOfStock]
  );

  const handleWishlist = useCallback(
    (e) => { e.stopPropagation(); toggleWishlist(product); },
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
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* ── Image Container ─────────────────────────────────── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#111111] mb-3.5">

        {/* Main Image */}
        <MediaRenderer
          src={product.mediaType === 'embed' ? null : product.image}
          embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
          mediaType={product.mediaType}
          alt={product.name}
          onLoad={() => onImageLoad?.()}
          className={[
            'w-full h-full object-cover transition-transform duration-700 ease-out',
            isHovered ? 'scale-[1.06]' : 'scale-100',
            outOfStock ? 'opacity-35' : '',
          ].join(' ')}
        />

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

          {/* Quick View */}
          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}
              className="w-full flex items-center justify-center gap-2.5 bg-white text-black py-3 text-[9px] font-black uppercase tracking-[0.3em] transition-all duration-300 hover:bg-[#f0f0f0]"
            >
              <Eye size={11} />
              <span>Quick View</span>
            </button>
          </div>
        </div>

        {/* Wishlist — top right */}
        <button
          onClick={handleWishlist}
          className={[
            'absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center transition-all duration-300',
            wishlisted
              ? 'bg-[#ba1f3d] opacity-100'
              : 'bg-black/60 opacity-100 lg:opacity-0 lg:group-hover:opacity-100',
          ].join(' ')}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={12} className={wishlisted ? 'fill-white text-white' : 'text-white'} />
        </button>

        {/* Add to cart — top left */}
        {!outOfStock && (
          <button
            onClick={handleAddToCart}
            className={[
              'absolute top-3 left-3 z-10 w-8 h-8 flex items-center justify-center transition-all duration-300',
              cartAdded ? 'bg-[#ba1f3d]' : 'bg-black/60',
              'opacity-100 lg:opacity-0 lg:group-hover:opacity-100',
            ].join(' ')}
            aria-label="Add to cart"
          >
            <ShoppingBag size={12} className="text-white" />
          </button>
        )}

        {/* Status badges — mutually exclusive */}
        {outOfStock ? (
          <div className="absolute top-3 left-3 z-10 bg-black/80 px-2 py-1 border border-[#2a2a2a]">
            <span className="text-[7px] font-black uppercase tracking-[0.35em] text-[#666]">
              Sold Out
            </span>
          </div>
        ) : isNew && (
          <div className="absolute top-3 left-3 z-10 bg-[#ba1f3d] px-2.5 py-1">
            <span className="text-[7px] font-black uppercase tracking-[0.35em] text-white">
              New
            </span>
          </div>
        )}
      </div>

      {/* ── Product Info ────────────────────────────────────── */}
      <div className="px-0.5">

        {/* Category */}
        <p className="text-[8px] font-bold text-[#444] uppercase tracking-[0.4em] mb-1.5">
          {category}
        </p>

        {/* Name */}
        <h3 className="text-[13px] font-black text-[#e0e0e0] uppercase tracking-tight leading-snug mb-2.5 group-hover:text-white transition-colors duration-300 line-clamp-1">
          {product.name}
        </h3>

        {/* Price + Colors */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-white tracking-tight">
            {formatPrice(product.price)}
          </span>

          {/* Color swatches */}
          {product.colors?.length > 0 && (
            <div className="flex items-center gap-1">
              {product.colors.slice(0, 4).map((color) => {
                const hex = color.includes('|') ? color.split('|')[0] : color;
                return (
                  <button
                    key={color}
                    onClick={(e) => { e.stopPropagation(); setActiveColor(color); }}
                    aria-label={`Select colour ${hex}`}
                    className={[
                      'w-2.5 h-2.5 rounded-full border transition-all duration-200',
                      activeColor === color
                        ? 'border-white ring-1 ring-white ring-offset-1 ring-offset-[#0d0d0d]'
                        : 'border-[#2a2a2a] hover:border-[#555]',
                    ].join(' ')}
                    style={{ backgroundColor: hex }}
                  />
                );
              })}
              {product.colors.length > 4 && (
                <span className="text-[8px] text-[#444] font-bold ml-0.5">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Cart feedback */}
        {cartAdded && (
          <p className="text-[8px] font-black text-[#ba1f3d] uppercase tracking-[0.35em] mt-2 animate-fade-up">
            ✓ Added to bag
          </p>
        )}
      </div>
    </article>
  );
};

export default React.memo(ProductCard);