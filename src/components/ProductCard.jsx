import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Star, Heart, Play, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLocale } from '../context/LocaleContext';
import MediaRenderer from './MediaRenderer';
import { gsap } from 'gsap';

const ProductCard = ({ product, onSelectProduct, onImageLoad }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();
  const { t } = useLocale();
  
  const [activeColor, setActiveColor] = useState(product.colors?.[0] || null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [wishlistAnim, setWishlistAnim] = useState(false);

  const cardRef = useRef(null);
  const buttonRef = useRef(null);
  const contentRef = useRef(null);

  const CARDINAL = '#ba1f3d';

  const currentImage = (activeColor && product.variantImages?.[activeColor])
    ? product.variantImages[activeColor]
    : (product.gallery?.length > 0
      ? product.gallery[galleryIndex % product.gallery.length]
      : product.image);

  useEffect(() => {
    setHasLoaded(false);
  }, [currentImage]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;

    gsap.to(cardRef.current, {
      rotateX: rotateX,
      rotateY: rotateY,
      duration: 0.5,
      ease: 'power2.out',
      transformPerspective: 1000
    });

    // Magnetic Button Effect
    if (buttonRef.current) {
      const btnRect = buttonRef.current.getBoundingClientRect();
      const btnX = e.clientX - (btnRect.left + btnRect.width / 2);
      const btnY = e.clientY - (btnRect.top + btnRect.height / 2);
      
      const distance = Math.sqrt(btnX * btnX + btnY * btnY);
      
      if (distance < 100) {
        gsap.to(buttonRef.current, {
          x: btnX * 0.3,
          y: btnY * 0.3,
          duration: 0.3,
          ease: 'power1.out'
        });
      } else {
        gsap.to(buttonRef.current, { x: 0, y: 0, duration: 0.5 });
      }
    }
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.7,
      ease: 'elastic.out(1, 0.3)'
    });
    gsap.to(buttonRef.current, { x: 0, y: 0, duration: 0.5 });
  };

  const handleLoad = useCallback(() => {
    if (!hasLoaded) {
      setHasLoaded(true);
      if (onImageLoad) onImageLoad();
    }
  }, [hasLoaded, onImageLoad]);

  const handleWishlist = useCallback((e) => {
    e.stopPropagation();
    toggleWishlist(product);
    setWishlistAnim(true);
    setTimeout(() => setWishlistAnim(false), 600);
  }, [product, toggleWishlist]);

  const cycleGallery = useCallback((direction) => {
    if (!product.gallery?.length) return;
    setGalleryIndex((prev) => {
      const length = product.gallery.length;
      return (prev + direction + length) % length;
    });
  }, [product.gallery]);

  const handleColorChange = useCallback((e, color) => {
    e.stopPropagation();
    setActiveColor(color);
  }, []);

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    addToCart({ ...product, image: currentImage, activeColor });
  }, [addToCart, product, currentImage, activeColor]);

  const wishlisted = isWishlisted(product.id);

  return (
    <div
      ref={cardRef}
      className="group relative bg-white flex flex-col h-full cursor-pointer overflow-visible"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onSelectProduct}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Background Shadow Effect */}
      <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10 blur-2xl transform scale-110" />

      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-white mb-6" style={{ transform: 'translateZ(40px)' }}>
        {/* Trending Badge */}
        <div className="absolute top-6 left-6 z-20">
          <span className="bg-[#ba1f3d] text-white text-[9px] font-black px-4 py-1.5 uppercase tracking-[0.3em] shadow-xl">
            {t('status.trending')}
          </span>
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={`absolute top-6 right-6 z-20 p-3 rounded-full transition-all duration-500 bg-white/90 backdrop-blur-sm ${
            wishlisted ? 'shadow-xl scale-110' : 'opacity-0 group-hover:opacity-100 shadow-lg translate-y-2 group-hover:translate-y-0'
          }`}
        >
          <Heart
            size={16}
            className={`transition-colors duration-300 ${wishlisted ? 'fill-[#ba1f3d] text-[#ba1f3d]' : 'text-gray-400 hover:text-[#ba1f3d]'}`}
          />
        </button>

        <MediaRenderer
          src={product.mediaType === 'embed' ? null : currentImage}
          embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
          mediaType={product.mediaType}
          alt={product.name}
          onLoad={handleLoad}
          className={`w-full h-full object-cover mix-blend-multiply transition-all duration-1000 ease-out grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 ${
            product.stock === 0 ? 'grayscale opacity-50' : ''
          }`}
        />

        {/* Floating Add to Cart Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          {product.stock > 0 && (
            <button
              ref={buttonRef}
              onClick={handleAddToCart}
              className="pointer-events-auto opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100 bg-gray-900 text-white rounded-full p-6 shadow-[0_30px_60px_rgba(0,0,0,0.3)] hover:bg-[#ba1f3d]"
            >
              <ShoppingCart size={24} />
            </button>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center">
            <span className="text-gray-900 font-black uppercase tracking-[0.5em] text-[10px] border-b-2 border-gray-900 pb-2">
              {t('status.soldOut')}
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div ref={contentRef} className="flex flex-col flex-grow text-center" style={{ transform: 'translateZ(20px)' }}>
        <h3 className="text-[9px] font-black text-[#ba1f3d] mb-3 uppercase tracking-[0.4em] opacity-60 group-hover:opacity-100 transition-opacity">
          {product.subCategory || product.bucket}
        </h3>
        
        <p className="text-lg font-black text-gray-900 mb-3 uppercase tracking-tight leading-tight group-hover:text-[#ba1f3d] transition-colors px-2">
          {product.name}
        </p>

        <div className="flex flex-col items-center justify-center mt-auto space-y-4">
          <p className="text-xl font-black text-gray-900 tracking-tighter">
            {formatPrice(product.price)}
          </p>

          {/* Color Swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center justify-center space-x-2">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={(e) => handleColorChange(e, color)}
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    activeColor === color ? 'ring-2 ring-offset-2 ring-[#ba1f3d] scale-125' : 'hover:scale-150 opacity-40 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.includes('|') ? color.split('|')[0] : color }}
                  title={color}
                />
              ))}
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center justify-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={10}
                className={`${i < product.rating ? "fill-[#ba1f3d] text-[#ba1f3d]" : "text-gray-200"}`}
              />
            ))}
            <span className="text-[8px] font-black text-gray-300 ml-2 uppercase tracking-widest">({product.rating}.0)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

