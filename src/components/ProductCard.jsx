/**
 * @fileoverview ProductCard — Design Spells Edition
 * Fix: replaced require('animejs') with ESM import — card stagger animations now work
 * Applies: design-spells (text scramble, magnetic cart, shimmer reveal, depth tilt),
 *          animejs-animation (spring physics, stagger, timeline),
 *          3d-web-experience (CSS 3D perspective tilt — no WebGL needed for cards)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import anime from 'animejs';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import MediaRenderer from './MediaRenderer.jsx';
import { useAnimeTextScramble, EASING } from '../hooks/useAnime.js';

const ProductCard = ({ product, onSelectProduct, onImageLoad }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();
  const { t } = useLocale();

  const [activeColor, setActiveColor] = useState(product.colors?.[0] ?? null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [cartBurst, setCartBurst] = useState(false);
  const [wishlistAnim, setWishlistAnim] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const cardRef = useRef(null);
  const cartBtnRef = useRef(null);
  const priceRef = useRef(null);
  const overlayRef = useRef(null);

  // ── Design Spell: Text Scramble on product name hover ────────
  const { ref: nameRef, scramble } = useAnimeTextScramble(product.name.toUpperCase());

  // ── Cleanup cart burst animation after duration ──────────
  useEffect(() => {
    if (!cartBurst) return;
    const timer = setTimeout(() => setCartBurst(false), 600);
    return () => clearTimeout(timer);
  }, [cartBurst]);

  // ── Cleanup wishlist animation after duration ─────────────
  useEffect(() => {
    if (!wishlistAnim) return;
    const timer = setTimeout(() => setWishlistAnim(false), 600);
    return () => clearTimeout(timer);
  }, [wishlistAnim]);

  // ── Current image ─────────────────────────────────────────────
  const currentImage = (activeColor && product.variantImages?.[activeColor])
    ? product.variantImages[activeColor]
    : (product.gallery?.length > 0
        ? product.gallery[galleryIndex % product.gallery.length]
        : product.image);

  useEffect(() => { setHasLoaded(false); }, [currentImage]);

  // ── Design Spell: 3D CSS Tilt ─────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotX = (y - 0.5) * 14;
    const rotY = (x - 0.5) * -14;
    const shine = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.12) 0%, transparent 60%)`;

    cardRef.current.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(8px)`;
    cardRef.current.style.transition = 'transform 0.1s ease';

    if (overlayRef.current) {
      overlayRef.current.style.background = shine;
    }

    // Magnetic cart button
    if (cartBtnRef.current) {
      const btnRect = cartBtnRef.current.getBoundingClientRect();
      const bx = e.clientX - (btnRect.left + btnRect.width / 2);
      const by = e.clientY - (btnRect.top + btnRect.height / 2);
      const dist = Math.sqrt(bx * bx + by * by);
      if (dist < 90) {
        cartBtnRef.current.style.transform = `translate(${bx * 0.28}px, ${by * 0.28}px)`;
        cartBtnRef.current.style.transition = 'transform 0.2s ease';
      }
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    scramble(); // Design Spell: text scrambles on hover
  }, [scramble]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    cardRef.current.style.transition = 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)';

    if (overlayRef.current) overlayRef.current.style.background = 'transparent';
    if (cartBtnRef.current) {
      cartBtnRef.current.style.transform = 'translate(0,0)';
      cartBtnRef.current.style.transition = 'transform 0.5s ease';
    }
  }, []);

  // ── Design Spell: Add to Cart burst ──────────────────────────
  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();

    // Burst animation
    setCartBurst(true);
    setTimeout(() => setCartBurst(false), 600);

    // Anime.js ripple on the button
    if (cartBtnRef.current) {
      anime({
        targets: cartBtnRef.current,
        scale: [1, 1.3, 1],
        duration: 500,
        easing: EASING.SPRING,
      });
    }

    addToCart({ ...product, image: currentImage, activeColor });
  }, [addToCart, product, currentImage, activeColor]);

  // ── Wishlist ─────────────────────────────────────────────────
  const handleWishlist = useCallback((e) => {
    e.stopPropagation();
    toggleWishlist(product);
    setWishlistAnim(true);
    setTimeout(() => setWishlistAnim(false), 600);
  }, [product, toggleWishlist]);

  const wishlisted = isWishlisted(product.id);

  return (
    <div
      ref={cardRef}
      className="group relative bg-white flex flex-col h-full cursor-pointer overflow-visible"
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onSelectProduct}
    >
      {/* Shine overlay (design spell: light follows cursor) */}
      <div
        ref={overlayRef}
        className="absolute inset-0 z-10 pointer-events-none rounded-sm transition-opacity duration-300"
        style={{ mixBlendMode: 'overlay' }}
      />

      {/* ── Image Container ──────────────────────────────────── */}
      <div
        className="relative aspect-[4/5] overflow-hidden bg-gray-50 mb-5"
        style={{ transform: 'translateZ(20px)' }}
      >
        {/* Trending Badge */}
        <div className="absolute top-4 left-4 z-20">
          <span
            className="bg-[#ba1f3d] text-white text-[9px] font-black px-3 py-1.5 uppercase tracking-[0.3em] shadow-lg"
            style={{ willChange: 'transform' }}
          >
            {t('status.trending')}
          </span>
        </div>

        {/* Wishlist Heart — Design Spell: scale burst on click */}
        <button
          onClick={handleWishlist}
          className={`absolute top-4 right-4 z-20 p-2.5 rounded-full transition-all duration-500 ${
            wishlisted
              ? 'bg-[#ba1f3d] shadow-xl shadow-red-400/30 scale-110'
              : 'bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 shadow-md translate-y-1 group-hover:translate-y-0'
          }`}
          style={{
            transform: wishlistAnim ? 'scale(1.4)' : undefined,
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
            willChange: 'transform',
          }}
        >
          <Heart
            size={15}
            className={wishlisted ? 'fill-white text-white' : 'text-gray-500 hover:text-[#ba1f3d]'}
          />
        </button>

        {/* Product Image — desaturated at rest, full color on hover */}
        <MediaRenderer
          src={product.mediaType === 'embed' ? null : currentImage}
          embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
          mediaType={product.mediaType}
          alt={product.name}
          onLoad={() => { setHasLoaded(true); onImageLoad?.(); }}
          className={`w-full h-full object-cover transition-all duration-700 ease-out ${
            isHovered ? 'grayscale-0 scale-105' : 'grayscale-[0.15] scale-100'
          } ${product.stock === 0 ? 'grayscale opacity-40' : ''}`}
        />

        {/* Floating Cart Button — Design Spell: magnetic */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          {product.stock > 0 && (
            <button
              ref={cartBtnRef}
              onClick={handleAddToCart}
              className={`pointer-events-auto transition-all duration-500 ${
                isHovered
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-75'
              } ${
                cartBurst
                  ? 'bg-[#ba1f3d] shadow-[0_0_30px_rgba(186,31,61,0.6)]'
                  : 'bg-gray-900 shadow-[0_20px_50px_rgba(0,0,0,0.35)] hover:bg-[#ba1f3d]'
              } text-white rounded-full p-5`}
              style={{ willChange: 'transform' }}
            >
              <ShoppingCart size={20} />
            </button>
          )}
        </div>

        {/* Cart burst particles — Design Spell */}
        {cartBurst && (
          <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-[#ba1f3d]"
                style={{
                  animation: `burst-particle-${i} 0.6s ease-out forwards`,
                  transform: `rotate(${i * 45}deg) translateY(-30px)`,
                  opacity: 0,
                  animationDelay: `${i * 20}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Out of Stock Overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-gray-900 font-black uppercase tracking-[0.5em] text-[10px] border-b-2 border-gray-900 pb-1.5">
              {t('status.soldOut')}
            </span>
          </div>
        )}
      </div>

      {/* ── Product Details ──────────────────────────────────── */}
      <div
        className="flex flex-col flex-grow text-center px-1"
        style={{ transform: 'translateZ(10px)' }}
      >
        {/* Category */}
        <p className="text-[9px] font-black text-[#ba1f3d] mb-2 uppercase tracking-[0.4em] transition-opacity duration-300">
          {product.subCategory ?? product.bucket}
        </p>

        {/* Product Name — Design Spell: text scramble */}
        <p
          ref={nameRef}
          className="text-sm font-black text-gray-900 mb-3 uppercase tracking-tight leading-tight"
          style={{ transition: 'color 0.3s ease' }}
        >
          {product.name.toUpperCase()}
        </p>

        {/* Price — Design Spell: slight scale on hover */}
        <div className="mt-auto space-y-3">
          <p
            ref={priceRef}
            className="text-xl font-black text-gray-900 tracking-tighter transition-all duration-300"
            style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)', color: isHovered ? '#ba1f3d' : undefined }}
          >
            {formatPrice(product.price)}
          </p>

          {/* Color Swatches */}
          {product.colors?.length > 0 && (
            <div className="flex items-center justify-center space-x-2">
              {product.colors.map(color => (
                <button
                  key={color}
                  onClick={(e) => { e.stopPropagation(); setActiveColor(color); }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    activeColor === color
                      ? 'ring-2 ring-offset-2 ring-[#ba1f3d] scale-125'
                      : 'hover:scale-125 opacity-50 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.includes('|') ? color.split('|')[0] : color }}
                  title={color}
                />
              ))}
            </div>
          )}

          {/* Stars — fade in on hover */}
          <div className={`flex items-center justify-center space-x-0.5 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={9}
                className={i < product.rating ? 'fill-[#ba1f3d] text-[#ba1f3d]' : 'text-gray-200'}
              />
            ))}
            <span className="text-[8px] font-black text-gray-300 ml-1.5 uppercase tracking-widest">
              ({product.rating}.0)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
