"use client";

/**
 * Navbar — Premium Unified Dark Edition
 * Transparent on hero, dark glass on scroll.
 * Cardinal Red: logo + active underline + cart/wishlist badges only.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from '../utils/router-compat.jsx';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, ShoppingBag, Heart, Menu,
  User, LogOut, ChevronDown
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCustomer } from '../context/CustomerContext.jsx';
import MobileDrawer from './MobileDrawer.jsx';
import { CATEGORIES, CATEGORY_MAP } from '../utils/categories.js';
import { playPremiumChime } from '../utils/audio.js';
import MagneticElement from '../components/MagneticElement.jsx';

const BUCKETS = ['All', ...CATEGORIES];

const Navbar = ({ products = [], onSearchOpen, scrolled, isHome }) => {
  const { cartCount, setActiveBucket, openDrawer } = useCart();
  const { wishlistCount } = useWishlist();
  const { customer, isLoggedIn, logout } = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen]   = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [subMenuOpen, setSubMenuOpen] = useState(null);
  const [activeTab, setActiveTab]     = useState('All');

  const isTransparent = isHome && !scrolled;
  const categoryMap = CATEGORY_MAP;

  const handleBucketClick = useCallback((bucket, sub = null) => {
    setActiveTab(bucket);
    setActiveBucket(bucket, sub);
    setSubMenuOpen(null);
    if (location.pathname !== '/') navigate('/');
    setTimeout(() => {
      document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }, [setActiveBucket, navigate, location.pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    const handler = () => setAccountOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [accountOpen]);

  const iconColor = isTransparent ? 'text-white/90' : 'text-gray-600';
  const iconHover = isTransparent ? 'hover:text-white hover:bg-white/20' : 'hover:text-black hover:bg-white/5';
  const navBg = isTransparent
    ? 'bg-transparent border-b border-white/10'
    : `border-b border-black/5 ${scrolled ? 'navbar-glass' : 'bg-white'}`;

  return (
    <>
      <header
        className={`w-full pointer-events-auto transition-all duration-400 ${navBg}`}
        style={{ height: scrolled ? '64px' : '72px' }}
      >
        <div className="h-full w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-between">

          {/* Logo — white on transparent hero, brand red on scrolled/white background */}
          <Link to="/" onClick={() => setActiveTab('All')} className="flex-shrink-0">
            <span className={`text-xl font-black italic uppercase tracking-tighter transition-colors duration-300 ${
              isTransparent ? 'text-white' : 'text-cardinal'
            }`}>
              Stop
              <span className={`not-italic font-black mx-0.5 transition-colors duration-300 ${
                isTransparent ? 'text-white/80' : 'text-black'
              }`}>&</span>
              Shop
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-0.5">
            {BUCKETS.map((bucket) => (
              <div
                key={bucket}
                className="relative"
                onMouseEnter={() => bucket !== 'All' && categoryMap[bucket]?.length > 0 && setSubMenuOpen(bucket)}
                onMouseLeave={() => setSubMenuOpen(null)}
              >
                <button
                  onClick={() => handleBucketClick(bucket)}
                  className={`relative flex items-center space-x-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-200 ${
                    activeTab === bucket
                      ? isTransparent ? 'text-white' : 'text-black'
                      : isTransparent ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <span>{bucket}</span>
                  {bucket !== 'All' && categoryMap[bucket]?.length > 0 && (
                    <ChevronDown size={9} className={`transition-transform duration-200 ${subMenuOpen === bucket ? 'rotate-180' : ''}`} />
                  )}
                  {/* Active underline */}
                  {activeTab === bucket && (
                    <motion.div
                      layoutId="navUnderline"
                      className="absolute bottom-0 left-4 right-4 h-[1.5px] bg-amber-gold"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                </button>

                {bucket !== 'All' && categoryMap[bucket]?.length > 0 && subMenuOpen === bucket && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-full left-0 mt-1 min-w-[180px] bg-white border border-gray-200 shadow-2xl z-50 py-2"
                  >
                    <button
                      onClick={() => handleBucketClick(bucket)}
                      className="w-full text-left px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-black hover:bg-white/5 transition-all"
                    >
                      All {bucket}
                    </button>
                    <div className="mx-4 h-px bg-gray-200 mb-1" />
                    {categoryMap[bucket].map(sub => (
                      <button
                        key={sub}
                        onClick={() => handleBucketClick(bucket, sub)}
                        className="w-full text-left px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-black hover:bg-white/5 transition-all"
                      >
                        {sub}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center space-x-0.5">
            <MagneticElement>
              <button onClick={() => { playPremiumChime(); onSearchOpen(); }} className={`w-11 h-11 lg:w-9 lg:h-9 flex items-center justify-center transition-all duration-200 active-scale ${iconColor} ${iconHover}`} aria-label="Search">
                <Search size={17} strokeWidth={1.8} />
              </button>
            </MagneticElement>

            <div className="relative hidden sm:block">
              <MagneticElement>
                <button
                  onClick={(e) => { e.stopPropagation(); playPremiumChime(); if (isLoggedIn) setAccountOpen(o => !o); else navigate('/account/login'); }}
                  className={`w-11 h-11 lg:w-9 lg:h-9 flex items-center justify-center transition-all duration-200 active-scale ${iconColor} ${iconHover}`}
                  aria-label="Account"
                >
                  <User size={17} strokeWidth={1.8} />
                </button>
              </MagneticElement>
              <AnimatePresence>
                {isLoggedIn && accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 top-full mt-2 min-w-[200px] bg-white border border-gray-200 shadow-2xl z-50"
                  >
                    <div className="px-5 py-4 border-b border-gray-200">
                      <p className="text-[10px] font-black uppercase tracking-tight text-black truncate">{customer?.name}</p>
                      <p className="text-[9px] text-gray-500 mt-0.5 truncate">{customer?.email}</p>
                    </div>
                    <div className="py-2">
                      <Link to="/account" onClick={() => { playPremiumChime(); setAccountOpen(false); }} className="flex items-center space-x-2.5 px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-black hover:bg-white/5 transition-all">
                        <User size={11} strokeWidth={2} /><span>My Account</span>
                      </Link>
                      <button onClick={() => { playPremiumChime(); logout(); setAccountOpen(false); }} className="w-full flex items-center space-x-2.5 px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-black hover:bg-white/5 transition-all">
                        <LogOut size={11} strokeWidth={2} /><span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wishlist — badge stays red */}
            <MagneticElement>
              <button onClick={() => { playPremiumChime(); openDrawer('wishlist'); }} className={`relative w-11 h-11 lg:w-9 lg:h-9 flex items-center justify-center transition-all duration-200 active-scale ${iconColor} ${iconHover}`} aria-label="Wishlist">
                <Heart size={17} strokeWidth={1.8} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 sm:top-1 sm:right-1 w-[13px] h-[13px] bg-cardinal rounded-full flex items-center justify-center text-[7px] font-bold font-mono text-white leading-none">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </button>
            </MagneticElement>

            {/* Cart */}
            <MagneticElement>
              <button onClick={() => { playPremiumChime(); openDrawer('cart'); }} className={`relative w-11 h-11 lg:w-9 lg:h-9 flex items-center justify-center ml-1 transition-all duration-300 active-scale ${isTransparent ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/5 text-black hover:bg-white/10 border border-gray-200'}`} aria-label="Cart">
                <ShoppingBag size={16} strokeWidth={1.8} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-[16px] h-[16px] bg-cardinal rounded-full flex items-center justify-center text-[7px] font-bold font-mono text-white leading-none border-[1.5px] border-white">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            </MagneticElement>

            <button onClick={() => setMobileOpen(true)} className={`lg:hidden w-11 h-11 flex items-center justify-center ml-1 transition-colors duration-200 active-scale ${iconColor} ${iconHover}`} aria-label="Menu">
              <Menu size={20} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
};

export default Navbar;