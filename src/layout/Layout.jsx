'use client';

/**
 * @fileoverview Layout — Updated for Premium Redesign
 * Changes:
 *  - MarqueeBar is 34px tall, Navbar is 64–72px → total top offset = 34 + 68 = 102px
 *  - Simplified page transition (clip-path removed — too heavy on mobile)
 *  - isHome passed to MarqueeBar for transparent mode
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from '../utils/router-compat.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import MarqueeBar from '../components/MarqueeBar.jsx';
import FlashSaleBanner from '../components/FlashSaleBanner.jsx';
import SearchOverlay from '../components/SearchOverlay.jsx';
import WhatsAppButton from '../components/WhatsAppButton.jsx';
import { useSettings } from '../hooks/useDomain.js';

// ── Page transition — clean fade + subtle lift ─────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const Layout = ({ children, products = [] }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: settings } = useSettings(false);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Scroll detection — triggers navbar style change
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdmin = location.pathname.startsWith('/admin');
  const isHome = location.pathname === '/';

  // Top padding calculation:
  //   MarqueeBar = 34px (fixed, top-0)
  //   Navbar     = 64px scrolled / 72px default (fixed, top-[34px])
  //   Total      = 34 + 72 = 106px on non-home pages
  //   Home page gets pt-0 because the hero is full-bleed under the bars
  const mainPadding = isAdmin ? 'pt-0' : (isHome ? 'pt-0' : 'pt-[106px] pt-safe');

  if (isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-white w-full max-w-full overflow-x-hidden relative">
        <main className="flex-grow relative pt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <>
      {/* ── Fixed Header Wrapper (Unified fixed container outside overflow constraints to prevent gaps/drifting on mobile) ─── */}
      <div 
        className="fixed left-0 w-full z-[110] pointer-events-none"
        style={{ top: '-100px', paddingTop: '100px' }}
      >
        {/* Black block extending above the header wrapper to cover status bar safe area on mobile */}
        {(!isHome || scrolled) && (
          <div 
            className="absolute left-0 right-0 bg-black pointer-events-none" 
            style={{ top: 0, height: '100px' }}
          />
        )}

        {/* ── Flash sale banner (topmost, 36px, dismissible) ─── */}
        <FlashSaleBanner />

        {/* ── Marquee announcement bar (34px) ─────────────────── */}
        <MarqueeBar
          announcement={settings?.announcement}
          scrolled={scrolled}
          isHome={isHome}
        />

        {/* ── Navbar (sits below marquee bar) ─────────────────── */}
        <Navbar
          onSearchOpen={() => setSearchOpen(true)}
          products={products}
          scrolled={scrolled}
          isHome={isHome}
        />
      </div>

      <div className="min-h-screen flex flex-col bg-white w-full max-w-full overflow-x-hidden relative">
        {/* ── Page content ─────────────────────────────── */}
        <main className={`flex-grow relative ${mainPadding}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ── Footer ───────────────────────────────────── */}
        <Footer />

        {/* ── Search overlay ────────────────────────────── */}
        <SearchOverlay
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          products={products}
        />

        {/* ── WhatsApp floating button ──────────────────── */}
        <WhatsAppButton />
      </div>
    </>
  );
};

export default Layout;