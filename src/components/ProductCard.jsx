import React, { useState, useCallback } from 'react';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import MediaRenderer from './MediaRenderer.jsx';

const ProductCard = ({ product, onImageLoad }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();

  const [activeColor, setActiveColor] = useState(product.colors?.[0] ?? null);
  const [cartAdded, setCartAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const currentImage =
    (activeColor && product.variantImages?.[activeColor])
      ? product.variantImages[activeColor]
      : (product.image || product.gallery?.[0]);

  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock === 0;

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    if (outOfStock) return;
    addToCart({
      ...product,
      image: currentImage,
      selectedSize: product.sizes?.[0] ?? '',
      selectedColor: activeColor ?? '',
      quantity: 1,
    });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1800);
  }, [addToCart, product, currentImage, activeColor, outOfStock]);

  const handleWishlist = useCallback((e) => {
    e.stopPropagation();
    toggleWishlist(product);
  }, [product, toggleWishlist]);

  const handleCardClick = useCallback(() => {
    navigate(`/product/${product.id}`);
  }, [navigate, product.id]);

  const category = product.subCategory && product.subCategory.toLowerCase() !== 'general'
    ? product.subCategory
    : product.bucket;

  return (
    <article
      className="group relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* ── Image Container ─────────────────────────────── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F8F7F5] mb-4">

        {/* Main Image */}
        <MediaRenderer
          src={product.mediaType === 'embed' ? null : currentImage}
          embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
          mediaType={product.mediaType}
          alt={product.name}
          onLoad={() => onImageLoad?.()}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
            isHovered ? 'scale-[1.06]' : 'scale-100'
          } ${outOfStock ? 'opacity-50' : ''}`}
        />

        {/* Overlay on hover — actions */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {/* Gradient veil */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Quick view button */}
          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}
              className="w-full flex items-center justify-center space-x-2 bg-white text-gray-900 py-2.5 text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 hover:bg-[#ba1f3d] hover:text-white"
            >
              <Eye size={12} />
              <span>Quick View</span>
            </button>
          </div>
        </div>

        {/* Wishlist button — top right */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center transition-all duration-300 ${
            wishlisted
              ? 'bg-[#ba1f3d] opacity-100'
              : 'bg-white opacity-0 group-hover:opacity-100'
          }`}
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <Heart
            size={13}
            className={wishlisted ? 'fill-white text-white' : 'text-gray-700'}
          />
        </button>

        {/* Add to cart — top left, appears on hover */}
        {!outOfStock && (
          <button
            onClick={handleAddToCart}
            className={`absolute top-3 left-3 z-10 w-8 h-8 flex items-center justify-center bg-white transition-all duration-300 ${
              cartAdded ? 'bg-[#ba1f3d]' : ''
            } ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          >
            <ShoppingBag
              size={13}
              className={cartAdded ? 'text-white' : 'text-gray-700'}
            />
          </button>
        )}

        {/* Sold out badge */}
        {outOfStock && (
          <div className="absolute top-3 left-3 z-10 bg-white px-2 py-1">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500">
              Sold Out
            </span>
          </div>
        )}

        {/* New badge */}
        {!outOfStock && product.rating >= 5 && (
          <div className="absolute top-3 left-3 z-10 bg-[#ba1f3d] px-2 py-1">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">
              New
            </span>
          </div>
        )}
      </div>

      {/* ── Product Info ─────────────────────────────────── */}
      <div className="px-0.5">
        {/* Category */}
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.35em] mb-1.5">
          {category}
        </p>

        {/* Name */}
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-snug mb-2 group-hover:text-[#ba1f3d] transition-colors duration-300 line-clamp-1">
          {product.name}
        </h3>
        
        {/* Temporary debug tag to inspect url propagation */}
        <span className="text-[7px] text-gray-300 font-mono block truncate max-w-full mb-1">
          {currentImage}
        </span>

        {/* Price + Colors */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-gray-900 tracking-wide">
            {formatPrice(product.price)}
          </span>

          {/* Color dots */}
          {product.colors?.length > 0 && (
            <div className="flex items-center space-x-1">
              {product.colors.slice(0, 4).map(color => {
                const hex = color.includes('|') ? color.split('|')[0] : color;
                return (
                  <button
                    key={color}
                    onClick={(e) => { e.stopPropagation(); setActiveColor(color); }}
                    className={`w-2.5 h-2.5 rounded-full border transition-all duration-200 ${
                      activeColor === color
                        ? 'border-[#ba1f3d] ring-1 ring-[#ba1f3d] ring-offset-1'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                );
              })}
              {product.colors.length > 4 && (
                <span className="text-[8px] text-gray-400 font-bold">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>

        {/* Cart added feedback */}
        {cartAdded && (
          <p className="text-[9px] font-black text-[#ba1f3d] uppercase tracking-widest mt-1.5 animate-fade-up">
            ✓ Added to bag
          </p>
        )}
      </div>
    </article>
  );
};

export default ProductCard;