import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, User, Menu, Shield, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import MobileDrawer from './MobileDrawer';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { apiUrl } from '../config/api';

const Navbar = ({ onSearchOpen, onWishlistOpen }) => {
  const { cartCount, isBouncing, openDrawer } = useCart();
  const { wishlistCount } = useWishlist();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [logo, setLogo] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);

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
    { name: 'Home', href: '/' },
    { name: 'Tops', href: '/#tops' },
    { name: 'Bottoms', href: '/#bottoms' },
    { name: 'Footwear', href: '/#footwear' },
  ];

  return (
    <>
      <nav className={`bg-red-800 text-white shadow-lg sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-red-900 shadow-2xl' : ''}`}>
        {/* Scroll progress bar */}
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-yellow-400 transition-all duration-100 z-10"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo & Hamburger */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="md:hidden p-2 hover:bg-red-700 rounded-full transition-all"
              >
                <Menu size={28} />
              </button>

              <Link
                to="/"
                className={`flex-shrink-0 flex items-center cursor-pointer group h-12 transition-all duration-700 ${isScrolled ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}
              >
                {logo ? (
                  <img src={logo} alt="STOP & SHOP" className="h-full w-auto object-contain transition-transform group-hover:scale-105" />
                ) : (
                  <span className="text-xl md:text-2xl font-black tracking-tighter group-hover:text-yellow-400 transition-colors">
                    STOP & SHOP
                  </span>
                )}
              </Link>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex space-x-10 text-[11px] font-black uppercase tracking-widest">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="hover:text-yellow-400 transition-all relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-yellow-400 hover:after:w-full after:transition-all duration-300"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Search */}
              <button
                onClick={onSearchOpen}
                className="p-2.5 hover:bg-red-700 rounded-full transition-all group hidden sm:flex items-center"
                title="Search"
              >
                <Search size={20} className="group-hover:scale-110 transition-transform" />
              </button>

              {/* Wishlist */}
              <button
                onClick={onWishlistOpen}
                className="p-2.5 hover:bg-red-700 rounded-full transition-all relative hidden sm:flex items-center"
                title="Wishlist"
              >
                <Heart size={20} className={wishlistCount > 0 ? 'fill-red-300 text-red-300' : ''} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Admin */}
              <Link
                to="/admin"
                className="p-2.5 hover:bg-red-700 rounded-full transition-all hidden sm:flex items-center text-white"
                title="Admin Dashboard"
              >
                <Shield size={20} />
              </Link>

              {/* Cart */}
              <button
                onClick={() => openDrawer('cart')}
                className="p-2.5 bg-red-900/30 hover:bg-red-700 rounded-full transition-all relative"
              >
                <ShoppingBag
                  size={22}
                  className={isBouncing ? 'animate-cart-shake' : ''}
                />
                {cartCount > 0 && (
                  <span className={`absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-[11px] font-black px-1.5 py-0.5 rounded-full shadow-md transform transition-all duration-300 ${isBouncing ? 'scale-125' : 'scale-100'}`}>
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