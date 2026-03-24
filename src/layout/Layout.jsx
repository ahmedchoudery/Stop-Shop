import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import SearchOverlay from '../components/SearchOverlay';
import WishlistDrawer from '../components/WishlistDrawer';
import { apiUrl } from '../config/api';

const Layout = ({ children, products = [] }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Global keyboard shortcut: Ctrl+K / Cmd+K for search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-[#ba1f3d]/10 selection:text-[#ba1f3d]">
      <div className="sticky top-0 z-50">
        <Navbar
          onSearchOpen={() => setIsSearchOpen(true)}
          onWishlistOpen={() => setIsWishlistOpen(true)}
        />
      </div>

      <main className="flex-grow bg-white">
        {children}
      </main>

      <Footer />

      {/* Global Overlays */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
      />
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
      />
    </div>
  );
};

export default Layout;