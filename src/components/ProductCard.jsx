import React, { useState, useEffect, useCallback, useRef } from 'react';
import anime from 'animejs';
import { Star, Heart, ShoppingCart, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import MediaRenderer from './MediaRenderer.jsx';
import { EASING } from '../hooks/useAnime.js';
import { useAntigravity } from '../hooks/useAntigravity.js';

const ProductCard = ({ product, onImageLoad }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();
  const { t } = useLocale();

  const [activeColor,  setActiveColor]  = useState(product.colors?.[0] ?? null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [hasLoaded,    setHasLoaded]    = useState(false);
  const [cartBurst,    setCartBurst]    = useState(false);
  const [wishlistAnim, setWishlistAnim] = useState(false);
  const [isHovered,    setIsHovered]    = useState(false);

  const priceRef   = useRef(null);

  // ── Antigravity Motion ───────────────────────────────────────
  const { elementRef: tiltRef, position: tiltPos } = useAntigravity({ type: 'tilt', power: 0.8 });


  // ── Cleanup cart burst animation ──────────────────────────────
  useEffect(() => {
    if (!cartBurst) return;
    const timer = setTimeout(() => setCartBurst(false), 600);
    return () => clearTimeout(timer);
  }, [cartBurst]);

  // ── Cleanup wishlist animation ────────────────────────────────
  useEffect(() => {
    if (!wishlistAnim) return;
    const timer = setTimeout(() => setWishlistAnim(false), 600);
    return () => clearTimeout(timer);
  }, [wishlistAnim]);

  // ── Current image ───────────────────────────────────────────
  const currentImage = (activeColor && product.variantImages?.[activeColor])
    ? product.variantImages[activeColor]
    : (product.gallery?.length > 0
        ? product.gallery[galleryIndex % product.gallery.length]
        : product.image);

  useEffect(() => { setHasLoaded(false); }, [currentImage]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    setCartBurst(true);
    setTimeout(() => setCartBurst(false), 600);

    addToCart({
      ...product,
      image:         currentImage,
      selectedSize:  product.sizes?.[0] ?? '',
      selectedColor: activeColor ?? '',
      quantity:      1,
    });
  }, [addToCart, product, currentImage, activeColor]);

  const handleWishlist = useCallback((e) => {
    e.stopPropagation();
    toggleWishlist(product);
    setWishlistAnim(true);
    setTimeout(() => setWishlistAnim(false), 600);
  }, [product, toggleWishlist]);

  const handleCardClick = useCallback(() => {
    navigate(`/product/${product.id}`);
  }, [navigate, product.id]);

  const wishlisted = isWishlisted(product.id);

  // Dynamic tilt strings
  const tiltTransform = `perspective(1000px) rotateX(${tiltPos.x}deg) rotateY(${tiltPos.y}deg) scale3d(1.02, 1.02, 1.02)`;
  const shineBackground = `radial-gradient(circle at ${(tiltPos.y / 20 + 0.5) * 100}% ${(tiltPos.x / 20 + 0.5) * 100}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;

  return (
    <div
      ref={tiltRef}
      className="group relative bg-white flex flex-col h-full cursor-pointer overflow-visible rounded-xl p-3 border border-gray-100/50 transition-all duration-500"
      data-selected-active={isHovered ? 'true' : 'false'}
      style={{ 
        transformStyle: 'preserve-3d', 
        willChange: 'transform',
        transform: isHovered ? tiltTransform : 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.1s linear' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isHovered ? '0 32px 80px rgba(0,0,0,0.08)' : 'none'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      {/* Shine overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ 
          background: shineBackground,
          mixBlendMode: 'overlay',
          transform: 'translateZ(1px)'
        }}
      />

      {/* ── Image Container ──────────────────────────────────── */}
      <div
        className="relative aspect-[4/5] overflow-hidden bg-gray-50 mb-5 rounded-lg antigravity-depth"
        style={{ transform: 'translateZ(30px)' }}
      >
        {/* Trending Badge */}
        <div className="absolute top-4 left-4 z-20">
          <span className="glass-premium bg-[#ba1f3d] text-white text-[8px] font-black px-3 py-1.5 uppercase tracking-[0.3em] rounded-full">
            {t('status.trending')}
          </span>
        </div>

        {/* Wishlist Heart */}
        <button
          onClick={handleWishlist}
          className={`absolute top-4 right-4 z-20 p-2.5 rounded-full transition-all duration-500 ${
            wishlisted
              ? 'bg-[#ba1f3d] shadow-xl shadow-red-500/30 scale-110'
              : 'bg-white/90 shadow-lg translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100'
          }`}
          style={{
            transform:  wishlistAnim ? 'scale(1.4)' : undefined,
            willChange: 'transform',
          }}
        >
          <Heart
            size={14}
            className={wishlisted ? 'fill-white text-white' : 'text-gray-400 group-hover:text-[#ba1f3d]'}
          />
        </button>

        {/* Product Image — BEAM REVEAL */}
        <MediaRenderer
          src={product.mediaType === 'embed' ? null : currentImage}
          embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
          mediaType={product.mediaType}
          alt={product.name}
          onLoad={() => { setHasLoaded(true); onImageLoad?.(); }}
          className={`w-full h-full object-cover transition-all duration-[1s] ease-out animate-beam-reveal ${
            isHovered ? 'scale-110 blur-0' : 'scale-100'
          } ${product.stock === 0 ? 'grayscale opacity-30' : ''}`}
        />

        {/* Quick Add Button — BOTTON RIGHT */}
        <div className="absolute bottom-4 right-4 z-30">
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className={`transition-all duration-500 rounded-xl p-3 flex items-center justify-center ${
                cartBurst
                  ? 'bg-gray-900 shadow-xl scale-90'
                  : 'bg-[#ba1f3d] hover:bg-gray-900 shadow-lg shadow-red-500/20 translate-y-2 group-hover:translate-y-0 opacity-100 lg:opacity-0' 
              } text-white`}
              style={{ 
                willChange: 'transform',
              }}
            >
              <div className="flex items-center justify-center relative">
                {cartBurst ? <ShoppingCart size={16} /> : <Plus size={16} />}
              </div>
              <div className="absolute -top-1 -right-1">
                 {cartBurst && <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />}
              </div>
            </button>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px] flex items-center justify-center">
            <span className="text-[#ba1f3d] font-black uppercase tracking-[0.5em] text-[9px] border-b border-[#ba1f3d]/30 pb-2">
              {t('status.soldOut')}
            </span>
          </div>
        )}
      </div>

      {/* ── Product Details ──────────────────────────────────── */}
      <div
        className="flex flex-col flex-grow text-center px-1 antigravity-depth"
        style={{ transform: 'translateZ(20px)' }}
      >
        <p className="text-[8px] font-black text-[#ba1f3d] mb-2 uppercase tracking-[0.4em]">
          {product.subCategory && product.subCategory.toLowerCase() !== 'general'
            ? product.subCategory
            : product.bucket}
        </p>

        <p
          className="text-xs font-black text-gray-900 mb-3 uppercase tracking-tighter leading-tight"
        >
          {product.name.toUpperCase()}
        </p>

        <div className="mt-auto space-y-3">
          <p
            ref={priceRef}
            className="text-lg font-black text-gray-900 tracking-widest transition-all duration-300"
            style={{
              color: isHovered ? '#ba1f3d' : undefined,
            }}
          >
            {formatPrice(product.price)}
          </p>

          {/* Color Swatches */}
          {product.colors?.length > 0 && (
            <div className="flex items-center justify-center space-x-2">
              {product.colors.map(color => (
                <button
                  key={color}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveColor(color);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                    activeColor === color
                      ? 'ring-1 ring-offset-2 ring-offset-black ring-[#ba1f3d] scale-125'
                      : 'opacity-40 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.includes('|') ? color.split('|')[0] : color }}
                />
              ))}
            </div>
          )}

          {/* Stars */}
          <div className={`flex items-center justify-center space-x-0.5 transition-opacity duration-700 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={8}
                className={i < product.rating ? 'fill-[#ba1f3d] text-[#ba1f3d]' : 'text-gray-200'}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;