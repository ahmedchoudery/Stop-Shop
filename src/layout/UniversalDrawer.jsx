/**
 * UniversalDrawer — Premium Minimalist Edition
 * Handles: cart mode, product quick-view mode, wishlist redirect.
 * Razor-clean layout, surgical typography, Cardinal Red as status signal.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Package, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { useScrollLock } from '../hooks/useUtils.js';
import CouponInput from '../components/CouponInput.jsx';
import WishlistDrawer from '../components/WishlistDrawer.jsx';

// ── Cart Item ────────────────────────────────────────────────────
const CartItem = ({ item, onRemove, onQtyChange }) => {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  return (
    <div className="flex space-x-4 py-5 border-b border-gray-50 group">
      {/* Image */}
      <div
        className="w-[68px] h-[84px] bg-[#F8F7F5] overflow-hidden flex-shrink-0 cursor-pointer"
        onClick={() => navigate(`/product/${item.id}`)}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={16} className="text-gray-200" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0 flex flex-col justify-between py-0.5">
        <div>
          {/* Category */}
          {item.bucket && (
            <p className="text-[8px] font-bold uppercase tracking-[0.35em] text-gray-400 mb-1">
              {item.bucket}
            </p>
          )}
          {/* Name */}
          <h3
            className="text-[11px] font-black uppercase tracking-tight text-gray-900 leading-snug line-clamp-2 mb-1 cursor-pointer hover:text-[#ba1f3d] transition-colors"
            onClick={() => navigate(`/product/${item.id}`)}
          >
            {item.name}
          </h3>
          {/* Variants */}
          {(item.selectedSize || item.selectedColor) && (
            <p className="text-[9px] text-gray-400 font-bold">
              {[item.selectedSize, item.selectedColor].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Price + Controls */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-black text-gray-900">
            {formatPrice(item.price * (item.quantity ?? 1))}
          </span>

          <div className="flex items-center space-x-1">
            {/* Qty */}
            <div className="flex items-center border border-gray-200">
              <button
                onClick={() => onQtyChange(item, -1)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <Minus size={10} />
              </button>
              <span className="w-7 text-center text-[11px] font-black text-gray-900">
                {item.quantity ?? 1}
              </span>
              <button
                onClick={() => onQtyChange(item, 1)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <Plus size={10} />
              </button>
            </div>

            {/* Remove */}
            <button
              onClick={() => onRemove(item)}
              className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-[#ba1f3d] transition-colors ml-1"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Universal Drawer ─────────────────────────────────────────────
const UniversalDrawer = () => {
  const {
    cartItems, total, isDrawerOpen, drawerMode, selectedProduct,
    closeDrawer, removeFromCart, updateQuantity, clearCart
  } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const drawerRef = useRef(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  useScrollLock(isDrawerOpen || wishlistOpen);

  const isCartMode = drawerMode === 'cart';
  const isWishlistMode = drawerMode === 'wishlist';

  // Open wishlist drawer
  useEffect(() => {
    if (isDrawerOpen && isWishlistMode) {
      closeDrawer();
      setWishlistOpen(true);
    }
  }, [isDrawerOpen, isWishlistMode, closeDrawer]);

  // Slide in animation
  useEffect(() => {
    if (!drawerRef.current || !isDrawerOpen || isWishlistMode) return;
    drawerRef.current.style.transform = 'translateX(100%)';
    requestAnimationFrame(() => {
      if (drawerRef.current) {
        drawerRef.current.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
        drawerRef.current.style.transform = 'translateX(0%)';
      }
    });
  }, [isDrawerOpen, isWishlistMode]);

  const handleClose = useCallback(() => {
    if (!drawerRef.current) { closeDrawer(); return; }
    drawerRef.current.style.transition = 'transform 0.35s cubic-bezier(0.7, 0, 1, 1)';
    drawerRef.current.style.transform = 'translateX(100%)';
    setTimeout(closeDrawer, 340);
  }, [closeDrawer]);

  const handleRemove = useCallback((item) => {
    removeFromCart(item.id, item.selectedColor, item.selectedSize, item.cartId);
  }, [removeFromCart]);

  const handleQtyChange = useCallback((item, delta) => {
    updateQuantity(item.id, item.selectedColor, item.selectedSize, delta, item.cartId);
  }, [updateQuantity]);

  const discount = appliedCoupon
    ? appliedCoupon.type === 'percentage'
      ? Math.round((total * appliedCoupon.value) / 100)
      : Math.min(appliedCoupon.value, total)
    : 0;

  const finalTotal = Math.max(0, total - discount);

  if (!isDrawerOpen && !wishlistOpen) return null;

  return (
    <>
      {/* Wishlist drawer */}
      <WishlistDrawer isOpen={wishlistOpen} onClose={() => setWishlistOpen(false)} />

      {/* Cart / Product drawer */}
      {isDrawerOpen && !isWishlistMode && (
        <div className="fixed inset-0 z-[150]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            style={{ animation: 'fadeIn 0.3s ease forwards' }}
            onClick={handleClose}
          />

          {/* Drawer panel */}
          <div
            ref={drawerRef}
            className="absolute inset-y-0 right-0 w-full max-w-[420px] bg-white flex flex-col shadow-2xl"
            style={{ transform: 'translateX(100%)', willChange: 'transform' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <ShoppingBag size={16} className="text-gray-900" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-900">
                  {isCartMode ? 'Your Bag' : 'Quick View'}
                </h2>
                {isCartMode && cartItems.length > 0 && (
                  <span className="text-[9px] font-black text-gray-400">
                    ({cartItems.reduce((s, i) => s + (i.quantity ?? 1), 0)})
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {isCartMode && cartItems.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[8px] font-black uppercase tracking-widest text-gray-300 hover:text-[#ba1f3d] transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-grow overflow-y-auto px-8">
              {isCartMode ? (
                cartItems.length === 0 ? (
                  /* Empty cart */
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 border border-gray-100 flex items-center justify-center mb-6">
                      <ShoppingBag size={24} strokeWidth={1} className="text-gray-200" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-tight text-gray-900 mb-2">
                      Your bag is empty
                    </p>
                    <p className="text-xs text-gray-400 mb-8 leading-relaxed">
                      Add pieces you love to get started.
                    </p>
                    <button
                      onClick={handleClose}
                      className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#ba1f3d] border-b border-[#ba1f3d]/40 pb-0.5 hover:border-[#ba1f3d] transition-colors"
                    >
                      <span>Shop Collection</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                ) : (
                  /* Cart items */
                  <div>
                    {cartItems.map(item => (
                      <CartItem
                        key={item.cartId ?? `${item.id}-${item.selectedSize}-${item.selectedColor}`}
                        item={item}
                        onRemove={handleRemove}
                        onQtyChange={handleQtyChange}
                      />
                    ))}

                    {/* Coupon */}
                    <div className="py-6 border-b border-gray-50">
                      <div className="flex items-center space-x-2 mb-3">
                        <Tag size={11} className="text-gray-400" />
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                          Promo Code
                        </p>
                      </div>
                      <CouponInput
                        cartTotal={total}
                        appliedCoupon={appliedCoupon}
                        onApply={setAppliedCoupon}
                        onRemove={() => setAppliedCoupon(null)}
                      />
                    </div>

                    {/* Order summary */}
                    <div className="py-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Subtotal</span>
                        <span className="text-[11px] font-black text-gray-900">{formatPrice(total)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-[#ba1f3d] uppercase tracking-widest">
                            Discount ({appliedCoupon.code})
                          </span>
                          <span className="text-[11px] font-black text-[#ba1f3d]">−{formatPrice(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Shipping</span>
                        <span className="text-[11px] font-bold text-gray-500">Calculated at checkout</span>
                      </div>
                    </div>
                  </div>
                )
              ) : selectedProduct ? (
                /* Quick View mode */
                <div className="py-6">
                  <div className="aspect-[3/4] bg-[#F8F7F5] mb-6 overflow-hidden">
                    {selectedProduct.image && (
                      <img
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.35em] mb-2">
                    {selectedProduct.bucket}
                  </p>
                  <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-3">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-xl font-black text-gray-900 mb-6">
                    {formatPrice(selectedProduct.price)}
                  </p>
                  <Link
                    to={`/product/${selectedProduct.id}`}
                    onClick={handleClose}
                    className="block w-full text-center bg-gray-900 text-white py-4 text-[10px] font-black uppercase tracking-[0.35em] hover:bg-[#ba1f3d] transition-colors duration-300 mb-3"
                  >
                    View Full Details
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Footer — Checkout CTA */}
            {isCartMode && cartItems.length > 0 && (
              <div className="border-t border-gray-100 px-8 py-6 flex-shrink-0">
                {/* Total */}
                <div className="flex justify-between items-baseline mb-5">
                  <span className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-500">Total</span>
                  <span className="text-xl font-black text-gray-900">{formatPrice(finalTotal)}</span>
                </div>

                {/* Checkout button */}
                <Link
                  to="/checkout"
                  onClick={handleClose}
                  className="block w-full text-center bg-[#ba1f3d] text-white py-4 text-[10px] font-black uppercase tracking-[0.35em] hover:bg-gray-900 transition-colors duration-300 mb-3"
                >
                  Proceed to Checkout
                </Link>

                {/* Continue shopping */}
                <button
                  onClick={handleClose}
                  className="w-full text-center text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors py-1"
                >
                  Continue Shopping
                </button>

                {/* Trust note */}
                <p className="text-center text-[8px] text-gray-300 font-bold uppercase tracking-wider mt-4">
                  🔒 Secure checkout · SSL encrypted
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  );
};

export default UniversalDrawer;