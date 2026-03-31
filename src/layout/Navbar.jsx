/**
 * @fileoverview Navbar — Design Spells Edition
 * Fix: replaced require('animejs') with ESM import — entrance & cart shake now work
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingBag, Heart, Globe, DollarSign,
  Menu, X, ChevronDown, Zap
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { EASING } from '../hooks/useAnime.js';

const BUCKETS = ['All', 'Tops', 'Bottoms', 'Footwear', 'Accessories'];

const Navbar = ({ onSearchOpen, products = [] }) => {
  const { cartCount, isBouncing, openDrawer, setActiveBucket } = useCart();
  const { wishlistCount } = useWishlist();
  const { currency, setCurrency } = useCurrency();
  const { locale, setLocale } = useLocale();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const navRef = useRef(null);
  const cartRef = useRef(null);
  const linksRef = useRef(null);
  const hasAnimated = useRef(false);

  // ── Scroll shrink effect ──────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Entrance animation ────────────────────────────────────────
  useEffect(() => {
    if (hasAnimated.current || !linksRef.current) return;
    hasAnimated.current = true;

    const links = linksRef.current.querySelectorAll('[data-nav-item]');
    anime.set(links, { opacity: 0, translateY: -12 });
    anime({
      targets: links,
      opacity: [0, 1],
      translateY: [-12, 0],
      duration: 600,
      delay: anime.stagger(60, { start: 200 }),
      easing: EASING.FABRIC,
    });
  }, []);

  // ── Cart shake spring animation ───────────────────────────────
  useEffect(() => {
    if (!isBouncing || !cartRef.current) return;
    anime({
      targets: cartRef.current,
      rotate: [0, -18, 14, -10, 8, -4, 2, 0],
      scale: [1, 1.2, 1.2, 1.15, 1.1, 1.05, 1.02, 1],
      duration: 600,
      easing: 'spring(1, 80, 10, 0)',
    });
  }, [isBouncing]);

  const handleBucketClick = useCallback((bucket) => {
    setActiveTab(bucket);
    setActiveBucket(bucket);
    navigate('/');
    const grid = document.getElementById('product-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [setActiveBucket, navigate]);

  return (
    <>
      <header
        ref={navRef}
        className={`sticky top-0 z-50 bg-white transition-all duration-500 ${
          scrolled
            ? 'shadow-[0_2px_30px_rgba(0,0,0,0.08)] py-0'
            : 'border-b border-gray-100 py-0'
        }`}
        style={{ willChange: 'box-shadow' }}
      >
        {/* ── Top Bar ─────────────────────────────────────────── */}
        <div className={`flex items-center justify-between transition-all duration-500 ${
          scrolled ? 'px-6 sm:px-8 h-14' : 'px-6 sm:px-8 lg:px-12 h-16'
        }`}>

          {/* Logo */}
          <Link
            to="/"
            className="flex-shrink-0 group"
            data-nav-item
          >
            <span
              className={`font-black italic uppercase tracking-tighter text-[#ba1f3d] transition-all duration-500 ${
                scrolled ? 'text-xl' : 'text-2xl'
              }`}
            >
              Stop<span className="text-gray-900 not-italic font-black mx-0.5">&</span>Shop
            </span>
          </Link>

          {/* Center Nav Links — desktop */}
          <nav ref={linksRef} className="hidden lg:flex items-center space-x-1">
            {BUCKETS.map(bucket => (
              <button
                key={bucket}
                data-nav-item
                onClick={() => handleBucketClick(bucket)}
                className={`relative px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] transition-colors duration-200 group ${
                  activeTab === bucket ? 'text-[#ba1f3d]' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {bucket}
                {/* Underline draw — design spell */}
                <span className={`absolute bottom-0 left-4 right-4 h-[2px] bg-[#ba1f3d] transition-transform duration-300 origin-left ${
                  activeTab === bucket ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-1" data-nav-item>

            {/* Search */}
            <button
              onClick={onSearchOpen}
              className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
              title="Search"
            >
              <Search size={18} className="group-hover:scale-110 transition-transform duration-200" />
            </button>

            {/* Currency Picker */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setCurrencyOpen(o => !o)}
                className="flex items-center space-x-1 p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 text-[10px] font-black uppercase tracking-wider"
              >
                <DollarSign size={14} />
                <span>{currency}</span>
                <ChevronDown size={10} className={`transition-transform duration-200 ${currencyOpen ? 'rotate-180' : ''}`} />
              </button>

              {currencyOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 shadow-2xl shadow-gray-200/60 rounded-xl overflow-hidden z-50 min-w-[140px]">
                  {Object.keys(CURRENCIES).map(code => (
                    <button
                      key={code}
                      onClick={() => { setCurrency(code); setCurrencyOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors duration-150 ${
                        currency === code
                          ? 'bg-[#ba1f3d]/5 text-[#ba1f3d]'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{code}</span>
                      <span className="text-gray-400">{CURRENCIES[code].symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Locale Toggle */}
            <button
              onClick={() => setLocale(locale === 'en-US' ? 'ur-PK' : 'en-US')}
              className="hidden sm:flex items-center space-x-1 p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 text-[10px] font-black"
              title="Toggle Language"
            >
              <Globe size={14} />
              <span className="uppercase tracking-wider">{locale === 'en-US' ? 'EN' : 'UR'}</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={() => openDrawer('wishlist')}
              className="relative p-2.5 text-gray-600 hover:text-[#ba1f3d] hover:bg-red-50 rounded-xl transition-all duration-200 group"
            >
              <Heart size={18} className="group-hover:scale-110 transition-transform duration-200" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ba1f3d] text-white text-[8px] font-black rounded-full flex items-center justify-center animate-scale-in">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </button>

            {/* Cart — magnetic + shake */}
            <button
              ref={cartRef}
              onClick={() => openDrawer('cart')}
              className="relative p-2.5 text-gray-900 hover:text-[#ba1f3d] hover:bg-red-50 rounded-xl transition-colors duration-200 group"
              style={{ willChange: 'transform' }}
            >
              <ShoppingBag size={20} className="group-hover:scale-110 transition-transform duration-200" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ba1f3d] text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Admin link */}
            <Link
              to="/admin"
              className="hidden md:flex items-center space-x-2 ml-2 px-4 py-2 bg-gray-900 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-[#ba1f3d] transition-all duration-300 group"
            >
              <Zap size={11} className="group-hover:scale-110 transition-transform" />
              <span>Admin</span>
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="lg:hidden p-2.5 text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Drawer ────────────────────────────────────── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white animate-slide-up">
            <nav className="px-6 py-4 space-y-1">
              {BUCKETS.map(bucket => (
                <button
                  key={bucket}
                  onClick={() => { handleBucketClick(bucket); setMobileOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl transition-all ${
                    activeTab === bucket
                      ? 'bg-[#ba1f3d]/5 text-[#ba1f3d]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {bucket}
                </button>
              ))}
              <div className="pt-2 border-t border-gray-100">
                <Link
                  to="/admin"
                  className="flex items-center space-x-2 px-4 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-gray-700 hover:text-[#ba1f3d]"
                  onClick={() => setMobileOpen(false)}
                >
                  <Zap size={13} />
                  <span>Admin Portal</span>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Currency dropdown backdrop */}
      {currencyOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setCurrencyOpen(false)} />
      )}
    </>
  );
};

export default Navbar;
