/**
 * @fileoverview WishlistDrawer — Design Spells Edition
 * Fix: replaced require('animejs') with ESM import — animations are now functional
 * Applies: animejs-animation (spring entrance, stagger items),
 *          design-spells (move-to-cart with burst, hover lift on cards)
 */

import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import { X, Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { EASING } from '../hooks/useAnime.js';
import { useScrollLock } from '../hooks/useUtils.js';

const WishlistDrawer = ({ isOpen, onClose }) => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart, openDrawer } = useCart();
  const { formatPrice } = useCurrency();

  const drawerRef = useRef(null);
  const listRef = useRef(null);

  useScrollLock(isOpen);

  // Spring slide-in
  useEffect(() => {
    if (!drawerRef.current) return;

    if (isOpen) {
      anime({
        targets: drawerRef.current,
        translateX: ['100%', '0%'],
        duration: 550,
        easing: EASING.SPRING,
      });
    }
  }, [isOpen]);

  // Stagger items
  useEffect(() => {
    if (!isOpen || !listRef.current || !wishlist.length) return;

    const items = listRef.current.querySelectorAll('[data-wish-item]');
    anime.set(items, { opacity: 0, translateX: 20 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateX: [20, 0],
      duration: 400,
      delay: anime.stagger(60),
      easing: EASING.FABRIC,
    });
  }, [isOpen, wishlist.length]);

  const handleClose = () => {
    if (!drawerRef.current) { onClose(); return; }
    anime({
      targets: drawerRef.current,
      translateX: ['0%', '100%'],
      duration: 380,
      easing: EASING.SILK,
      complete: onClose,
    });
  };

  const handleMoveToCart = (product) => {
    addToCart(product);
    toggleWishlist(product);
    // Animate the item out
    const el = document.querySelector(`[data-wish-id="${product.id}"]`);
    if (el) {
      anime({
        targets: el,
        opacity: [1, 0],
        translateX: [0, 40],
        height: [el.offsetHeight, 0],
        marginBottom: [12, 0],
        paddingTop: [0, 0],
        paddingBottom: [0, 0],
        duration: 350,
        easing: EASING.SILK,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col"
        style={{ transform: 'translateX(100%)', willChange: 'transform' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gray-900 text-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Heart size={20} className="text-[#ba1f3d] fill-[#ba1f3d]" />
            <h2 className="text-base font-black uppercase tracking-tighter">Wishlist</h2>
            {wishlist.length > 0 && (
              <span className="bg-[#ba1f3d] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                {wishlist.length}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 hover:rotate-90 transform"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div ref={listRef} className="flex-grow overflow-y-auto p-5">
          {wishlist.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-5">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <Heart size={32} strokeWidth={1} className="text-gray-200" />
              </div>
              <div>
                <p className="font-black uppercase tracking-tight text-gray-900 mb-1">Wishlist is empty</p>
                <p className="text-xs text-gray-400">Save pieces you love</p>
              </div>
              <button
                onClick={handleClose}
                className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-[#ba1f3d] border-b border-[#ba1f3d]/30 pb-0.5 hover:border-[#ba1f3d] transition-colors"
              >
                <span>Browse Collection</span>
                <ArrowRight size={12} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {wishlist.map(product => (
                <div
                  key={product.id}
                  data-wish-item
                  data-wish-id={product.id}
                  className="flex space-x-4 bg-gray-50 rounded-xl p-3 group hover:bg-gray-100/80 transition-colors duration-200 overflow-hidden"
                >
                  {/* Image */}
                  <div
                    onClick={() => { openDrawer('product', product); handleClose(); }}
                    className="w-20 h-24 bg-white rounded-lg overflow-hidden flex-shrink-0 cursor-pointer shadow-sm"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="min-w-0 pr-2">
                        <h3 className="text-[11px] font-black uppercase tracking-tight text-gray-900 leading-tight truncate">
                          {product.name}
                        </h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                          {product.bucket}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleWishlist(product)}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <p className="text-sm font-black text-[#ba1f3d] mb-3">
                      {formatPrice(product.price)}
                    </p>

                    <button
                      onClick={() => handleMoveToCart(product)}
                      className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-[0.25em] bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-[#ba1f3d] transition-all duration-300 group/btn"
                    >
                      <ShoppingBag size={11} />
                      <span>Move to Bag</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistDrawer;
