import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, Star, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const UniversalDrawer = () => {
  const { 
    isDrawerOpen, drawerMode, selectedProduct, closeDrawer, 
    cartItems, removeFromCart, updateQuantity, total, addToCart,
    setActiveBucket, setActiveSub
  } = useCart();

  // ----- Product Mode State & Handlers -----
  const [activeColor, setActiveColor] = useState(null);
  const [zoomStyle, setZoomStyle] = useState({ scale: 1, originX: 50, originY: 50 });

  useEffect(() => {
    if (drawerMode === 'product' && selectedProduct?.colors?.length > 0) {
      setActiveColor(selectedProduct.colors[0]);
    }
  }, [drawerMode, selectedProduct]);

  if (!isDrawerOpen) return null;

  // Zoom Handlers
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ scale: 2, originX: x, originY: y });
  };
  const handleMouseLeave = () => setZoomStyle({ scale: 1, originX: 50, originY: 50 });

  // Render Cart View
  const renderCartView = () => (
    <div className="h-full flex flex-col bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-red-800 text-white">
        <div className="flex items-center space-x-3">
          <ShoppingBag size={24} />
          <h2 className="text-xl font-black uppercase tracking-tighter">Your Cart</h2>
        </div>
        <button onClick={closeDrawer} className="p-2 hover:bg-red-700 rounded-full transition-all transform hover:rotate-90">
          <X size={24} />
        </button>
      </div>

      {/* Items */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-6">
            <ShoppingBag size={64} strokeWidth={1} className="text-gray-300" />
            <p className="font-black uppercase tracking-widest text-sm text-gray-900">Your bag is empty.</p>
            <button 
              onClick={() => {
                setActiveBucket('All');
                setActiveSub(null);
                closeDrawer();
              }}
              className="uppercase tracking-widest border-b-2 border-gray-300 pb-1 text-[11px] font-black hover:border-black hover:text-black transition-all"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.activeColor ? `${item.id}-${item.activeColor}` : item.id} className="flex items-center space-x-4 group">
              <div className="w-20 h-24 bg-gray-50 flex-shrink-0 overflow-hidden rounded-sm border border-gray-100">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">{item.name}</h3>
                  <p className="text-red-600 font-bold text-sm">${(item.price * (item.quantity || 1)).toFixed(2)}</p>
                </div>
                
                <div className="flex items-center mt-2 space-x-3">
                  {/* Quantity Actions */}
                  <div className="flex items-center border border-gray-200 rounded-sm">
                    <button onClick={() => updateQuantity(item.id, item.activeColor, -1)} className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-black text-gray-600 uppercase px-2 w-6 text-center">{item.quantity || 1}</span>
                    <button onClick={() => updateQuantity(item.id, item.activeColor, 1)} className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  {item.activeColor && (
                    <div className="flex items-center">
                      <span className="text-[10px] uppercase font-bold text-gray-400 mr-2">Color:</span>
                      <div className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: item.activeColor }}></div>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 italic">${item.price.toFixed(2)} each</p>
              </div>
              <button 
                onClick={() => removeFromCart(item.id, item.activeColor)}
                className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Sticky Footer */}
      {cartItems.length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-white">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-black uppercase tracking-widest text-gray-400">Total</span>
            <span className="text-2xl font-black text-gray-900">${total.toFixed(2)}</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Link 
              to="/checkout" 
              onClick={closeDrawer}
              className="flex items-center justify-center space-x-3 w-full bg-black text-white py-4 font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl active:scale-[0.98]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={20} />
            </Link>
            
            <button 
              onClick={closeDrawer}
              className="w-full bg-transparent text-gray-400 py-3 text-[10px] font-black uppercase tracking-widest hover:text-gray-900 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render Product View
  const renderProductView = () => {
    if (!selectedProduct) return null;
    const currentImage = activeColor && selectedProduct.variantImages?.[activeColor] 
      ? selectedProduct.variantImages[activeColor] 
      : selectedProduct.image;

    return (
      <div className="h-full flex flex-col bg-white shadow-2xl overflow-y-auto">
        <div className="absolute top-0 w-full flex justify-end p-4 z-10">
          <button onClick={closeDrawer} className="p-2 bg-white/80 hover:bg-white backdrop-blur-md rounded-full shadow-lg transition-all transform hover:rotate-90 text-gray-900">
            <X size={24} />
          </button>
        </div>

        {/* Interactive Image */}
        <div 
          className="w-full aspect-[4/5] bg-gray-50 relative overflow-hidden cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <img 
            src={currentImage} 
            alt={selectedProduct.name} 
            className="w-full h-full object-cover transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoomStyle.scale})`, transformOrigin: `${zoomStyle.originX}% ${zoomStyle.originY}%` }}
          />
          <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
            <span className="bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded shadow-lg uppercase tracking-widest">
              Trending
            </span>
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col flex-grow">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">{selectedProduct.name}</h2>
            <p className="text-xl text-red-600 font-bold tracking-tight">${selectedProduct.price.toFixed(2)}</p>
            <div className="flex items-center space-x-1 mt-3 opacity-80">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className={i < selectedProduct.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
              ))}
              <span className="text-xs text-gray-400 ml-2 font-medium">({selectedProduct.rating}.0)</span>
            </div>
          </div>

          {selectedProduct.specs && selectedProduct.specs.length > 0 && (
            <div className="mb-8 pt-6 border-t border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Details</h3>
              <ul className="text-xs uppercase tracking-tighter text-gray-500 list-none space-y-2 font-semibold">
                {selectedProduct.specs.map((spec, index) => (
                  <li key={index}>— {spec}</li>
                ))}
              </ul>
            </div>
          )}

          {selectedProduct.colors && selectedProduct.colors.length > 0 && (
            <div className="mb-8 pt-6 border-t border-gray-100">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Select Color</h3>
              <div className="flex items-center space-x-3">
                {selectedProduct.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setActiveColor(color)}
                    className={`w-8 h-8 rounded-full border border-gray-300 transition-all duration-300 shadow-sm ${
                      activeColor === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex-grow"></div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            {selectedProduct.stock > 0 ? (
              <button
                onClick={() => {
                  addToCart({ ...selectedProduct, image: currentImage, activeColor });
                  // Don't close immediately. Optional: switch mode to cart instead!
                  // closeDrawer();
                }}
                className="w-full bg-red-600 text-white font-black py-4 rounded-sm shadow-xl hover:bg-red-700 active:scale-[0.98] text-sm uppercase tracking-[0.2em] transition-all flex justify-center items-center group"
              >
                <span className="group-hover:mr-2 transition-all">Add to Bag</span>
                <span className="opacity-0 group-hover:opacity-100 font-bold transition-all text-yellow-400">+</span>
              </button>
            ) : (
              <button disabled className="w-full bg-gray-200 text-gray-400 font-black py-4 rounded-sm text-sm uppercase tracking-[0.2em] cursor-not-allowed border border-gray-300">
                Sold Out
              </button>
            )}
            <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-medium">
              Complimentary Shipping & Returns
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Dimmed Overlay */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeDrawer}
      ></div>

      {/* Drawer */}
      <div 
        className={`absolute inset-y-0 right-0 max-w-full flex transform transition-transform duration-500 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="w-screen max-w-md md:max-w-lg">
          {drawerMode === 'product' ? renderProductView() : renderCartView()}
        </div>
      </div>
    </div>
  );
};

export default UniversalDrawer;
