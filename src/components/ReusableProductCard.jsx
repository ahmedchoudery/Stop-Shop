import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

/**
 * Reusable Product Card
 * @param {string} name - Product display name
 * @param {number} price - Product price
 * @param {string} image - Main product image URL
 * @param {string|number} id - Unique product identifier
 */
const ReusableProductCard = ({ name, price, image, id, colors, variantImages }) => {
  const { addToCart } = useCart();
  const [activeColor, setActiveColor] = useState(colors?.[0] || null);

  const currentImage = activeColor && variantImages?.[activeColor] 
    ? variantImages[activeColor] 
    : image;

  const handleAddToCart = () => {
    addToCart({ id, name, price, image: currentImage });
  };

  return (
    <div className="bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {/* Image Section */}
      <div className="aspect-square bg-gray-50 overflow-hidden">
        <img 
          src={currentImage} 
          alt={name} 
          className="w-full h-full object-cover"
        />
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
