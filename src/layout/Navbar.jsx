/**
 * Navbar — Premium Minimalist Edition
 * Sits at top-[34px] to clear the 34px MarqueeBar.
 * Transparent on hero, crisp white on scroll. Cardinal Red as precise accent.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, ShoppingBag, Heart, Menu,
  User, LogOut, ChevronDown
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCustomer } from '../context/CustomerContext.jsx';
import MobileDrawer from './MobileDrawer.jsx';

const BUCKETS = ['All', 'Tops', 'Bottoms', 'Footwear', 'Accessories'];

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

  const categoryMap = useMemo(() => {
    const map = {};
    BUCKETS.forEach(b => {
      if (b === 'All') return;
      map[b] = [...new Set(
        products
          .filter(p => p.bucket === b && p.subCategory && p.subCategory.toLowerCase() !== 'general')
          .map(p => p.subCategory)
      )].sort();
    });
    return map;
  }, [products]);

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

  const iconColor = isTransparent ? 'text-white/70' : 'text-gray-500';
  const iconHover = isTransparent ? 'hover:text-white hover:bg-white/10' : 'hover:text-gray-900 hover:bg-gray-50';
  const navBg     = isTransparent
    ? 'bg-transparent border-b border-white/10'
    : 'bg-white border-b border-gray-100 shadow-[0_1px_0_rgba(0,0,0,0.04)]';

  return (
    <>
      <header
        className={`fixed left-0 w-full z-[100] transition-all duration-400 ${navBg}`}
        style={{ top: '34px', height: scrolled ? '64px' : '72px' }}
      >
        <div className="h-full w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" onClick={() => setActiveTab('All')} className="flex-shrink-0">
            <span className={`text-xl font-black italic uppercase tracking-tighter transition-colors duration-300 ${
              isTransparent ? 'text-white' : 'text-[#ba1f3d]'
            }`}>
              Stop
              <span className={`not-italic font-black mx-0.5 transition-colors duration-300 ${
                isTransparent ? 'text-white/80' : 'text-gray-900'
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
                      ? isTransparent ? 'text-white' : 'text-gray-900'
                      : isTransparent ? 'text-white/55 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                  }`}
                >
                  <span>{bucket}</span>
                  {bucket !== 'All' && categoryMap[bucket]?.length > 0 && (
                    <ChevronDown size={9} className={`transition-transform duration-200 ${subMenuOpen === bucket ? 'rotate-180' : ''}`} />
                  )}
                  {activeTab === bucket && (
                    <motion.div
                      layoutId="navUnderline"
                      className="absolute bottom-0 left-4 right-4 h-[1.5px] bg-[#ba1f3d]"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                </button>

                {bucket !== 'All' && categoryMap[bucket]?.length > 0 && subMenuOpen === bucket && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-full left-0 mt-1 min-w-[180px] bg-white border border-gray-100 shadow-lg z-50 py-2"
                  >
                    <button
                      onClick={() => handleBucketClick(bucket)}
                      className="w-full text-left px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-[#ba1f3d] transition-colors"
                    >
                      All {bucket}
                    </button>
                    <div className="mx-4 h-px bg-gray-100 mb-1" />
                    {categoryMap[bucket].map(sub => (
                      <button
                        key={sub}
                        onClick={() => handleBucketClick(bucket, sub)}
                        className="w-full text-left px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-[#ba1f3d] hover:bg-[#ba1f3d]/5 transition-all"
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
            <button onClick={onSearchOpen} className={`w-9 h-9 flex items-center justify-center transition-all duration-200 ${iconColor} ${iconHover}`} aria-label="Search">
              <Search size={17} strokeWidth={1.8} />
            </button>

            <div className="relative hidden sm:block">
              <button
                onClick={(e) => { e.stopPropagation(); if (isLoggedIn) setAccountOpen(o => !o); else navigate('/account/login'); }}
                className={`w-9 h-9 flex items-center justify-center transition-all duration-200 ${iconColor} ${iconHover}`}
                aria-label="Account"
              >
                <User size={17} strokeWidth={1.8} />
              </button>
              <AnimatePresence>
                {isLoggedIn && accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 top-full mt-2 min-w-[200px] bg-white border border-gray-100 shadow-xl z-50"
                  >
                    <div className="px-5 py-4 border-b border-gray-50">
                      <p className="text-[10px] font-black uppercase tracking-tight text-gray-900 truncate">{customer?.name}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5 truncate">{customer?.email}</p>
                    </div>
                    <div className="py-2">
                      <Link to="/account" onClick={() => setAccountOpen(false)} className="flex items-center space-x-2.5 px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-[#ba1f3d] hover:bg-[#ba1f3d]/5 transition-all">
                        <User size={11} strokeWidth={2} /><span>My Account</span>
                      </Link>
                      <button onClick={() => { logout(); setAccountOpen(false); }} className="w-full flex items-center space-x-2.5 px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-[#ba1f3d] hover:bg-[#ba1f3d]/5 transition-all">
                        <LogOut size={11} strokeWidth={2} /><span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => openDrawer('wishlist')} className={`relative w-9 h-9 flex items-center justify-center transition-all duration-200 ${iconColor} ${iconHover}`} aria-label="Wishlist">
              <Heart size={17} strokeWidth={1.8} />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-[13px] h-[13px] bg-[#ba1f3d] flex items-center justify-center text-[7px] font-black text-white leading-none">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </button>

            <button onClick={() => openDrawer('cart')} className={`relative w-9 h-9 flex items-center justify-center ml-1 transition-all duration-300 ${isTransparent ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-gray-900 text-white hover:bg-[#ba1f3d]'}`} aria-label="Cart">
              <ShoppingBag size={16} strokeWidth={1.8} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-[16px] h-[16px] bg-[#ba1f3d] flex items-center justify-center text-[7px] font-black text-white leading-none border-[1.5px] border-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            <button onClick={() => setMobileOpen(true)} className={`lg:hidden w-9 h-9 flex items-center justify-center ml-1 transition-colors duration-200 ${iconColor} ${iconHover}`} aria-label="Menu">
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