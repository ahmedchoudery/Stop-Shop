"use client";

/**
 * @fileoverview MobileDrawer.jsx — Ultra-Luxury Editorial Edition
 * Focuses exclusively on Collections navigation and Customer Login button.
 */

import React, { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from '../utils/router-compat.jsx';
import { useCart } from '../context/CartContext.tsx';
import { useCustomer } from '../context/CustomerContext.jsx';
import { CATEGORIES, CATEGORY_MAP } from '../utils/categories.js';

const MobileDrawer = ({ isOpen, onClose }) => {
  const { setActiveBucket } = useCart();
  const { customer, isLoggedIn, logout } = useCustomer();
  const navigate = useNavigate();
  const [activeCategoryView, setActiveCategoryView] = useState(null);

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const frame = requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      document.body.style.overflow = 'hidden';
      return () => {
        cancelAnimationFrame(frame);
      };
    } else {
      setIsAnimating(false);
      document.body.style.overflow = '';
      const timer = setTimeout(() => {
        setShouldRender(false);
        setActiveCategoryView(null);
      }, 500);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleCategorySelect = (category) => {
    setActiveCategoryView(category);
  };

  const handleSubCategoryClick = (category, subCategory = null) => {
    setActiveBucket(category, subCategory);
    navigate('/');
    onClose();
    setTimeout(() => {
      const grid = document.getElementById('product-grid');
      if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-[150] transition-opacity duration-300 ${
          isAnimating ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel — premium iOS slide-up bottom sheet on mobile, side panel on tablet/desktop */}
      <div
        className={`fixed z-[151] bg-[#F7F6F3] shadow-2xl transition-transform duration-500 ease-out flex flex-col pointer-events-auto
          bottom-0 left-0 w-full h-[80vh] border-t border-gray-200 rounded-t-[30px] pb-safe
          sm:top-0 sm:left-0 sm:h-full sm:w-[380px] sm:border-r sm:border-t-0 sm:rounded-none sm:pb-0
          ${isAnimating ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:-translate-x-full sm:translate-y-0'}`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform'
        }}
      >
        {/* iOS bottom-sheet drag handle — visible on mobile only */}
        <div className="sm:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto my-3.5 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/60 flex-shrink-0">
          {activeCategoryView ? (
            <button
              onClick={() => setActiveCategoryView(null)}
              className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors font-black uppercase tracking-tight active-scale min-h-[44px] px-2"
            >
              <ChevronLeft size={18} />
              <span className="text-sm">Back</span>
            </button>
          ) : (
            <Link to="/" onClick={onClose} className="flex items-center space-x-2.5 min-h-[44px] px-2">
              <span className="text-lg font-black italic uppercase tracking-tighter text-[#85110e]">
                Stop<span className="not-italic text-black/80">&</span>Shop
              </span>
            </Link>
          )}
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center hover:bg-black/5 rounded-full transition-all active-scale"
            aria-label="Close menu"
          >
            <X size={20} className="text-gray-500 hover:text-black" />
          </button>
        </div>

        {/* Scroll area */}
        <div className="flex-grow overflow-y-auto overflow-x-hidden relative -webkit-overflow-scrolling-touch">

          {/* Main Categories View */}
          <div className={`absolute inset-0 transition-transform duration-300 ${activeCategoryView ? '-translate-x-full' : 'translate-x-0'}`}>
            <div className="px-6 py-6">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4 px-2">
                Collections
              </p>
              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => handleSubCategoryClick('All')}
                    className="w-full flex items-center justify-between min-h-[48px] py-3.5 px-4 text-sm font-black uppercase tracking-wider text-gray-900 hover:bg-gray-200/50 active-scale transition-all duration-200 text-left group rounded-xl border border-transparent hover:border-gray-200"
                  >
                    <span>All Products</span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                  </button>
                </li>

                {CATEGORIES.map((cat, i) => (
                  <li key={cat}>
                    <button
                      onClick={() => handleCategorySelect(cat)}
                      className="w-full flex items-center justify-between min-h-[48px] py-3.5 px-4 text-sm font-black uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 active-scale transition-all duration-200 text-left group rounded-xl border border-transparent hover:border-gray-200"
                      style={{ transitionDelay: `${i * 25}ms` }}
                    >
                      <span>{cat}</span>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sub-Categories View */}
          <div className={`absolute inset-0 transition-transform duration-300 ${activeCategoryView ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="px-6 py-6">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4 px-2">
                {activeCategoryView}
              </p>
              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => handleSubCategoryClick(activeCategoryView)}
                    className="w-full flex items-center justify-between min-h-[48px] py-3.5 px-4 text-sm font-black uppercase tracking-wider text-gray-900 hover:bg-gray-200/50 active-scale transition-all duration-200 text-left rounded-xl border border-transparent hover:border-gray-200"
                  >
                    <span>Shop All {activeCategoryView}</span>
                  </button>
                </li>
                {activeCategoryView && CATEGORY_MAP[activeCategoryView]?.map((sub, i) => (
                  <li key={sub}>
                    <button
                      onClick={() => handleSubCategoryClick(activeCategoryView, sub)}
                      className="w-full flex items-center justify-between min-h-[48px] py-3.5 px-4 text-sm font-black uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 active-scale transition-all duration-200 text-left rounded-xl border border-transparent hover:border-gray-200"
                      style={{ transitionDelay: `${i * 20}ms` }}
                    >
                      <span>{sub}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200/80 px-6 py-6 bg-[#F7F6F3] z-10 space-y-4">
          {isLoggedIn ? (
            <div className="flex items-center justify-between min-h-[48px]">
              <Link
                to="/account"
                onClick={onClose}
                className="flex items-center space-x-3 group active-scale"
              >
                <div className="w-11 h-11 bg-[#85110e]/10 border border-[#85110e]/20 text-[#85110e] flex items-center justify-center rounded-full group-hover:bg-[#85110e] group-hover:text-white transition-all">
                  <User size={16} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 truncate max-w-[130px] group-hover:text-[#85110e] transition-colors">
                    {customer?.name}
                  </p>
                  <p className="text-[8px] text-gray-400 font-bold tracking-wider mt-0.5 uppercase">
                    My Account
                  </p>
                </div>
              </Link>
              <button
                onClick={() => { logout(); onClose(); }}
                className="flex items-center space-x-1.5 min-h-[44px] px-4 py-2 border border-gray-300 text-gray-600 text-[9px] font-black uppercase tracking-widest hover:text-[#85110e] hover:border-[#85110e]/40 hover:bg-[#85110e]/5 active-scale rounded-xl transition-all"
              >
                <LogOut size={11} strokeWidth={2.5} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => { navigate('/account/login'); onClose(); }}
              className="w-full flex items-center justify-center space-x-2.5 bg-[#85110e] hover:bg-[#6e0e0b] text-white min-h-[48px] py-4 text-[10px] font-black uppercase tracking-[0.25em] active-scale rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <User size={14} strokeWidth={2.5} />
              <span>Customer Login</span>
            </button>
          )}

          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-400 text-center pt-1">
            Stop & Shop · Pakistan Edition
          </p>
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;