import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, User, Menu, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import MobileDrawer from './MobileDrawer';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { cartCount, isBouncing, openDrawer } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [logo, setLogo] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/public/settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.logo) setLogo(data.logo); })
      .catch(() => {}); // Silently fail — fall back to text logo
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Tops', href: '/#tops' },
    { name: 'Bottoms', href: '/#bottoms' },
    { name: 'Footwear', href: '/#footwear' },
  ];

  return (
    <>
      <nav className="bg-red-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo & Hamburger Group */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="md:hidden p-2 hover:bg-red-700 rounded-full transition-all"
              >
                <Menu size={28} />
              </button>
              
              <Link 
                to="/"
                className={`flex-shrink-0 flex items-center cursor-pointer group h-12 transition-opacity duration-700 ease-in-out ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} 
              >
                {logo ? (
                  <img src={logo} alt="STOP & SHOP" className="h-full w-auto object-contain transition-transform group-hover:scale-105" />
                ) : (
                  <span className="text-xl md:text-2xl font-black tracking-tighter group-hover:text-red-100 transition-colors">
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
                  className="hover:text-yellow-400 transition-all relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-yellow-400 hover:after:w-full after:transition-all"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-2 sm:space-x-5">
              <button className="p-2 hover:bg-red-700 rounded-full transition-colors hidden sm:block">
                <Search size={22} />
              </button>
              <button className="p-2 hover:bg-red-700 rounded-full transition-colors hidden sm:block">
                <User size={22} />
              </button>

              <Link to="/admin" className="p-2 hover:bg-red-700 rounded-full transition-colors hidden sm:block text-white" title="Admin Dashboard">
                <Shield size={22} />
              </Link>
              
              <button 
                onClick={() => openDrawer('cart')}
                className="p-2.5 bg-red-900/30 hover:bg-red-700 rounded-full transition-colors relative"
              >
                <ShoppingBag 
                  size={22} 
                  className={isBouncing ? 'animate-cart-shake' : ''}
                />
                {cartCount > 0 && (
                  <span className={`absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-[11px] font-black px-2 py-0.5 rounded-full shadow-md transform transition-all duration-300 ${isBouncing ? 'scale-125' : 'scale-100'}`}>
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
