"use client";

/**
 * @fileoverview MobileDrawer.jsx — Dark Edition
 * Theme: Dark panel, white hover states, no red on nav interactions.
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
        className={`fixed inset-0 bg-white/70 backdrop-blur-md z-[150] transition-opacity duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel — dark */}
      <div
        className="fixed top-0 left-0 h-full w-[85%] sm:w-[380px] bg-[#0f0f0f] border-r border-gray-200 z-[151] shadow-2xl transition-transform duration-500 ease-out flex flex-col"
        style={{
          transform: isOpen ? 'translate3d(0%, 0, 0)' : 'translate3d(-100%, 0, 0)',
          willChange: 'transform'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          {activeCategoryView ? (
            <button
              onClick={() => setActiveCategoryView(null)}
              className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors font-black uppercase tracking-tighter"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
          ) : (
            <Link to="/" onClick={onClose} className="flex items-center space-x-2.5">
              <span className="text-lg font-black italic uppercase tracking-tighter text-[#ba1f3d]">
                Stop<span className="not-italic text-black/80">&</span>Shop
              </span>
            </Link>
          )}
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/5 transition-all"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Scroll area */}
        <div className="flex-grow overflow-y-auto overflow-x-hidden relative">

          {/* Main Categories View */}
          <div className={`absolute inset-0 transition-transform duration-300 ${activeCategoryView ? '-translate-x-full' : 'translate-x-0'}`}>
            <div className="px-6 py-6">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 mb-4">
                Collections
              </p>
              <ul className="space-y-0.5">
                <li>
                  <button
                    onClick={() => handleSubCategoryClick('All')}
                    className="w-full flex items-center justify-between py-3.5 px-4 text-base font-black uppercase tracking-tight text-black hover:bg-white/5 transition-all duration-200 text-left group"
                  >
                    <span>All Products</span>
                    <ChevronRight size={16} className="text-[#333] group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </li>

                {CATEGORIES.map((cat, i) => (
                  <li key={cat}>
                    <button
                      onClick={() => handleCategorySelect(cat)}
                      className="w-full flex items-center justify-between py-3.5 px-4 text-base font-black uppercase tracking-tight text-gray-600 hover:text-black hover:bg-white/5 transition-all duration-200 text-left group"
                      style={{ transitionDelay: `${i * 30}ms` }}
                    >
                      <span>{cat}</span>
                      <ChevronRight size={16} className="text-[#333] group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Divider */}
            <div className="mx-6 h-px bg-gray-100" />

            {/* Quick links */}
            <div className="px-6 py-6">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 mb-4">
                Quick Links
              </p>
              <ul className="space-y-0.5">
                {QUICK_LINKS.map(({ label, icon: Icon, action }) => (
                  <li key={label}>
                    <button
                      onClick={action}
                      className="w-full flex items-center space-x-3 py-3 px-4 text-sm font-black uppercase tracking-tight text-gray-500 hover:text-black hover:bg-white/5 transition-all duration-200 text-left group"
                    >
                      <Icon size={14} className="text-gray-500 group-hover:text-gray-600 transition-colors flex-shrink-0" />
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
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 mb-4">
                {activeCategoryView}
              </p>
              <ul className="space-y-0.5">
                <li>
                  <button
                    onClick={() => handleSubCategoryClick(activeCategoryView)}
                    className="w-full flex items-center justify-between py-3.5 px-4 text-base font-black uppercase tracking-tight text-black hover:bg-white/5 transition-all duration-200 text-left"
                  >
                    <span>Shop All {activeCategoryView}</span>
                  </button>
                </li>
                {activeCategoryView && CATEGORY_MAP[activeCategoryView]?.map((sub, i) => (
                  <li key={sub}>
                    <button
                      onClick={() => handleSubCategoryClick(activeCategoryView, sub)}
                      className="w-full flex items-center justify-between py-3.5 px-4 text-base font-black uppercase tracking-tight text-gray-600 hover:text-black hover:bg-white/5 transition-all duration-200 text-left"
                      style={{ transitionDelay: `${i * 30}ms` }}
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
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-5 bg-[#0f0f0f] z-10 space-y-4">

          {/* Account */}
          <div className="border-b border-gray-200 pb-4">
            {isLoggedIn ? (
              <div className="flex items-center justify-between">
                <Link
                  to="/account"
                  onClick={onClose}
                  className="flex items-center space-x-3 group"
                >
                  <div className="w-9 h-9 bg-gray-100 border border-gray-300 text-gray-600 flex items-center justify-center group-hover:border-white group-hover:text-black transition-all">
                    <User size={15} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 truncate max-w-[130px] group-hover:text-black transition-colors">
                      {customer?.name}
                    </p>
                    <p className="text-[8px] text-gray-500 font-bold tracking-wider mt-0.5 uppercase">
                      My Account
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => { logout(); onClose(); }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-300 text-gray-500 text-[8px] font-black uppercase tracking-widest hover:text-black hover:border-[#444] transition-all"
                >
                  <LogOut size={10} strokeWidth={2.5} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => { navigate('/account/login'); onClose(); }}
                className="w-full flex items-center justify-center space-x-2 bg-white text-black py-3 text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 hover:bg-[#f0f0f0]"
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
            className="flex items-center space-x-3 group"
          >
            <div className="p-2.5 border border-gray-300 group-hover:border-[#444] group-hover:bg-white/5 transition-all duration-300">
              <MapPin size={16} className="text-gray-500 group-hover:text-gray-600 transition-colors" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 group-hover:text-black transition-colors">
                Find Our Store
              </p>
              <p className="text-[9px] font-bold text-gray-500 mt-0.5">
                Zaib Market, Gujrat
              </p>
            </div>
          </a>

          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#2a2a2a] text-center">
            Stop & Shop · Pakistan Edition · 2026
          </p>
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;