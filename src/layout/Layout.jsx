/**
 * @fileoverview Layout — Main site wrapper
 * Updated: Added WhatsAppButton globally — appears on all storefront pages,
 *          hidden automatically on /admin and /login routes.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import SearchOverlay from '../components/SearchOverlay.jsx';
import MarqueeBar from '../components/MarqueeBar.jsx';
import WhatsAppButton from '../components/WhatsAppButton.jsx';
import { useSettings } from '../hooks/useDomain.js';

/**
 * Liquid Page Transition variants
 */
const pageVariants = {
  initial: {
    opacity: 0,
    clipPath: 'circle(0% at 50% 50%)',
    filter: 'blur(40px)',
    scale: 1.1,
  },
  animate: {
    opacity: 1,
    clipPath: 'circle(150% at 50% 50%)',
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      duration: 1.2,
      ease: [0.23, 1, 0.32, 1], // Liquid expansion easing
    },
  },
  exit: {
    opacity: 0,
    clipPath: 'circle(0% at 50% 50%)',
    filter: 'blur(40px)',
    scale: 0.9,
    transition: {
      duration: 0.8,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

const Layout = ({ children, products = [] }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: settings } = useSettings(false);
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Unified scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      {/* Announcement bar */}
      <MarqueeBar 
        announcement={settings?.announcement} 
        scrolled={scrolled} 
        isHome={isHome}
      />

      {/* Sticky navbar */}
      <Navbar
        onSearchOpen={() => setSearchOpen(true)}
        products={products}
        scrolled={scrolled}
        isHome={isHome}
      />

      {/* Page content with Liquid Transition */}
      <main className={`flex-grow relative ${isHome ? 'pt-0' : 'pt-[124px] lg:pt-[140px]'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
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