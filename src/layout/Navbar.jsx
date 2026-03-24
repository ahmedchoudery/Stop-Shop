import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, User, Menu, Shield, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import MobileDrawer from './MobileDrawer';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { apiUrl } from '../config/api';

const Navbar = ({ onSearchOpen, onWishlistOpen }) => {
  const { cartCount, isBouncing, openDrawer, setActiveBucket } = useCart();
  const { wishlistCount } = useWishlist();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [logo, setLogo] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch(apiUrl('/api/public/settings'))
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.logo) setLogo(data.logo); })
      .catch(() => { });
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', bucket: 'All' },
    { name: 'Tops', href: '/#trending', bucket: 'Tops' },
    { name: 'Bottoms', href: '/#trending', bucket: 'Bottoms' },
    { name: 'Accessories', href: '/#trending', bucket: 'Accessories' },
  ];

  const CARDINAL = '#ba1f3d';

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white/95 backdrop-blur-xl py-3 shadow-sm border-b border-gray-100' : 'bg-white py-6'}`}>
        {/* Scroll progress bar */}
        <div
          className="absolute bottom-0 left-0 h-[3px] transition-all duration-100 z-10"
          style={{ width: `${scrollProgress}%`, backgroundColor: CARDINAL }}
        />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center">
            {/* Logo & Hamburger */}
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-50 rounded-full transition-all"
              >
                <Menu size={24} className="text-gray-900" />
              </button>

              <Link
                to="/"
                className="flex-shrink-0 flex items-center cursor-pointer group h-8"
              >
                {logo ? (
                  <img src={logo} alt="STOP & SHOP" className="h-full w-auto object-contain transition-transform group-hover:scale-105" />
                ) : (
                  <span className="text-2xl font-black tracking-tighter transition-all duration-500 flex items-center" style={{ color: CARDINAL }}>
                    STOP<span className="text-gray-900 ml-1">&</span>SHOP
                  </span>
                )}
              </Link>
            </div>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center space-x-12 text-[10px] font-black uppercase tracking-[0.25em]">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setActiveBucket(link.bucket)}
                  className="text-gray-500 hover:text-black transition-all relative group"
                >
                  <span className="relative z-10">{link.name}</span>
                  <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#ba1f3d] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={onSearchOpen}
                className="p-3 hover:bg-gray-50 rounded-full transition-all group lg:flex items-center"
                title="Search"
              >
                <Search size={20} className="text-gray-800 group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={onWishlistOpen}
                className="p-2.5 hover:bg-gray-50 rounded-full transition-all relative hidden sm:flex items-center"
                title="Wishlist"
              >
                <Heart size={20} className={wishlistCount > 0 ? 'fill-[#ba1f3d] text-[#ba1f3d]' : 'text-gray-800'} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ba1f3d] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Admin */}
              <Link
                to="/admin"
                className="p-2.5 hover:bg-gray-50 rounded-full transition-all hidden sm:flex items-center text-gray-800"
                title="Admin Dashboard"
              >
                <Shield size={20} />
              </Link>

              {/* Cart */}
              <button
                onClick={() => openDrawer('cart')}
                className="p-3 bg-gray-900 text-white rounded-full transition-all relative hover:bg-[#ba1f3d] hover:shadow-xl hover:-translate-y-0.5"
              >
                <ShoppingBag
                  size={20}
                  className={isBouncing ? 'animate-cart-shake' : ''}
                />
                {cartCount > 0 && (
                  <span className={`absolute -top-1 -right-1 bg-white text-[#ba1f3d] text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg transform transition-all duration-300 border border-[#ba1f3d]/10 ${isBouncing ? 'scale-125' : 'scale-100'}`}>
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
};

export default Navbar;