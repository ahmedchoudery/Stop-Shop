import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

/**
 * Reusable Product Card
 * @param {string} name - Product display name
 * @param {number} price - Product price
 * @param {string} image - Main product image URL
 * @param {string|number} id - Unique product identifier
 */
const ReusableProductCard = ({ name, price, image, id, colors, variantImages, gallery }) => {
  const { addToCart } = useCart();
  const [activeColor, setActiveColor] = useState(colors?.[0] || null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const baseImage = activeColor && variantImages?.[activeColor]
    ? variantImages[activeColor]
    : image;

  const galleryImage = Array.isArray(gallery) && gallery.length > 0
    ? gallery[galleryIndex % gallery.length]
    : null;

  const displayedImage = galleryImage || baseImage;

  const handleAddToCart = () => {
    addToCart({ id, name, price, image: displayedImage });
  };

  return (
    <div className="bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {/* Image Section */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={displayedImage}
          alt={name}
          className="w-full h-full object-cover"
        />
        {Array.isArray(gallery) && gallery.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-2">
            <button onClick={(e) => { e.stopPropagation(); setGalleryIndex((prev) => (prev - 1 + gallery.length) % gallery.length); }}
              className="bg-white/90 text-gray-800 rounded-full p-1.5 hover:bg-white transition-colors">‹</button>
            <button onClick={(e) => { e.stopPropagation(); setGalleryIndex((prev) => (prev + 1) % gallery.length); }}
              className="bg-white/90 text-gray-800 rounded-full p-1.5 hover:bg-white transition-colors">›</button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3 flex flex-grow flex-col">
        {/* Color Swatches */}
        {colors && colors.length > 0 && (
          <div className="flex items-center space-x-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setActiveColor(color)}
                className={`w-3.5 h-3.5 rounded-full border border-gray-300 transition-all ${activeColor === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}

        {/* Name */}
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">
          {name}
        </h3>

        {/* Price - Brand Red #F63049 */}
        <p className="text-lg font-black mt-auto" style={{ color: '#F63049' }}>
          ${parseFloat(price).toFixed(2)}
        </p>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="w-full bg-black text-white py-2.5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ReusableProductCard;
