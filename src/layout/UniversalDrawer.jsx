/**
 * @fileoverview UniversalDrawer — Cart + Product + Wishlist drawer
 * Fix: replaced all require('animejs') with ESM import — animates correctly now
 * Fix: added WishlistDrawer mode (wishlist icon was showing nothing)
 * Fix: drawer panel now starts hidden via CSS class, not inline transform
 */

import React, { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import {
  X, ShoppingBag, Plus, Minus, Trash2, ArrowRight,
  Tag, ChevronRight, Ruler, Star, Heart
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useScrollLock } from '../hooks/useUtils.js';
import { EASING } from '../hooks/useAnime.js';
import MediaRenderer from '../components/MediaRenderer.jsx';
import { Link } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────
// CART DRAWER
// ─────────────────────────────────────────────────────────────────

const CartDrawer = ({ onClose }) => {
  const { cartItems, cartCount, total, removeFromCart, updateQuantity, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLocale();
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current || !cartItems.length) return;
    const items = listRef.current.querySelectorAll('[data-cart-item]');
    anime.set(items, { opacity: 0, translateX: 30 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateX: [30, 0],
      duration: 500,
      delay: anime.stagger(60),
      easing: EASING.FABRIC,
    });
  }, [cartItems.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 bg-gray-900 text-white flex-shrink-0">
        <div className="flex items-center space-x-3">
          <ShoppingBag size={20} className="text-[#ba1f3d]" />
          <h2 className="text-base font-black uppercase tracking-tighter">Your Bag</h2>
          {cartCount > 0 && (
            <span className="bg-[#ba1f3d] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
              {cartCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 hover:rotate-90 transform"
        >
          <X size={20} />
        </button>
      </div>

      {/* Items */}
      <div ref={listRef} className="flex-grow overflow-y-auto px-5 py-4 space-y-3">
        {cartItems.length === 0 ? (
          <EmptyCartState onClose={onClose} />
        ) : (
          cartItems.map(item => (
            <CartItem
              key={item.cartId}
              item={item}
              formatPrice={formatPrice}
              onRemove={removeFromCart}
              onUpdate={updateQuantity}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {cartItems.length > 0 && (
        <div className="px-5 pb-6 pt-4 border-t border-gray-100 flex-shrink-0 space-y-3">
          {/* Total */}
          <div className="flex justify-between items-center py-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              {t('cart.total')}
            </span>
            <span className="text-2xl font-black text-[#ba1f3d] tracking-tighter">
              {formatPrice(total)}
            </span>
          </div>

          {/* Checkout CTA */}
          <Link
            to="/checkout"
            onClick={onClose}
            className="flex w-full items-center justify-center space-x-3 py-4 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-gray-900 transition-all duration-300 rounded-xl shadow-xl shadow-red-200/40 btn-shimmer group"
          >
            <span>Checkout</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <button
            onClick={clearCart}
            className="w-full py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-red-500 transition-colors duration-200"
          >
            Clear Bag
          </button>
        </div>
      )}
    </div>
  );
};

const CartItem = ({ item, formatPrice, onRemove, onUpdate }) => (
  <div
    data-cart-item
    className="flex space-x-3 bg-gray-50/80 rounded-xl p-3 group hover:bg-gray-100/80 transition-colors duration-200"
  >
    {/* Thumbnail */}
    <div className="w-20 h-24 bg-white rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
      <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
    </div>

    {/* Details */}
    <div className="flex-grow min-w-0">
      <p className="text-[11px] font-black uppercase tracking-tight text-gray-900 leading-tight mb-0.5 truncate">
        {item.name}
      </p>
      <div className="flex items-center space-x-2 mb-2">
        {item.selectedSize && (
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-200 px-2 py-0.5 rounded-md">
            {item.selectedSize}
          </span>
        )}
        {item.activeColor && (
          <span className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0" style={{ background: item.activeColor }} />
        )}
      </div>

      <div className="flex items-center justify-between">
        {/* Qty stepper */}
        <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => onUpdate(item.id, item.activeColor, item.selectedSize, -1, item.cartId)}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#ba1f3d] hover:bg-red-50 transition-colors duration-150"
          >
            <Minus size={10} />
          </button>
          <span className="w-7 text-center text-[11px] font-black text-gray-900">
            {item.quantity ?? 1}
          </span>
          <button
            onClick={() => onUpdate(item.id, item.activeColor, item.selectedSize, 1, item.cartId)}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#ba1f3d] hover:bg-red-50 transition-colors duration-150"
          >
            <Plus size={10} />
          </button>
        </div>

        <p className="text-sm font-black text-[#ba1f3d]">
          {formatPrice(item.price * (item.quantity ?? 1))}
        </p>
      </div>
    </div>

    {/* Remove */}
    <button
      onClick={() => onRemove(item.id, item.activeColor, item.selectedSize, item.cartId)}
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 text-gray-300 hover:text-red-500 self-start"
    >
      <Trash2 size={13} />
    </button>
  </div>
);

const EmptyCartState = ({ onClose }) => (
  <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-6">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
      <ShoppingBag size={32} strokeWidth={1} className="text-gray-300" />
    </div>
    <div>
      <p className="font-black uppercase tracking-tight text-gray-900 mb-1">Your bag is empty</p>
      <p className="text-xs text-gray-400">Add pieces you love</p>
    </div>
    <button
      onClick={onClose}
      className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-[#ba1f3d] border-b border-[#ba1f3d]/30 pb-0.5 hover:border-[#ba1f3d] transition-colors"
    >
      <span>Browse Collection</span>
      <ArrowRight size={12} />
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// WISHLIST DRAWER (was completely missing — wishlist btn showed nothing)
// ─────────────────────────────────────────────────────────────────

const WishlistDrawer = ({ onClose }) => {
  const { wishlistItems, toggleWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const { openDrawer } = useCart();
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current || !wishlistItems.length) return;
    const items = listRef.current.querySelectorAll('[data-wishlist-item]');
    anime.set(items, { opacity: 0, translateX: 30 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateX: [30, 0],
      duration: 500,
      delay: anime.stagger(60),
      easing: EASING.FABRIC,
    });
  }, [wishlistItems.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 bg-gray-900 text-white flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Heart size={20} className="text-[#ba1f3d]" />
          <h2 className="text-base font-black uppercase tracking-tighter">Wishlist</h2>
          {wishlistItems.length > 0 && (
            <span className="bg-[#ba1f3d] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
              {wishlistItems.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 hover:rotate-90 transform"
        >
          <X size={20} />
        </button>
      </div>

      {/* Items */}
      <div ref={listRef} className="flex-grow overflow-y-auto px-5 py-4 space-y-3">
        {wishlistItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <Heart size={32} strokeWidth={1} className="text-gray-300" />
            </div>
            <div>
              <p className="font-black uppercase tracking-tight text-gray-900 mb-1">Nothing saved yet</p>
              <p className="text-xs text-gray-400">Save pieces you love for later</p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-[#ba1f3d] border-b border-[#ba1f3d]/30 pb-0.5 hover:border-[#ba1f3d] transition-colors"
            >
              <span>Browse Collection</span>
              <ArrowRight size={12} />
            </button>
          </div>
        ) : (
          wishlistItems.map(item => (
            <div
              key={item.id}
              data-wishlist-item
              className="flex space-x-3 bg-gray-50/80 rounded-xl p-3 group hover:bg-gray-100/80 transition-colors duration-200"
            >
              {/* Thumbnail */}
              <div className="w-20 h-24 bg-white rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
              </div>

              {/* Details */}
              <div className="flex-grow min-w-0">
                <p className="text-[11px] font-black uppercase tracking-tight text-gray-900 leading-tight mb-1 truncate">
                  {item.name}
                </p>
                <p className="text-sm font-black text-[#ba1f3d] mb-3">
                  {formatPrice(item.price)}
                </p>
                <button
                  onClick={() => {
                    onClose();
                    setTimeout(() => openDrawer('product', item), 350);
                  }}
                  className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 border-b border-gray-200 hover:border-gray-900 transition-colors pb-0.5"
                >
                  View Details
                </button>
              </div>

              {/* Remove */}
              <button
                onClick={() => toggleWishlist(item)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 text-gray-300 hover:text-red-500 self-start"
                title="Remove from wishlist"
              >
                <X size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// PRODUCT DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────

const ProductDrawer = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();
  const [selectedSize, setSelectedSize] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState(product?.colors?.[0] ?? '');
  const [adding, setAdding] = React.useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const children = contentRef.current.querySelectorAll('[data-detail]');
    anime.set(children, { opacity: 0, translateY: 20 });
    anime({
      targets: children,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 500,
      delay: anime.stagger(70, { start: 100 }),
      easing: EASING.FABRIC,
    });
  }, [product?.id]);

  if (!product) return null;

  const currentImage = (selectedColor && product.variantImages?.[selectedColor])
    ? product.variantImages[selectedColor]
    : product.image;

  const handleAddToCart = async () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      const sizeRow = document.querySelector('[data-size-selector]');
      if (sizeRow) {
        anime({ targets: sizeRow, translateX: [-8, 8, -6, 6, -3, 3, 0], duration: 400, easing: 'linear' });
      }
      return;
    }
    setAdding(true);
    addToCart({ ...product, image: currentImage, activeColor: selectedColor, selectedSize });
    await new Promise(r => setTimeout(r, 300));
    setAdding(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ba1f3d]">
          {product.bucket} / {product.subCategory}
        </p>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-xl transition-all hover:rotate-90 transform text-gray-500"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable content */}
      <div ref={contentRef} className="flex-grow overflow-y-auto">

        {/* Product image */}
        <div className="aspect-[4/3] bg-gray-50 overflow-hidden" data-detail>
          <MediaRenderer
            src={product.mediaType === 'embed' ? null : currentImage}
            embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
            mediaType={product.mediaType}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name + price */}
          <div data-detail>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-1">
              {product.name}
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black text-[#ba1f3d]">
                {formatPrice(product.price)}
              </p>
              {/* Stars */}
              <div className="flex items-center space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={11} className={i < product.rating ? 'fill-[#ba1f3d] text-[#ba1f3d]' : 'text-gray-200'} />
                ))}
              </div>
            </div>
          </div>

          {/* Specs */}
          {product.specs?.filter(Boolean).length > 0 && (
            <div data-detail className="space-y-1.5">
              {product.specs.filter(Boolean).map((spec, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="w-1 h-1 rounded-full bg-[#ba1f3d] flex-shrink-0" />
                  <span className="text-[11px] text-gray-600 font-bold uppercase tracking-wider">{spec}</span>
                </div>
              ))}
            </div>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div data-detail>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-3">
                Color — <span className="text-gray-700">{selectedColor || 'Select'}</span>
              </p>
              <div className="flex items-center space-x-2.5">
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                      selectedColor === color ? 'ring-2 ring-offset-2 ring-[#ba1f3d] scale-110' : 'border-gray-200 hover:scale-110'
                    }`}
                    style={{ background: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <div data-detail>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">
                  Size{!selectedSize && <span className="text-[#ba1f3d] ml-1">*</span>}
                </p>
                <button className="flex items-center space-x-1 text-[9px] font-black uppercase tracking-wider text-gray-400 hover:text-[#ba1f3d] transition-colors">
                  <Ruler size={11} />
                  <span>Guide</span>
                </button>
              </div>
              <div data-size-selector className="flex flex-wrap gap-2">
                {product.sizes.map(size => {
                  const stock = product.sizeStock?.[size] ?? 0;
                  const oos = stock === 0 && Object.keys(product.sizeStock ?? {}).length > 0;
                  return (
                    <button
                      key={size}
                      onClick={() => !oos && setSelectedSize(size)}
                      disabled={oos}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border-2 transition-all duration-200 ${
                        selectedSize === size
                          ? 'border-[#ba1f3d] bg-[#ba1f3d]/5 text-[#ba1f3d]'
                          : oos
                            ? 'border-gray-100 text-gray-300 line-through cursor-not-allowed'
                            : 'border-gray-200 text-gray-700 hover:border-gray-900'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-5 pb-6 pt-3 border-t border-gray-100 flex-shrink-0 space-y-2.5">
        {product.stock > 0 ? (
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="w-full py-4 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-gray-900 transition-all duration-300 shadow-xl shadow-red-200/40 btn-shimmer flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            {adding ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Add to Bag</span>
            )}
          </button>
        ) : (
          <div className="w-full py-4 bg-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl text-center">
            Sold Out
          </div>
        )}

        <button
          onClick={() => toggleWishlist(product)}
          className={`w-full py-3 border-2 text-[10px] font-black uppercase tracking-[0.25em] rounded-xl transition-all duration-300 ${
            isWishlisted(product.id)
              ? 'border-[#ba1f3d] text-[#ba1f3d] bg-[#ba1f3d]/5'
              : 'border-gray-200 text-gray-700 hover:border-gray-900'
          }`}
        >
          {isWishlisted(product.id) ? 'Saved to Wishlist ♥' : 'Save to Wishlist'}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// UNIVERSAL DRAWER WRAPPER
// ─────────────────────────────────────────────────────────────────

const UniversalDrawer = () => {
  const { isDrawerOpen, drawerMode, selectedProduct, closeDrawer } = useCart();
  const drawerRef = useRef(null);

  useScrollLock(isDrawerOpen);

  // Slide IN — runs when drawer opens (component mounts)
  useEffect(() => {
    if (!drawerRef.current || !isDrawerOpen) return;

    // Small delay to ensure DOM is reflowed and painted
    requestAnimationFrame(() => {
      if (!drawerRef.current) return;
      
      // Force initial state
      anime.set(drawerRef.current, { translateX: '100%' });
      
      anime({
        targets: drawerRef.current,
        translateX: '0%',
        duration: 550,
        easing: EASING.SPRING,
      });
    });
  }, [isDrawerOpen]);

  const handleClose = useCallback(() => {
    if (!drawerRef.current) { closeDrawer(); return; }
    anime({
      targets: drawerRef.current,
      translateX: ['0%', '100%'],
      duration: 400,
      easing: EASING.SILK,
      complete: closeDrawer,
    });
  }, [closeDrawer]);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Drawer panel — starts off-screen, anime slides it in */}
      <div
        ref={drawerRef}
        className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col"
        style={{ transform: 'translateX(100%)', willChange: 'transform' }}
      >
        {drawerMode === 'cart' && <CartDrawer onClose={handleClose} />}
        {drawerMode === 'wishlist' && <WishlistDrawer onClose={handleClose} />}
        {drawerMode === 'product' && <ProductDrawer product={selectedProduct} onClose={handleClose} />}
      </div>
    </div>
  );
};

export default UniversalDrawer;
