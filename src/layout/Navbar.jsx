/**
 * @fileoverview Navbar.jsx — Updated
 * Added: Account icon → /account (logged in) or /account/login
 * Customer name shown when logged in.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, ShoppingCart, Heart, Menu, ChevronDown,
  DollarSign, User, LogOut
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useCustomer } from '../context/CustomerContext.jsx';
import MobileDrawer from './MobileDrawer.jsx';

const CURRENCIES = {
  PKR: { symbol: '₨', rate: 1 },
  USD: { symbol: '$', rate: 0.0036 },
  AED: { symbol: 'د.إ', rate: 0.013 },
  GBP: { symbol: '£', rate: 0.0028 },
};

const BUCKETS = ['All', 'Tops', 'Bottoms', 'Footwear', 'Accessories'];

const Navbar = ({ products = [], onSearchOpen }) => {
  const { cartCount, isBouncing, setActiveBucket, openDrawer } = useCart();
  const { wishlistCount }     = useWishlist();
  const { currency, setCurrency } = useCurrency();
  const { locale, setLocale } = useLocale();
  const { customer, isLoggedIn, logout } = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [currencyOpen,  setCurrencyOpen]  = useState(false);
  const [accountOpen,   setAccountOpen]   = useState(false);
  const [activeTab,     setActiveTab]     = useState('All');

  const { scrollY } = useScroll();
  const headerHeight = useTransform(scrollY, [0, 60], [80, 64]);
  const headerPadding = useTransform(scrollY, [0, 60], ['1.5rem', '1rem']);

  // Scroll shrink observer
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Update active tab based on cart context or logic if needed
  // For now we keep it internal to the Navbar state

  // Subcategory map
  const categoryMap = useMemo(() => {
    const map = {};
    BUCKETS.forEach(b => {
      if (b === 'All') return;
      map[b] = [...new Set(products.filter(p => p.bucket === b && p.subCategory && p.subCategory.toLowerCase() !== 'general').map(p => p.subCategory))].sort();
    });
    return map;
  }, [products]);

  const handleBucketClick = useCallback((bucket, sub = null) => {
    setActiveTab(bucket);
    setActiveBucket(bucket, sub);
    if (location.pathname !== '/') {
      navigate('/');
    }
    setTimeout(() => { 
      document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
    }, 150);
  }, [setActiveBucket, navigate, location.pathname]);

  // Framer Motion Variants
  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        ease: [0.16, 1, 0.3, 1],
        duration: 0.6
      }
    }
  };

  return (
    <>
      <motion.header
        style={{ height: headerHeight }}
        className={`fixed top-14 left-0 w-full z-[100] transition-all duration-300 flex items-center ${
          scrolled 
            ? 'bg-[#0d0d0d]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)] border-b border-gray-150'
        }`}
      >
        <div className="w-full flex items-center justify-between px-6 sm:px-10 lg:px-16 mx-auto max-w-[1920px]">

          {/* Logo Section */}
          <Link to="/" className="flex-shrink-0 group relative" onClick={() => setActiveTab('All')}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center"
            >
              <span className={`font-black italic uppercase tracking-tighter text-[#ba1f3d] transition-all duration-500 ${scrolled ? 'text-xl' : 'text-[1.4rem]'}`}>
                Stop<span className={`${scrolled ? 'text-white' : 'text-gray-900'} not-italic font-black mx-0.5 transition-colors duration-500`}>&</span>Shop
              </span>
              <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#ba1f3d] transition-all duration-500 group-hover:w-full opacity-50" />
            </motion.div>
          </Link>

          {/* Desktop Navigation — Morphing Indicator */}
          <nav className="hidden lg:flex items-center space-x-2">
            {BUCKETS.map((bucket, idx) => (
              <motion.div
                key={bucket}
                initial="hidden"
                animate="show"
                variants={navItemVariants}
                transition={{ delay: 0.1 + idx * 0.05 }}
                className="relative group/parent"
              >
                <button
                  onClick={() => handleBucketClick(bucket)}
                  className={`relative px-5 py-3 text-[10.5px] font-black uppercase tracking-[0.18em] transition-all duration-300 flex items-center space-x-1.5 z-10 ${
                    activeTab === bucket 
                      ? (scrolled ? 'text-white' : 'text-gray-900') 
                      : (scrolled ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                  }`}
                >
                  <span className="relative z-20">{bucket}</span>
                  {bucket !== 'All' && categoryMap[bucket]?.length > 0 && (
                    <ChevronDown size={10} className={`group-hover/parent:rotate-180 transition-transform duration-500 z-20 ${activeTab === bucket ? 'opacity-100' : 'opacity-40'}`} />
                  )}
 
                  {/* Morphing Background Indicator — Editorial Style */}
                  {activeTab === bucket && (
                    <motion.div
                      layoutId="navIndicator"
                      className={`absolute inset-x-1 inset-y-1.5 rounded-full z-0 ${
                        scrolled 
                          ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10' 
                          : 'bg-gray-100 shadow-sm'
                      }`}
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.7 }}
                    />
                  )}
                </button>
 
                {/* Editorial Subcategory Dropdown */}
                {bucket !== 'All' && categoryMap[bucket]?.length > 0 && (
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 translate-y-4 pointer-events-none group-hover/parent:opacity-100 group-hover/parent:translate-y-0 group-hover/parent:pointer-events-auto transition-all duration-500 z-[110] min-w-[240px] p-1 ${
                    scrolled ? 'glass-editorial rounded-3xl' : 'bg-white border border-gray-100 shadow-2xl rounded-3xl'
                  }`}>
                    <div className="py-2">
                      <p className={`text-[8px] font-black uppercase tracking-[0.4em] pb-3 px-6 mb-2 border-b ${scrolled ? 'text-white/20 border-white/5' : 'text-gray-300 border-gray-50'}`}>
                        Collection / {bucket}
                      </p>
                      {categoryMap[bucket].map(sub => (
                        <button 
                          key={sub} 
                          onClick={() => handleBucketClick(bucket, sub)}
                          className={`w-full text-left px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 rounded-xl hover:translate-x-1 ${
                            scrolled 
                              ? 'text-gray-300 hover:text-white hover:bg-white/10' 
                              : 'text-gray-500 hover:text-[#ba1f3d] hover:bg-red-50'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                      <div className="mt-2 pt-2 px-6">
                        <button 
                          onClick={() => handleBucketClick(bucket)}
                          className="text-[8px] font-black text-[#ba1f3d] uppercase tracking-[0.3em] hover:brightness-125 transition-all flex items-center space-x-1"
                        >
                          <span>Explore All</span>
                          <span className="text-[12px]">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </nav>

          {/* Action Icons Section */}
          <div className="flex items-center space-x-2">
            
            {/* Search — Minimalist & High Contrast */}
            <Tooltip content="Search">
              <button 
                onClick={onSearchOpen} 
                className={`p-3 rounded-full transition-all duration-500 ${
                  scrolled ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Search size={18} strokeWidth={2.5} />
              </button>
            </Tooltip>

            {/* Account — Integrated into Theme */}
            <div className="relative group/account">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLoggedIn) {
                    setAccountOpen(o => !o);
                    setCurrencyOpen(false);
                  } else {
                    navigate('/account/login');
                  }
                }}
                className={`flex items-center space-x-2 p-3 rounded-full transition-all duration-500 ${
                  scrolled ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <User size={18} strokeWidth={2.5} />
                {isLoggedIn && (
                  <span className={`text-[10px] font-black uppercase tracking-widest hidden xl:block ${scrolled ? 'text-gray-300' : 'text-gray-700'}`}>
                    {customer.name.split(' ')[0]}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isLoggedIn && accountOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute right-0 top-full mt-2 min-w-[200px] p-1 z-[120] ${
                      scrolled ? 'glass-premium rounded-2xl shadow-2xl' : 'bg-white border border-gray-100 shadow-2xl rounded-2xl'
                    }`}
                  >
                    <div className={`px-5 py-4 border-b ${scrolled ? 'border-white/10' : 'border-gray-50'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${scrolled ? 'text-white' : 'text-gray-900'}`}>{customer.name}</p>
                      <p className="text-[9px] font-bold text-gray-400 lowercase">{customer.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/account" onClick={() => setAccountOpen(false)}
                        className={`flex items-center space-x-3 px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${
                          scrolled ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-50 hover:text-[#ba1f3d]'
                        }`}>
                        <User size={14} strokeWidth={2.5} />
                        <span>Profile</span>
                      </Link>
                      <button
                        onClick={() => { logout(); setAccountOpen(false); }}
                        className="w-full flex items-center space-x-3 px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl text-red-500 hover:bg-red-50"
                      >
                        <LogOut size={14} strokeWidth={2.5} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wishlist Button */}
            <button 
              onClick={() => openDrawer('wishlist')} 
              className={`relative p-3 rounded-full transition-all duration-500 ${
                scrolled ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart size={18} strokeWidth={2.5} />
              {wishlistCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 bg-[#ba1f3d] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white"
                >
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </motion.span>
              )}
            </button>

            {/* Cart Button — Tonal & Tactile */}
            <motion.button
              onClick={() => openDrawer('cart')}
              className={`relative p-3 rounded-full transition-all duration-500 ${
                scrolled 
                  ? 'bg-white text-gray-900 shadow-xl' 
                  : 'bg-[#ba1f3d] text-white shadow-lg'
              } hover:scale-110 active:scale-95`}
            >
              <ShoppingCart size={18} strokeWidth={2.5} />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute -top-1 -right-1 text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                      scrolled ? 'bg-[#ba1f3d] text-white border-white' : 'bg-gray-900 text-white border-white'
                    }`}
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className={`lg:hidden p-3 rounded-full transition-all duration-500 ${
                scrolled ? 'text-white' : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </motion.header>
      <MobileDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
};

// Helper for tooltips if needed, or simple implementation
const Tooltip = ({ children, content }) => (
  <div className="relative group/tooltip">
    {children}
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity">
      {content}
    </div>
  </div>
);

export default Navbar;