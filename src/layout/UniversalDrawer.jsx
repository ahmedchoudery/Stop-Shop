import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, Star, Plus, Minus, Heart, Ruler, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import SizeChartModal from '../components/SizeChartModal';
import ProductLightbox from '../components/ProductLightbox';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const UPSELL_PRODUCTS = [
  { id: 'u1', name: 'Canvas Belt', price: 12.99, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=200&auto=format&fit=crop' },
  { id: 'u2', name: 'Cotton Socks', price: 8.99, image: 'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?q=80&w=200&auto=format&fit=crop' },
  { id: 'u3', name: 'Cap', price: 19.99, image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=200&auto=format&fit=crop' },
];

const UniversalDrawer = () => {
  const { isDrawerOpen, drawerMode, selectedProduct, closeDrawer, cartItems, removeFromCart, updateQuantity, total, addToCart, setActiveBucket, setActiveSub } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { addViewed } = useRecentlyViewed();

  const [activeColor, setActiveColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [sizeError, setSizeError] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (drawerMode === 'product' && selectedProduct) {
      setActiveColor(selectedProduct.colors?.[0] || null);
      setSelectedSize('M');
      setSizeError(false);
      addViewed(selectedProduct);
    }
  }, [drawerMode, selectedProduct]);

  if (!isDrawerOpen) return null;

  const currentImage = activeColor && selectedProduct?.variantImages?.[activeColor]
    ? selectedProduct.variantImages[activeColor]
    : selectedProduct?.image;

  const buildLightboxImages = () => {
    if (!selectedProduct) return [];
    const imgs = [];
    if (selectedProduct.variantImages) {
      Object.entries(selectedProduct.variantImages).forEach(([color, src]) => {
        imgs.push({ src, alt: selectedProduct.name, label: color });
      });
    } else if (selectedProduct.image) {
      imgs.push({ src: selectedProduct.image, alt: selectedProduct.name, label: 'Main' });
    }
    if (selectedProduct.lifestyleImage && !imgs.find(i => i.src === selectedProduct.lifestyleImage)) {
      imgs.push({ src: selectedProduct.lifestyleImage, alt: `${selectedProduct.name} lifestyle`, label: 'Lifestyle' });
    }
    return imgs;
  };

  const freeShippingThreshold = 100;
  const remaining = Math.max(0, freeShippingThreshold - total);
  const shippingProgress = Math.min(100, (total / freeShippingThreshold) * 100);
  const sizeChartCategory = selectedProduct?.bucket === 'Bottoms' ? 'Bottoms' : selectedProduct?.bucket === 'Accessories' ? 'Footwear' : 'Tops';

  /* ── CART ─────────────────────────────────────────────────── */
  const renderCartView = () => (
    <div className="h-full flex flex-col bg-white shadow-2xl">
      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-red-800 text-white">
        <div className="flex items-center space-x-3">
          <ShoppingBag size={24} />
          <h2 className="text-xl font-black uppercase tracking-tighter">Your Cart</h2>
          {cartItems.length > 0 && (
            <span className="bg-yellow-400 text-red-900 text-[10px] font-black px-2 py-0.5 rounded-full">
              {cartItems.reduce((s, i) => s + (i.quantity || 1), 0)}
            </span>
          )}
        </div>
        <button onClick={closeDrawer} className="p-2 hover:bg-red-700 rounded-full transition-all hover:rotate-90 transform">
          <X size={24} />
        </button>
      </div>

      {cartItems.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
            {remaining > 0 ? <>Add <span className="text-red-600">${remaining.toFixed(2)}</span> more for FREE shipping 🚚</> : '🎉 FREE shipping unlocked!'}
          </p>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 to-yellow-400 rounded-full transition-all duration-500" style={{ width: `${shippingProgress}%` }} />
          </div>
        </div>
      )}

      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6">
            <ShoppingBag size={64} strokeWidth={1} className="text-gray-200" />
            <div className="text-center">
              <p className="font-black uppercase tracking-widest text-sm text-gray-900">Your bag is empty.</p>
              <p className="text-xs text-gray-400 mt-2">Add some items to get started!</p>
            </div>
            <button onClick={() => { setActiveBucket('All'); setActiveSub(null); closeDrawer(); }} className="border-b-2 border-gray-300 pb-1 text-[11px] font-black uppercase tracking-widest hover:border-black hover:text-black transition-all">
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {cartItems.map(item => (
              <div key={item.activeColor ? `${item.id}-${item.activeColor}` : item.id} className="flex items-center space-x-4 group">
                <div className="w-20 h-24 bg-gray-50 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 leading-tight truncate pr-2">{item.name}</h3>
                    <p className="text-red-600 font-bold text-sm flex-shrink-0">${(item.price * (item.quantity || 1)).toFixed(2)}</p>
                  </div>
                  {item.selectedSize && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Size: {item.selectedSize}</p>}
                  <div className="flex items-center mt-2 space-x-3">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button onClick={() => updateQuantity(item.id, item.activeColor, -1)} className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"><Minus size={12} /></button>
                      <span className="text-xs font-black text-gray-700 px-2">{item.quantity || 1}</span>
                      <button onClick={() => updateQuantity(item.id, item.activeColor, 1)} className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"><Plus size={12} /></button>
                    </div>
                    {item.activeColor && <div className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ backgroundColor: item.activeColor }} />}
                  </div>
                  <p className="text-[10px] text-gray-300 mt-1">${item.price.toFixed(2)} each</p>
                </div>
                <button onClick={() => removeFromCart(item.id, item.activeColor)} className="p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex-shrink-0"><Trash2 size={16} /></button>
              </div>
            ))}

            <div className="pt-4 border-t border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">You might also like</p>
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {UPSELL_PRODUCTS.map(up => (
                  <div key={up.id} className="flex-shrink-0 w-28 group">
                    <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2">
                      <img src={up.image} alt={up.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-tight text-gray-900 truncate">{up.name}</p>
                    <p className="text-[10px] text-red-600 font-bold">${up.price}</p>
                    <button onClick={() => addToCart({ ...up, quantity: 1, cartId: Date.now() })} className="mt-1 w-full text-[9px] font-black uppercase tracking-widest bg-gray-100 hover:bg-black hover:text-white py-1.5 rounded-lg transition-all">+ Add</button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="p-6 border-t border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-black uppercase tracking-widest text-gray-400">Subtotal</span>
            <span className="text-2xl font-black text-gray-900">${total.toFixed(2)}</span>
          </div>
          <Link to="/checkout" onClick={closeDrawer} className="flex items-center justify-center space-x-3 w-full bg-black text-white py-4 font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl active:scale-[0.98] rounded-xl text-sm mb-3">
            <span>Checkout</span><ArrowRight size={18} />
          </Link>
          <button onClick={closeDrawer} className="w-full text-gray-300 py-3 text-[10px] font-black uppercase tracking-widest hover:text-gray-900 transition-colors">Continue Shopping</button>
        </div>
      )}
    </div>
  );

  /* ── PRODUCT ──────────────────────────────────────────────── */
  const renderProductView = () => {
    if (!selectedProduct) return null;
    const wishlisted = isWishlisted(selectedProduct.id);
    const lightboxImages = buildLightboxImages();

    return (
      <div className="h-full flex flex-col bg-white shadow-2xl overflow-y-auto relative">
        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
          <button onClick={closeDrawer} className="p-2 bg-white/90 hover:bg-white backdrop-blur-md rounded-full shadow-lg transition-all hover:rotate-90 transform text-gray-900"><X size={22} /></button>
          <button onClick={() => toggleWishlist(selectedProduct)} className={`p-2 backdrop-blur-md rounded-full shadow-lg transition-all ${wishlisted ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400 hover:text-red-500'}`}><Heart size={18} className={wishlisted ? 'fill-white' : ''} /></button>
          <button onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }} className="p-2 bg-white/90 hover:bg-white backdrop-blur-md rounded-full shadow-lg transition-all text-gray-500 hover:text-gray-900" title="Full screen"><Maximize2 size={18} /></button>
        </div>

        {/* Main Image — click to lightbox */}
        <div className="w-full aspect-[4/5] bg-gray-50 relative overflow-hidden cursor-zoom-in flex-shrink-0" onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}>
          <img src={currentImage} alt={selectedProduct.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          {selectedProduct.stock > 0 && selectedProduct.stock <= 5 && (
            <div className="absolute top-4 left-4"><span className="bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded uppercase tracking-widest animate-pulse">Only {selectedProduct.stock} left!</span></div>
          )}
          <div className="absolute bottom-4 left-4 pointer-events-none"><span className="bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded shadow-lg uppercase tracking-widest">Trending</span></div>
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center space-x-2">
              <Maximize2 size={14} className="text-gray-700" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">Full Screen</span>
            </div>
          </div>
        </div>

        {/* Thumbnail strip */}
        {lightboxImages.length > 1 && (
          <div className="flex space-x-2 px-6 py-3 border-b border-gray-100 overflow-x-auto flex-shrink-0">
            {lightboxImages.map((img, idx) => (
              <button key={idx} onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }} className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${img.src === currentImage ? 'border-gray-900 scale-105' : 'border-gray-100 hover:border-gray-300'}`}>
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-6 md:p-8 flex flex-col flex-grow">
          {/* Title / Price */}
          <div className="mb-4">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2 leading-tight">{selectedProduct.name}</h2>
            <p className="text-xl text-red-600 font-bold">${selectedProduct.price.toFixed(2)}</p>
            <div className="flex items-center space-x-1 mt-2">
              {[...Array(5)].map((_, i) => (<Star key={i} size={13} className={i < selectedProduct.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />))}
              <span className="text-xs text-gray-400 ml-2">({selectedProduct.rating}.0)</span>
            </div>
          </div>

          {/* Size Selector */}
          <div className="mb-6 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Size</h3>
              <button onClick={() => setSizeChartOpen(true)} className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors border-b border-red-200">
                <Ruler size={12} /><span>Size Chart</span>
              </button>
            </div>
            {sizeError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2 animate-fade-up">← Please select a size first</p>}
            <div className="flex flex-wrap gap-2">
              {SIZES.map(size => (
                <button key={size} onClick={() => { setSelectedSize(size); setSizeError(false); }} className={`size-btn ${selectedSize === size ? 'active' : ''}`}>{size}</button>
              ))}
            </div>
          </div>

          {/* Colors */}
          {selectedProduct.colors?.length > 0 && (
            <div className="mb-6 pt-5 border-t border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Color</h3>
              <div className="flex items-center space-x-3">
                {selectedProduct.colors.map(color => (
                  <button key={color} onClick={() => setActiveColor(color)} className={`w-8 h-8 rounded-full border border-gray-300 transition-all shadow-sm ${activeColor === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          )}

          {/* Specs */}
          {selectedProduct.specs?.length > 0 && (
            <div className="mb-6 pt-5 border-t border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Details</h3>
              <ul className="text-xs uppercase tracking-tighter text-gray-500 space-y-2 font-semibold">
                {selectedProduct.specs.map((spec, i) => (<li key={i} className="flex items-center space-x-2"><span className="text-red-400 font-black">—</span><span>{spec}</span></li>))}
              </ul>
            </div>
          )}

          <div className="flex-grow" />

          {/* CTAs */}
          <div className="mt-4 pt-6 border-t border-gray-100 space-y-3">
            {selectedProduct.stock > 0 ? (
              <button onClick={() => { if (!selectedSize) { setSizeError(true); return; } addToCart({ ...selectedProduct, image: currentImage, activeColor, selectedSize }); }} className="w-full bg-red-600 text-white font-black py-4 rounded-xl shadow-xl hover:bg-red-700 active:scale-[0.98] text-sm uppercase tracking-[0.2em] transition-all flex justify-center items-center group">
                <span className="group-hover:mr-2 transition-all">Add to Bag</span>
                <span className="opacity-0 group-hover:opacity-100 transition-all text-yellow-400 text-lg font-bold leading-none">+</span>
              </button>
            ) : (
              <button disabled className="w-full bg-gray-100 text-gray-400 font-black py-4 rounded-xl text-sm uppercase tracking-[0.2em] cursor-not-allowed">Sold Out</button>
            )}
            <button onClick={() => toggleWishlist(selectedProduct)} className={`w-full flex items-center justify-center space-x-2 py-3 border-2 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${wishlisted ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-900'}`}>
              <Heart size={14} className={wishlisted ? 'fill-red-500' : ''} />
              <span>{wishlisted ? 'Wishlisted ✓' : 'Save to Wishlist'}</span>
            </button>
            <p className="text-center text-[10px] text-gray-300 uppercase tracking-widest">Free Shipping & Returns · 30-Day Policy</p>
          </div>
        </div>

        {/* Modals — rendered inside drawer so they sit above it */}
        <SizeChartModal isOpen={sizeChartOpen} onClose={() => setSizeChartOpen(false)} defaultCategory={sizeChartCategory} />
        <ProductLightbox images={lightboxImages} startIndex={lightboxIndex} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={closeDrawer} />
      <div className={`absolute inset-y-0 right-0 max-w-full flex transform transition-transform duration-500 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="w-screen max-w-md md:max-w-lg">
          {drawerMode === 'product' ? renderProductView() : renderCartView()}
        </div>
      </div>
    </div>
  );
};

export default UniversalDrawer;