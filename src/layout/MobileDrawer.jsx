/**
 * @fileoverview MobileDrawer.jsx
 * FIXES:
 *  - Category links now scroll to product grid AND filter by category
 *  - Added Track Order link
 *  - Added WhatsApp contact link
 *  - Fixed transition classes (was using template literals inside className which Tailwind can't purge)
 *  - Added Search link
 *  - Added Returns link
 */

import React, { useEffect } from 'react';
import { X, MapPin, ChevronRight, Search, Package, RotateCcw, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

const CATEGORIES = ['Tops', 'Bottoms', 'Footwear', 'Accessories'];

const MobileDrawer = ({ isOpen, onClose }) => {
  const { setActiveBucket } = useCart();
  const navigate = useNavigate();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleCategoryClick = (category) => {
    setActiveBucket(category);
    navigate('/');
    onClose();
    // Small delay so navigation completes, then scroll to grid
    setTimeout(() => {
      const grid = document.getElementById('product-grid');
      if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const QUICK_LINKS = [
    { label: 'Search Products', icon: Search, action: () => { navigate('/search'); onClose(); } },
    { label: 'Track My Order', icon: Package, action: () => { navigate('/track'); onClose(); } },
    { label: 'Returns & Exchange', icon: RotateCcw, action: () => { navigate('/returns'); onClose(); } },
    { label: 'WhatsApp Us', icon: MessageCircle, action: () => { window.open('https://wa.me/923068458655', '_blank'); onClose(); } },
  ];

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[100] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 left-0 h-full w-[85%] sm:w-[380px] bg-white z-[101] shadow-2xl transition-transform duration-500 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        style={{ willChange: 'transform' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <Link to="/" onClick={onClose} className="flex items-center space-x-2.5">
            <div className="w-7 h-7 bg-[#ba1f3d] flex items-center justify-center">
              <span className="text-white text-[9px] font-black">S&S</span>
            </div>
            <span className="text-lg font-black italic uppercase tracking-tighter text-[#ba1f3d]">
              Stop & Shop
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} className="text-gray-700" />
          </button>
        </div>

        {/* Scroll area */}
        <div className="flex-grow overflow-y-auto">

          {/* Categories section */}
          <div className="px-6 py-6">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-4">
              Collections
            </p>
            <ul className="space-y-1">
              {/* All products */}
              <li>
                <button
                  onClick={() => handleCategoryClick('All')}
                  className="w-full flex items-center justify-between py-3 px-4 text-lg font-black uppercase tracking-tighter text-gray-900 hover:text-[#ba1f3d] hover:bg-red-50 rounded-xl transition-all duration-200 text-left group"
                >
                  <span>All Products</span>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[#ba1f3d] group-hover:translate-x-1 transition-all" />
                </button>
              </li>

              {CATEGORIES.map((cat, i) => (
                <li key={cat}>
                  <button
                    onClick={() => handleCategoryClick(cat)}
                    className="w-full flex items-center justify-between py-3 px-4 text-lg font-black uppercase tracking-tighter text-gray-700 hover:text-[#ba1f3d] hover:bg-red-50 rounded-xl transition-all duration-200 text-left group"
                    style={{ transitionDelay: `${i * 30}ms` }}
                  >
                    <span>{cat}</span>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-[#ba1f3d] group-hover:translate-x-1 transition-all" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Divider */}
          <div className="mx-6 h-px bg-gray-100" />

          {/* Quick links section */}
          <div className="px-6 py-6">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 mb-4">
              Quick Links
            </p>
            <ul className="space-y-1">
              {QUICK_LINKS.map(({ label, icon: Icon, action }) => (
                <li key={label}>
                  <button
                    onClick={action}
                    className="w-full flex items-center space-x-3 py-3 px-4 text-sm font-black uppercase tracking-tight text-gray-600 hover:text-[#ba1f3d] hover:bg-red-50 rounded-xl transition-all duration-200 text-left group"
                  >
                    <Icon size={15} className="text-gray-400 group-hover:text-[#ba1f3d] transition-colors flex-shrink-0" />
                    <span>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-100 px-6 py-5">
          <a
            href="https://www.google.com/maps/search/Zaib+Market+Gujrat+Punjab"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center space-x-3 group"
          >
            <div className="bg-[#ba1f3d]/8 p-2.5 rounded-xl group-hover:bg-[#ba1f3d] transition-all duration-300">
              <MapPin size={16} className="text-[#ba1f3d] group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700 group-hover:text-[#ba1f3d] transition-colors">
                Find Our Store
              </p>
              <p className="text-[9px] font-bold text-gray-400 mt-0.5">
                Zaib Market, Gujrat
              </p>
            </div>
          </a>

          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-300 mt-5 text-center">
            Stop & Shop · Pakistan Edition · 2026
          </p>
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;