"use client";

/**
 * @fileoverview MobileDrawer.jsx — Premium iOS-Native & Editorial Edition
 * Theme: Warm Bone background, clean typography, 44px touch targets, momentum scroll, and spring scaling active states.
 */

import React, { useEffect, useState } from 'react';
import { X, MapPin, ChevronRight, ChevronLeft, Search, Package, RotateCcw, MessageCircle, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from '../utils/router-compat.jsx';
import { useCart } from '../context/CartContext.tsx';
import { useCustomer } from '../context/CustomerContext.jsx';
import { CATEGORIES, CATEGORY_MAP } from '../utils/categories.js';

const MobileDrawer = ({ isOpen, onClose }) => {
  const { setActiveBucket } = useCart();
  const { customer, isLoggedIn, logout } = useCustomer();
  const navigate = useNavigate();
  const [activeCategoryView, setActiveCategoryView] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setTimeout(() => setActiveCategoryView(null), 300);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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

  const QUICK_LINKS = [
    { label: 'Search Products',   icon: Search,        action: () => { navigate('/search'); onClose(); } },
    { label: 'Track My Order',    icon: Package,        action: () => { navigate('/track'); onClose(); } },
    { label: 'Returns & Exchange',icon: RotateCcw,      action: () => { navigate('/returns'); onClose(); } },
    { label: 'WhatsApp Us',       icon: MessageCircle,  action: () => { window.open('https://wa.me/923068458655', '_blank'); onClose(); } },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-xs z-[150] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel — premium iOS slide-up bottom sheet on mobile, side panel on tablet/desktop */}
      <div
        className={`fixed z-[151] bg-[#F7F6F3] shadow-2xl transition-transform duration-500 ease-out flex flex-col
          bottom-0 left-0 w-full h-[82vh] border-t border-gray-200 rounded-t-[30px] pb-safe
          sm:top-0 sm:left-0 sm:h-full sm:w-[380px] sm:border-r sm:border-t-0 sm:rounded-none sm:pb-0
          ${isOpen ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:-translate-x-full sm:translate-y-0'}`}
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
              className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors font-black uppercase tracking-tighter active-scale min-h-[44px] px-2"
            >
              <ChevronLeft size={18} />
              <span className="text-sm">Back</span>
            </button>
          ) : (
            <Link to="/" onClick={onClose} className="flex items-center space-x-2.5 min-h-[44px] px-2">
              <span className="text-lg font-black italic uppercase tracking-tighter text-cardinal">
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
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 mb-4 px-2">
                Collections
              </p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => handleSubCategoryClick('All')}
                    className="w-full flex items-center justify-between min-h-[44px] py-3.5 px-4 text-sm font-black uppercase tracking-tight text-gray-800 hover:text-black hover:bg-black/5 active-scale transition-all duration-200 text-left group rounded-xl"
                  >
                    <span>All Products</span>
                    <ChevronRight size={15} className="text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                  </button>
                </li>

                {CATEGORIES.map((cat, i) => (
                  <li key={cat}>
                    <button
                      onClick={() => handleCategorySelect(cat)}
                      className="w-full flex items-center justify-between min-h-[44px] py-3.5 px-4 text-sm font-black uppercase tracking-tight text-gray-500 hover:text-black hover:bg-black/5 active-scale transition-all duration-200 text-left group rounded-xl"
                      style={{ transitionDelay: `${i * 20}ms` }}
                    >
                      <span>{cat}</span>
                      <ChevronRight size={15} className="text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Divider */}
            <div className="mx-8 h-px bg-gray-200/60" />

            {/* Quick links */}
            <div className="px-6 py-6">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 mb-4 px-2">
                Quick Links
              </p>
              <ul className="space-y-1">
                {QUICK_LINKS.map(({ label, icon: Icon, action }) => (
                  <li key={label}>
                    <button
                      onClick={action}
                      className="w-full flex items-center space-x-3.5 min-h-[44px] py-3.5 px-4 text-xs font-black uppercase tracking-tight text-gray-500 hover:text-black hover:bg-black/5 active-scale transition-all duration-200 text-left group rounded-xl"
                    >
                      <Icon size={15} className="text-gray-400 group-hover:text-black transition-colors flex-shrink-0" />
                      <span>{label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sub-Categories View */}
          <div className={`absolute inset-0 transition-transform duration-300 ${activeCategoryView ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="px-6 py-6">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 mb-4 px-2">
                {activeCategoryView}
              </p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => handleSubCategoryClick(activeCategoryView)}
                    className="w-full flex items-center justify-between min-h-[44px] py-3.5 px-4 text-sm font-black uppercase tracking-tight text-gray-800 hover:bg-black/5 active-scale transition-all duration-200 text-left rounded-xl"
                  >
                    <span>Shop All {activeCategoryView}</span>
                  </button>
                </li>
                {activeCategoryView && CATEGORY_MAP[activeCategoryView]?.map((sub, i) => (
                  <li key={sub}>
                    <button
                      onClick={() => handleSubCategoryClick(activeCategoryView, sub)}
                      className="w-full flex items-center justify-between min-h-[44px] py-3.5 px-4 text-sm font-black uppercase tracking-tight text-gray-500 hover:text-black hover:bg-black/5 active-scale transition-all duration-200 text-left rounded-xl"
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
        <div className="flex-shrink-0 border-t border-gray-200/60 px-6 py-5 bg-[#F7F6F3] z-10 space-y-4 rounded-t-xl">

          {/* Account */}
          <div className="border-b border-gray-200/60 pb-4">
            {isLoggedIn ? (
              <div className="flex items-center justify-between min-h-[44px]">
                <Link
                  to="/account"
                  onClick={onClose}
                  className="flex items-center space-x-3 group active-scale"
                >
                  <div className="w-11 h-11 bg-gray-200/60 border border-gray-300/40 text-gray-600 flex items-center justify-center rounded-full group-hover:border-black/30 group-hover:text-black transition-all">
                    <User size={16} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 truncate max-w-[130px] group-hover:text-black transition-colors">
                      {customer?.name}
                    </p>
                    <p className="text-[8px] text-gray-400 font-bold tracking-wider mt-0.5 uppercase">
                      My Account
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => { logout(); onClose(); }}
                  className="flex items-center space-x-1.5 min-h-[44px] px-4 py-2 border border-gray-200 text-gray-500 text-[9px] font-black uppercase tracking-widest hover:text-black hover:border-black/30 hover:bg-black/5 active-scale rounded-xl transition-all"
                >
                  <LogOut size={11} strokeWidth={2.5} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => { navigate('/account/login'); onClose(); }}
                className="w-full flex items-center justify-center space-x-2 bg-black text-white min-h-[44px] py-3.5 text-[10px] font-black uppercase tracking-[0.25em] active-scale rounded-xl transition-all hover:bg-black/90"
              >
                <User size={13} strokeWidth={2.5} />
                <span>Customer Login</span>
              </button>
            )}
          </div>

          {/* Location */}
          <a
            href="https://www.google.com/maps/search/Zaib+Market+Gujrat+Punjab"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center space-x-3 group min-h-[44px] py-2 px-3 rounded-xl hover:bg-black/5 active-scale transition-all duration-300"
          >
            <div className="p-2 border border-gray-200 rounded-lg group-hover:border-black/30 group-hover:bg-black/5 transition-all duration-300">
              <MapPin size={16} className="text-gray-500 group-hover:text-black transition-colors" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 group-hover:text-black transition-colors">
                Find Our Store
              </p>
              <p className="text-[9px] font-bold text-gray-400 mt-0.5">
                Zaib Market, Gujrat
              </p>
            </div>
          </a>

          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-300 text-center pt-2">
            Stop & Shop · Pakistan Edition · 2026
          </p>
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;