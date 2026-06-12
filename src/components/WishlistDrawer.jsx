/**
 * WishlistDrawer — Premium Minimalist Edition
 * Full-height right panel, surgical white space, Cardinal Red accents.
 */

import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import { X, Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.tsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { useScrollLock } from '../hooks/useUtils.js';
import { EASING } from '../hooks/useAnime.js';

const WishlistDrawer = ({ isOpen, onClose }) => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart, openDrawer } = useCart();
  const { formatPrice } = useCurrency();

  const drawerRef = useRef(null);
  const itemsRef = useRef(null);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!drawerRef.current) return;
    if (isOpen) {
      anime({
        targets: drawerRef.current,
        translateX: ['100%', '0%'],
        duration: 500,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)',
      });
      // Stagger items in
      if (itemsRef.current) {
        setTimeout(() => {
          const items = itemsRef.current?.querySelectorAll('[data-wish-item]');
          if (items?.length) {
            anime.set(items, { opacity: 0, translateY: 12 });
            anime({
              targets: items,
              opacity: [0, 1],
              translateY: [12, 0],
              duration: 350,
              delay: anime.stagger(55),
              easing: EASING.FABRIC,
            });
          }
        }, 150);
      }
    }
  }, [isOpen, wishlist.length]);

  const handleClose = () => {
    if (!drawerRef.current) { onClose(); return; }
    anime({
      targets: drawerRef.current,
      translateX: ['0%', '100%'],
      duration: 380,
      easing: 'cubicBezier(0.7, 0, 1, 1)',
      complete: onClose,
    });
  };

  const handleMoveToCart = (product) => {
    addToCart(product);
    toggleWishlist(product);
    const el = document.querySelector(`[data-wish-id="${product.id}"]`);
    if (el) {
      anime({
        targets: el,
        opacity: [1, 0],
        translateX: [0, 60],
        height: [el.offsetHeight, 0],
        marginBottom: [0, 0],
        duration: 300,
        easing: 'cubicBezier(0.7, 0, 1, 1)',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"
        style={{ animation: 'fadeIn 0.3s ease forwards' }}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="absolute inset-y-0 right-0 w-full max-w-[420px] bg-white flex flex-col shadow-2xl"
        style={{ transform: 'translateX(100%)', willChange: 'transform' }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <Heart size={16} className="text-cardinal fill-cardinal" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-900">
              Saved Items
            </h2>
            {wishlist.length > 0 && (
              <span className="text-[9px] font-black text-gray-400">
                ({wishlist.length})
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        <div ref={itemsRef} className="flex-grow overflow-y-auto">
          {wishlist.length === 0 ? (
            /* Empty state */
            <div className="h-full flex flex-col items-center justify-center px-8 text-center">
              <div className="w-16 h-16 border border-gray-100 flex items-center justify-center mb-6">
                <Heart size={24} strokeWidth={1} className="text-gray-200" />
              </div>
              <p className="text-sm font-black uppercase tracking-tight text-gray-900 mb-2">
                Nothing saved yet
              </p>
              <p className="text-xs text-gray-400 mb-8 leading-relaxed">
                Heart pieces you love and they'll appear here for easy access.
              </p>
              <button
                onClick={handleClose}
                className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.3em] text-cardinal border-b border-cardinal/40 pb-0.5 hover:border-cardinal transition-colors"
              >
                <span>Explore Collection</span>
                <ArrowRight size={11} />
              </button>
            </div>
          ) : (
            <div className="px-8 py-6 space-y-0">
              {wishlist.map((product, idx) => {
                const hasDiscount = product.discount > 0;
                const discountedPrice = hasDiscount ? product.price * (1 - product.discount / 100) : product.price;
                return (
                  <div
                    key={product.id}
                    data-wish-item
                    data-wish-id={product.id}
                    className={`flex space-x-4 py-6 group ${
                      idx < wishlist.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    {/* Product image */}
                    <div
                      onClick={() => { openDrawer('product', product); handleClose(); }}
                      className="w-[72px] h-[90px] bg-[#F8F7F5] overflow-hidden flex-shrink-0 cursor-pointer relative"
                    >
                      {product.image ? (
                        <>
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          {hasDiscount && (
                            <div className="absolute top-1 left-1 bg-black px-1.5 py-0.5 border border-white/20 z-10">
                              <span className="text-[6px] font-black uppercase tracking-[0.2em] text-white">
                                {product.discount}% OFF
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={16} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-grow min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        {/* Category */}
                        <p className="text-[8px] font-bold uppercase tracking-[0.35em] text-gray-400 mb-1">
                          {product.bucket}
                        </p>
                        {/* Name */}
                        <h3
                          onClick={() => { openDrawer('product', product); handleClose(); }}
                          className="text-[11px] font-black uppercase tracking-tight text-gray-900 leading-snug cursor-pointer hover:text-cardinal transition-colors line-clamp-2 mb-2"
                        >
                          {product.name}
                        </h3>
                        {/* Price */}
                        {hasDiscount ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-cardinal font-mono">
                              {formatPrice(discountedPrice)}
                            </span>
                            <span className="text-[10px] text-gray-400 line-through font-mono">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm font-black text-gray-900">
                            {formatPrice(product.price)}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-3 mt-3">
                        <button
                          onClick={() => handleMoveToCart(product)}
                          className="flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-white bg-black px-3.5 py-2.5 rounded-[4px] hover:bg-cardinal transition-colors duration-300"
                        >
                          <ShoppingBag size={10} />
                          <span>Add to Bag</span>
                        </button>
                        <button
                          onClick={() => toggleWishlist(product)}
                          className="p-2 text-gray-300 hover:text-cardinal transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        {wishlist.length > 0 && (
          <div className="border-t border-gray-100 px-8 py-6">
            <button
              onClick={() => {
                wishlist.forEach(p => addToCart(p));
                handleClose();
              }}
              className="btn-primary w-full flex items-center justify-center space-x-2 rounded-[4px]"
            >
              <ShoppingBag size={13} />
              <span>Add All to Bag</span>
            </button>
            <p className="text-center text-[9px] text-gray-400 font-bold mt-3 uppercase tracking-widest">
              {wishlist.length} piece{wishlist.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
};

export default WishlistDrawer;