/**
 * @fileoverview Layout — Main site wrapper
 * Updated: Added WhatsAppButton globally — appears on all storefront pages,
 *          hidden automatically on /admin and /login routes.
 */

import React, { useState } from 'react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import SearchOverlay from '../components/SearchOverlay.jsx';
import MarqueeBar from '../components/MarqueeBar.jsx';
import WhatsAppButton from '../components/WhatsAppButton.jsx';
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

      {/* WhatsApp floating button — auto-hidden on admin/login pages */}
      <WhatsAppButton />
    </div>
  );
};

export default Layout;