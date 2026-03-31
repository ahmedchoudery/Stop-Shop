/**
 * @fileoverview Layout — Main site wrapper
 * Applies: react-patterns (composition, single responsibility),
 *          design-spells (search overlay, smooth page transitions)
 */

import React, { useState } from 'react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import SearchOverlay from '../components/SearchOverlay.jsx';
import MarqueeBar from '../components/MarqueeBar.jsx';
import { useSettings } from '../hooks/useDomain.js';

const Layout = ({ children, products = [] }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: settings } = useSettings(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Announcement bar */}
      <MarqueeBar announcement={settings?.announcement} />

      {/* Sticky navbar */}
      <Navbar
        onSearchOpen={() => setSearchOpen(true)}
        products={products}
      />

      {/* Page content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Search overlay — portal-like, above everything */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={products}
      />
    </div>
  );
};

export default Layout;