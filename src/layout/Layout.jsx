import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import MarqueeBar from '../components/MarqueeBar';
import SearchOverlay from '../components/SearchOverlay';
import WishlistDrawer from '../components/WishlistDrawer';
import CustomCursor from '../components/CustomCursor';

// Cursor DOM elements injected at layout level
const CursorElements = () => (
  <>
    <div id="custom-cursor" />
    <div id="cursor-follower" />
  </>
);

const Layout = ({ children, products = [] }) => {
  const [announcement, setAnnouncement] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/public/settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.announcement) setAnnouncement(data.announcement); })
      .catch(() => { });
  }, []);

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
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-red-100 selection:text-red-900">
      <CursorElements />
      <CustomCursor />

      <MarqueeBar announcement={announcement} />

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