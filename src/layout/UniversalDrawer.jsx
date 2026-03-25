import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, Star, Plus, Minus, Heart, Ruler, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRecentlyViewed } from '../components/RecentlyViewedContext';
import SizeChartModal from '../components/SizeChartModal';
import ProductLightbox from '../components/ProductLightbox';
import MediaRenderer from '../components/MediaRenderer';

const getPresetSizes = (product) => {
  const bucket = (product?.bucket || '').toLowerCase();
  const subCategory = (product?.subCategory || '').toLowerCase();
  if (bucket === 'accessories') return [];
  if (bucket === 'footwear') return ['7', '8', '9', '10', '11'];
  if (bucket === 'bottoms') {
    if (subCategory === 'jeans') return ['28', '30', '32', '34', '36', '38'];
    if (subCategory === 'trousers' || subCategory === 'shorts') return ['S', 'M', 'L'];
    return ['S', 'M', 'L'];
  }
  if (bucket === 'tops') return ['S', 'M', 'L', 'XL'];
  return ['S', 'M', 'L', 'XL'];
};
const CARDINAL = '#ba1f3d';

const UPSELL_PRODUCTS = [
  { id: 'u1', name: 'Premium Leather Belt', price: 2499, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=200&auto=format&fit=crop' },
  { id: 'u2', name: 'Cotton Dress Socks', price: 850, image: 'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?q=80&w=200&auto=format&fit=crop' },
  { id: 'u3', name: 'Signature Cap', price: 3450, image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=200&auto=format&fit=crop' },
];

const UniversalDrawer = () => {
  const { isDrawerOpen, drawerMode, selectedProduct, closeDrawer, cartItems, removeFromCart, updateQuantity, total, addToCart, setCartItemOptions, setActiveBucket, setActiveSub } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { addViewed } = useRecentlyViewed();

  const [activeColor, setActiveColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [sizeError, setSizeError] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (drawerMode === 'product' && selectedProduct) {
      setActiveColor(selectedProduct.colors?.[0] || null);
      setGalleryIndex(0);
      const sizes = (selectedProduct.sizes && selectedProduct.sizes.length > 0)
        ? selectedProduct.sizes
        : getPresetSizes(selectedProduct);
      const firstAvailable = sizes.find(s => {
        const bySize = selectedProduct.sizeStock?.[s];
        return bySize === undefined || (parseInt(bySize) || 0) > 0;
      });
      setSelectedSize(firstAvailable || sizes[0] || null);
      setSizeError(false);
      addViewed(selectedProduct);
    }
  }, [drawerMode, selectedProduct]);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeDrawer();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  const currentImage = (activeColor && selectedProduct?.variantImages?.[activeColor])
    ? selectedProduct.variantImages[activeColor]
    : ((selectedProduct?.gallery?.length > 0)
      ? selectedProduct.gallery[galleryIndex % selectedProduct.gallery.length]
      : selectedProduct?.image);

  const buildLightboxImages = () => {
    if (!selectedProduct) return [];
    const imgs = [];

    if (selectedProduct.gallery && Array.isArray(selectedProduct.gallery)) {
      selectedProduct.gallery.forEach((src, index) => {
        if (!src) return;
        if (!imgs.find(i => i.src === src)) {
          imgs.push({ src, alt: `${selectedProduct.name} gallery ${index + 1}`, label: `Gallery ${index + 1}` });
        }
      });
    }

    if (selectedProduct.variantImages) {
      Object.entries(selectedProduct.variantImages).forEach(([color, src]) => {
        if (src && !imgs.find(i => i.src === src)) {
          imgs.push({ src, alt: selectedProduct.name, label: color });
        }
      });
    } else if (selectedProduct.image) {
      if (!imgs.find(i => i.src === selectedProduct.image)) {
        imgs.push({ src: selectedProduct.image, alt: selectedProduct.name, label: 'Main' });
      }
    }
    if (selectedProduct.lifestyleImage && !imgs.find(i => i.src === selectedProduct.lifestyleImage)) {
      imgs.push({ src: selectedProduct.lifestyleImage, alt: `${selectedProduct.name} lifestyle`, label: 'Lifestyle' });
    }
    return imgs;
  };

  const freeShippingThreshold = 5000;
  const remaining = Math.max(0, freeShippingThreshold - total);
  const shippingProgress = Math.min(100, (total / freeShippingThreshold) * 100);
  const sizeChartCategory = selectedProduct?.bucket === 'Bottoms'
    ? 'Bottoms'
    : selectedProduct?.bucket === 'Footwear'
      ? 'Footwear'
      : 'Tops';

  /* ── CART ─────────────────────────────────────────────────── */
  const renderCartView = () => (
    <div className="h-full flex flex-col bg-white shadow-2xl">
      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#ba1f3d] text-white">
        <div className="flex items-center space-x-3">
          <ShoppingBag size={24} />
          <h2 className="text-xl font-black uppercase tracking-tighter">Your Bag</h2>
          {cartItems.length > 0 && (
            <span className="bg-white text-[#ba1f3d] text-[10px] font-black px-2 py-0.5 rounded-none">
              {cartItems.reduce((s, i) => s + (i.quantity || 1), 0)}
            </span>
          )}
        </div>
        <button onClick={closeDrawer} className="p-2 hover:bg-black/20 rounded-none transition-all hover:rotate-90 transform">
          <X size={24} />
        </button>
      </div>

      {cartItems.length > 0 && (
        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
            {remaining > 0 ? <>Add <span className="text-[#ba1f3d]">PKR {remaining.toLocaleString()}</span> more for FREE shipping 🚚</> : '🎉 FREE shipping unlocked!'}
          </p>
          <div className="h-1 bg-gray-200 rounded-none overflow-hidden">
            <div className="h-full bg-[#ba1f3d] transition-all duration-700 ease-out-expo" style={{ width: `${shippingProgress}%` }} />
          </div>
        </div>
      )}

      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-8 animate-fade-up">
            <ShoppingBag size={80} strokeWidth={0.5} className="text-gray-100" />
            <div className="text-center">
              <p className="font-black uppercase tracking-[0.3em] text-sm text-gray-900">Your bag is empty.</p>
              <p className="text-[10px] font-black tracking-widest text-gray-400 mt-2 uppercase">Collect your first Cardinal piece.</p>
            </div>
            <button onClick={() => { setActiveBucket('All'); setActiveSub(null); closeDrawer(); }} className="px-10 py-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#ba1f3d] transition-all">
              Shop All
            </button>
          </div>
        ) : (
          <>
            {cartItems.map(item => (
              <div key={`${item.id}-${item.activeColor || 'none'}-${item.selectedSize || 'none'}`} className="flex items-center space-x-5 group animate-fade-up">
                <div className="w-24 h-28 bg-gray-50 flex-shrink-0 overflow-hidden rounded-none border border-gray-100">
                  <MediaRenderer src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs font-black uppercase tracking-tight text-gray-900 leading-tight truncate pr-2">{item.name}</h3>
                    <p className="text-[#ba1f3d] font-black text-xs flex-shrink-0">PKR {(item.price * (item.quantity || 1)).toLocaleString()}</p>
                  </div>
                  {item.selectedSize && <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Size: {item.selectedSize}</p>}

                  {((item.availableSizes?.length || 0) > 0 || (item.colors?.length || 0) > 0) && (
                    <div className="mt-3 text-[9px] font-black uppercase tracking-wide text-gray-500">
                      <div className="flex flex-wrap gap-2 items-center mb-2">
                        {item.availableSizes?.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span>Size</span>
                            {item.availableSizes.map((size) => (
                              <button
                                key={size}
                                onClick={() => setCartItemOptions(item.cartId, item.activeColor, size)}
                                className={`px-2 py-1 border text-xs ${item.selectedSize === size ? 'bg-black text-white' : 'bg-white text-gray-700'} rounded-sm`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {item.colors?.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>Color</span>
                          {item.colors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setCartItemOptions(item.cartId, color, item.selectedSize)}
                              className={`w-5 h-5 rounded-full border ${item.activeColor === color ? 'ring-2 ring-[#ba1f3d] scale-110' : 'border-gray-200'}`}
                              style={color.includes('|') ? { background: `linear-gradient(to right, ${color.split('|')[0]} 50%, ${color.split('|')[1]} 50%)` } : { backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center mt-3 space-x-4">
                    <div className="flex items-center border border-gray-100 bg-white">
                      <button onClick={() => updateQuantity(item.id, item.activeColor, item.selectedSize, -1, item.cartId)} className="px-2 py-1.5 hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors"><Minus size={10} /></button>
                      <span className="text-[10px] font-black text-gray-900 px-3">{item.quantity || 1}</span>
                      <button onClick={() => updateQuantity(item.id, item.activeColor, item.selectedSize, 1, item.cartId)} className="px-2 py-1.5 hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors"><Plus size={10} /></button>
                    </div>
                    {item.activeColor && <div className="w-3 h-3 rounded-none border border-gray-100" style={{ backgroundColor: item.activeColor }} />}
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id, item.activeColor, item.selectedSize, item.cartId)} className="p-2 text-gray-200 hover:text-[#ba1f3d] transition-all flex-shrink-0"><Trash2 size={16} /></button>
              </div>
            ))}

            <div className="pt-8 border-t border-gray-100">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 mb-6">You might also like</p>
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                {UPSELL_PRODUCTS.map(up => (
                  <div key={up.id} className="flex-shrink-0 w-32 group">
                    <div className="w-full aspect-[4/5] bg-gray-50 rounded-none overflow-hidden mb-3">
                      <MediaRenderer src={up.image} alt={up.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-tight text-gray-900 truncate">{up.name}</p>
                    <p className="text-[9px] text-[#ba1f3d] font-black mt-1">PKR {up.price.toLocaleString()}</p>
                    <button onClick={() => addToCart({ ...up, quantity: 1, cartId: Date.now() })} className="mt-2 w-full text-[8px] font-black uppercase tracking-[0.2em] border border-gray-100 hover:bg-black hover:text-white py-2 transition-all">+ Add To Bag</button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="p-8 border-t border-gray-100 bg-white">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Total Obligation</span>
            <span className="text-2xl font-black text-gray-900 tracking-tighter">PKR {total.toLocaleString()}</span>
          </div>
          <Link to="/checkout" onClick={closeDrawer} className="flex items-center justify-center space-x-4 w-full bg-black text-white py-5 font-black uppercase tracking-[0.3em] hover:bg-[#ba1f3d] transition-all shadow-2xl active:scale-[0.98] text-[11px] mb-4">
            <span>Secure Checkout</span><ArrowRight size={18} />
          </Link>
          <button onClick={closeDrawer} className="w-full text-gray-400 py-1 text-[9px] font-black uppercase tracking-[0.4em] hover:text-gray-900 transition-colors">Return to Shop</button>
        </div>
      )}
    </div>
  );

  /* ── PRODUCT ──────────────────────────────────────────────── */
  const renderProductView = () => {
    if (!selectedProduct) return null;
    const wishlisted = isWishlisted(selectedProduct.id);
    const lightboxImages = buildLightboxImages();
    const availableSizes = getPresetSizes(selectedProduct);
    const requiresSize = availableSizes.length > 0;
    const stockForSize = (size) => {
      const bySize = selectedProduct.sizeStock?.[size];
      if (bySize === undefined) return selectedProduct.stock ?? 0;
      return Math.max(0, parseInt(bySize) || 0);
    };

    return (
      <div className="h-full flex flex-col bg-white shadow-2xl overflow-y-auto relative scrollbar-hide">
        {/* Action buttons */}
        <div className="absolute top-6 right-6 flex flex-col space-y-3 z-10">
          <button onClick={closeDrawer} className="p-3 bg-white shadow-xl hover:bg-[#ba1f3d] hover:text-white transition-all transform text-gray-900"><X size={20} /></button>
          <button onClick={() => toggleWishlist(selectedProduct)} className={`p-3 bg-white shadow-xl transition-all ${wishlisted ? 'text-[#ba1f3d]' : 'text-gray-300 hover:text-[#ba1f3d]'}`}><Heart size={20} className={wishlisted ? 'fill-[#ba1f3d]' : ''} /></button>
          <button onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }} className="p-3 bg-white shadow-xl transition-all text-gray-300 hover:text-gray-900" title="Full screen"><Maximize2 size={20} /></button>
        </div>

        {/* Main Image */}
        <div className="w-full aspect-[4/5] bg-gray-50 relative overflow-hidden cursor-zoom-in flex-shrink-0" onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}>
          <MediaRenderer
            src={selectedProduct.mediaType === 'embed' ? null : currentImage}
            embedCode={selectedProduct.mediaType === 'embed' ? selectedProduct.embedCode : undefined}
            mediaType={selectedProduct.mediaType}
            alt={selectedProduct.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out"
          />
          {selectedProduct.stock > 0 && selectedProduct.stock <= 5 && (
            <div className="absolute top-6 left-6"><span className="bg-[#ba1f3d] text-white text-[9px] font-black px-4 py-2 uppercase tracking-[0.3em] shadow-2xl">Final Stock: {selectedProduct.stock}</span></div>
          )}

        {selectedProduct.gallery?.length > 1 && (
          <div className="absolute inset-x-0 top-3 flex justify-between px-3 pointer-events-auto">
            <button onClick={() => setGalleryIndex((prev) => (prev - 1 + selectedProduct.gallery.length) % selectedProduct.gallery.length)}
              className="bg-white/90 text-gray-800 p-2 rounded-full shadow hover:bg-white transition-all">‹</button>
            <button onClick={() => setGalleryIndex((prev) => (prev + 1) % selectedProduct.gallery.length)}
              className="bg-white/90 text-gray-800 p-2 rounded-full shadow hover:bg-white transition-all">›</button>
          </div>
        )}

          <div className="absolute bottom-6 left-6 pointer-events-none transition-all group-hover:translate-x-2"><span className="bg-white text-gray-900 text-[10px] font-black px-5 py-2 shadow-2xl uppercase tracking-[0.4em]">Cardinal Choice</span></div>
        </div>

        {/* Thumbnail strip */}
        {lightboxImages.length > 1 && (
          <div className="flex space-x-3 px-8 py-5 border-b border-gray-50 overflow-x-auto flex-shrink-0 scrollbar-hide bg-gray-50/30">
            {lightboxImages.map((img, idx) => (
              <button key={idx} onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }} className={`flex-shrink-0 w-16 h-20 overflow-hidden border transition-all ${img.src === currentImage ? 'border-[#ba1f3d] shadow-lg' : 'border-transparent grayscale hover:grayscale-0'}`}>
                <MediaRenderer src={img.src} alt={img.alt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-8 md:p-12 flex flex-col flex-grow">
          {/* Title / Price */}
          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-[0.9]">{selectedProduct.name}</h2>
            <p className="text-2xl text-[#ba1f3d] font-black tracking-tighter">PKR {selectedProduct.price.toLocaleString()}</p>
            <div className="flex items-center space-x-2 mt-4">
              {[...Array(5)].map((_, i) => (<Star key={i} size={11} className={i < selectedProduct.rating ? 'fill-[#ba1f3d] text-[#ba1f3d]' : 'text-gray-200'} />))}
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-3">Verified Experience ({selectedProduct.rating}.0)</span>
            </div>
          </div>

          {requiresSize && (
            <div className="mb-10 pt-8 border-t border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Select Dimension</h3>
                <button onClick={() => setSizeChartOpen(true)} className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-[0.3em] text-[#ba1f3d] hover:text-gray-900 transition-colors">
                  <Ruler size={14} /><span>Sizing Protocol</span>
                </button>
              </div>
              {sizeError && <p className="text-[10px] font-black text-[#ba1f3d] uppercase tracking-[0.2em] mb-4 animate-reveal-up">Select a size to proceed</p>}
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(size => {
                  const outOfStock = stockForSize(size) <= 0;
                  return (
                    <button
                      key={size}
                      onClick={() => { if (!outOfStock) { setSelectedSize(size); setSizeError(false); } }}
                      disabled={outOfStock}
                      className={`size-btn-premium relative overflow-hidden ${selectedSize === size ? 'active' : ''} ${outOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span>{size}</span>
                      {outOfStock && <span className="absolute inset-0"><span className="absolute left-[-20%] top-1/2 w-[140%] h-[2px] bg-[#ba1f3d] rotate-[-35deg]" /></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Colors */}
          {selectedProduct.colors?.length > 0 && (
            <div className="mb-10 pt-8 border-t border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-5">Palettes</h3>
              <div className="flex items-center space-x-4">
                {selectedProduct.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setActiveColor(color)}
                    className={`w-10 h-10 border transition-all ${activeColor === color ? 'border-gray-900 scale-110 shadow-xl' : 'border-transparent'}`}
                    style={
                      color.includes('|')
                        ? { background: `linear-gradient(to right, ${color.split('|')[0]} 50%, ${color.split('|')[1]} 50%)` }
                        : { backgroundColor: color }
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Specs */}
          {selectedProduct.specs?.length > 0 && (
            <div className="mb-10 pt-8 border-t border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-5">Technical details</h3>
              <ul className="text-[10px] uppercase tracking-widest text-gray-500 space-y-3 font-black">
                {selectedProduct.specs.map((spec, i) => (<li key={i} className="flex items-center space-x-3"><span className="text-[#ba1f3d]">•</span><span>{spec}</span></li>))}
              </ul>
            </div>
          )}

          <div className="flex-grow" />

          {/* CTAs */}
          <div className="mt-8 pt-10 border-t border-gray-100 space-y-4">
            {selectedProduct.stock > 0 ? (
              <button onClick={() => {
                if (requiresSize) {
                  if (!selectedSize) { setSizeError(true); return; }
                  const inCartForSize = cartItems
                    .filter(item => item.id === selectedProduct.id && item.selectedSize === selectedSize)
                    .reduce((sum, item) => sum + (item.quantity || 1), 0);
                  const available = stockForSize(selectedSize);
                  if (available <= 0 || inCartForSize >= available) {
                    setSizeError(true);
                    return;
                  }
                }
                addToCart({ ...selectedProduct, image: currentImage, activeColor, selectedSize });
              }} className="w-full bg-[#ba1f3d] text-white font-black py-6 shadow-2xl hover:bg-black active:scale-[0.98] text-[11px] uppercase tracking-[0.4em] transition-all flex justify-center items-center group">
                <span className="group-hover:mr-4 transition-all">Add To Bag</span>
                <span className="opacity-0 group-hover:opacity-100 transition-all font-black text-white text-lg leading-none">+</span>
              </button>
            ) : (
              <button disabled className="w-full bg-gray-50 text-gray-300 font-black py-6 text-[10px] uppercase tracking-[0.4em] cursor-not-allowed border border-gray-100">Archived / Sold Out</button>
            )}
            <button onClick={() => toggleWishlist(selectedProduct)} className={`w-full flex items-center justify-center space-x-3 py-5 border border-gray-100 font-black uppercase text-[10px] tracking-[0.3em] transition-all ${wishlisted ? 'bg-gray-50 text-[#ba1f3d]' : 'text-gray-400 hover:border-gray-900 hover:text-gray-900'}`}>
              <Heart size={16} className={wishlisted ? 'fill-[#ba1f3d]' : ''} />
              <span>{wishlisted ? 'In Collection ✓' : 'Save To Favorites'}</span>
            </button>
            <p className="text-center text-[8px] text-gray-300 uppercase tracking-[0.5em] mt-6 italic">Secure Delivery · Global Craft · Cardinal Tier</p>
          </div>
        </div>

        {/* Modals */}
        <SizeChartModal isOpen={sizeChartOpen} onClose={() => setSizeChartOpen(false)} defaultCategory={sizeChartCategory} />
        <ProductLightbox images={lightboxImages} startIndex={lightboxIndex} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-700 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={closeDrawer} />
      <div className={`absolute inset-y-0 right-0 max-w-full flex transform transition-transform duration-700 ease-out-expo ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="w-screen max-w-md md:max-w-[480px]">
          {drawerMode === 'product' ? renderProductView() : renderCartView()}
        </div>
      </div>
    </div>
  );
};

export default UniversalDrawer;
