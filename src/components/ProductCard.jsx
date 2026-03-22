import React, { useState, useEffect } from 'react';
import { Star, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const ProductCard = ({ product, onSelectProduct, onImageLoad }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [activeColor, setActiveColor] = useState(product.colors?.[0] || null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [wishlistAnim, setWishlistAnim] = useState(false);

  const currentImage = activeColor && product.variantImages?.[activeColor]
    ? product.variantImages[activeColor]
    : product.image;

  useEffect(() => {
    setHasLoaded(false);
  }, [product.id]);

  const handleLoad = () => {
    if (!hasLoaded) {
      setHasLoaded(true);
      if (onImageLoad) onImageLoad();
    }
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    toggleWishlist(product);
    setWishlistAnim(true);
    setTimeout(() => setWishlistAnim(false), 600);
  };

  const wishlisted = isWishlisted(product.id);

  return (
    <div
      className="group relative bg-transparent overflow-hidden transition-all flex flex-col h-full cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelectProduct}
    >
      {/* Trending Badge */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
        <span className="bg-yellow-400 text-black text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-tighter badge-pulse">
          Trending
        </span>
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlist}
        className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-2 rounded-full transition-all duration-300 ${wishlisted
            ? 'bg-red-50 shadow-md'
            : 'bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 shadow-sm'
          } ${wishlistAnim ? 'scale-125' : 'scale-100'}`}
      >
        <Heart
          size={15}
          className={`transition-all duration-300 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`}
        />
      </button>

      {/* Image Container */}
      <div className="aspect-square overflow-hidden bg-transparent relative">
        <img
          src={isHovered && product.lifestyleImage ? product.lifestyleImage : currentImage}
          alt={product.name}
          onLoad={handleLoad}
          className={`w-full h-full object-cover mix-blend-multiply transition-all duration-700 ${isHovered ? 'scale-108' : 'scale-100'
            } ${product.stock === 0 ? 'grayscale opacity-70' : ''}`}
          style={{ transform: isHovered ? 'scale(1.08)' : 'scale(1)' }}
        />

        {/* Out of Stock Overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] px-4 py-2 shadow-2xl skew-x-[-12deg]">
              Out of Stock
            </span>
          </div>
        )}

        {/* Add to Cart Button */}
        <div className="absolute inset-0 flex items-end justify-center pb-4 sm:pb-6 transition-all duration-500 sm:translate-y-4 sm:group-hover:translate-y-0 sm:opacity-0 sm:group-hover:opacity-100 opacity-100 translate-y-0">
          {product.stock > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart({ ...product, image: currentImage, activeColor });
              }}
              style={{ backgroundColor: '#F63049' }}
              className="text-white font-black py-2.5 px-8 rounded-sm shadow-2xl hover:brightness-110 active:scale-95 text-[11px] sm:text-xs uppercase tracking-[0.25em] transition-all flex items-center space-x-2"
            >
              <span>+ BAG</span>
            </button>
          ) : (
            <button
              disabled
              className="bg-gray-400 text-white font-black py-2 px-6 rounded-sm shadow-xl text-[10px] sm:text-xs uppercase tracking-[0.2em] cursor-not-allowed opacity-80"
            >
              Sold Out
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-grow text-left">
        {/* Color Swatches */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center space-x-2 mb-3">
            {product.colors.map((color) => (
              <button
                key={color}
                onClick={(e) => { e.stopPropagation(); setActiveColor(color); }}
                className={`w-4 h-4 rounded-full border border-gray-300 transition-all duration-200 ${activeColor === color ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-110'
                  }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}

        <h3 className="text-sm font-black text-black mb-1 uppercase tracking-tight">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <p style={{ color: '#F63049' }} className="text-base font-black">
            ${product.price.toFixed(2)}
          </p>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-2 py-0.5 rounded">
              Only {product.stock} left!
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-0.5 mt-2 opacity-60">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={12}
              className={i < product.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;