import React, { useState, useEffect } from 'react';
import { Star, Heart, Play } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import MediaRenderer from './MediaRenderer';

const ProductCard = ({ product, onSelectProduct, onImageLoad }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [activeColor, setActiveColor] = useState(product.colors?.[0] || null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [wishlistAnim, setWishlistAnim] = useState(false);

  const CARDINAL = '#ba1f3d';

  const baseImage = activeColor && product.variantImages?.[activeColor]
    ? product.variantImages[activeColor]
    : product.image;

  const currentImage = (activeColor && product.variantImages?.[activeColor])
    ? product.variantImages[activeColor]
    : (product.gallery?.length > 0
      ? product.gallery[galleryIndex % product.gallery.length]
      : product.image);

  useEffect(() => {
    setHasLoaded(false);
  }, [currentImage]);

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

  const cycleGallery = (direction) => {
    if (!product.gallery?.length) return;
    setGalleryIndex((prev) => {
      const length = product.gallery.length;
      return (prev + direction + length) % length;
    });
  };

  const wishlisted = isWishlisted(product.id);

  return (
    <div
      className="group relative bg-white overflow-hidden transition-all duration-500 flex flex-col h-full cursor-pointer tilt-wrapper p-4 sm:p-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelectProduct}
    >
      {/* Trending Badge */}
      <div className="absolute top-4 left-4 z-10">
        <span className="bg-[#ba1f3d] text-white text-[8px] sm:text-[9px] font-black px-3 py-1 rounded-none shadow-xl uppercase tracking-[0.2em]">
          Trending
        </span>
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlist}
        className={`absolute top-4 right-4 z-10 p-2.5 rounded-full transition-all duration-500 ${wishlisted
            ? 'bg-white shadow-xl'
            : 'bg-white opacity-0 group-hover:opacity-100 shadow-lg'
          } ${wishlistAnim ? 'scale-125' : 'scale-100'}`}
      >
        <Heart
          size={16}
          className={`transition-all duration-300 ${wishlisted ? 'fill-[#ba1f3d] text-[#ba1f3d]' : 'text-gray-400 hover:text-[#ba1f3d]'}`}
        />
      </button>

      {/* Image Container */}
      <div className="aspect-[4/5] overflow-hidden bg-white relative">
        <MediaRenderer
          src={product.mediaType === 'embed' ? null : (isHovered && product.lifestyleImage ? product.lifestyleImage : currentImage)}
          embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
          mediaType={product.mediaType}
          alt={product.name}
          onLoad={handleLoad}
          className={`w-full h-full object-cover mix-blend-multiply transition-all duration-1000 ease-out ${isHovered ? 'scale-110' : 'scale-100'
            } ${product.stock === 0 ? 'grayscale opacity-70' : ''}`}
        />

        {product.gallery?.length > 1 && (
          <div className="absolute top-2 right-2 left-2 flex justify-between items-center pointer-events-auto">
            <button onClick={(e) => { e.stopPropagation(); cycleGallery(-1); }}
              className="bg-white/90 text-gray-800 p-1 rounded-full shadow-md hover:bg-white transition-colors">‹</button>
            <span className="bg-black/70 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-xl">{galleryIndex + 1}/{product.gallery.length}</span>
            <button onClick={(e) => { e.stopPropagation(); cycleGallery(1); }}
              className="bg-white/90 text-gray-800 p-1 rounded-full shadow-md hover:bg-white transition-colors">›</button>
          </div>
        )}


        {product.mediaType === 'embed' && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-black/70 text-white text-[8px] sm:text-[9px] font-black px-3 py-1 uppercase tracking-[0.2em] rounded">
              <span className="inline-flex items-center space-x-1"><Play size={12} /><span>Video</span></span>
            </span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px] flex items-center justify-center">
            <span className="text-gray-900 font-black uppercase tracking-[0.4em] text-[10px] border-b-2 border-gray-900 pb-1">
              Sold Out
            </span>
          </div>
        )}

        {/* Add to Cart Button */}
        <div className="absolute inset-0 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
          {product.stock > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart({ ...product, image: currentImage, activeColor });
              }}
              style={{ backgroundColor: CARDINAL }}
              className="text-white font-black py-4 px-10 shadow-2xl hover:brightness-110 active:scale-95 text-[10px] uppercase tracking-[0.3em] transition-all"
            >
              Add To Bag
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="pt-6 flex flex-col flex-grow text-left">
        {/* Color Swatches */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center space-x-3 mb-4">
            {product.colors.map((color) => (
              <button
                key={color}
                onClick={(e) => { e.stopPropagation(); setActiveColor(color); }}
                className={`w-4 h-4 transition-all duration-300 ${activeColor === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-125 border border-gray-100'
                  }`}
                style={
                  color.includes('|')
                    ? { background: `linear-gradient(to right, ${color.split('|')[0]} 50%, ${color.split('|')[1]} 50%)` }
                    : { backgroundColor: color }
                }
                title={color}
              />
            ))}
          </div>
        )}

        <h3 className="text-[11px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">
          {product.subCategory || product.bucket}
        </h3>
        
        <p className="text-base font-black text-gray-900 mb-2 uppercase tracking-tight leading-tight">
          {product.name}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <p className="text-lg font-black text-[#ba1f3d] tracking-tight">
            PKR {product.price.toLocaleString()}
          </p>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="text-[8px] font-black uppercase tracking-widest text-[#ba1f3d] animate-pulse">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-0.5 mt-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={12}
              className={`transition-colors duration-300 ${i < product.rating ? "fill-[#ba1f3d] text-[#ba1f3d]" : "text-gray-100"}`}
            />
          ))}
          <span className="text-[8px] font-black text-gray-300 ml-2 uppercase tracking-widest">({product.rating}.0)</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
