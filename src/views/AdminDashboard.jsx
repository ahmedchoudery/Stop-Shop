/**
 * @fileoverview AdminDashboard — Shell layout with responsive mobile nav.
 * Desktop: fixed 256px sidebar + ml-64 content area.
 * Mobile:  full-width content + top bar with hamburger → slide-in drawer.
 */

import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Shield } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import { EASING } from '../hooks/useAnime.js';

// Map route segments → readable page titles
const PAGE_TITLES = {
  dashboard:  'Dashboard',
  orders:     'Orders',
  products:   'Products',
  inventory:  'Inventory',
  analytics:  'Analytics',
  coupons:    'Coupons',
  reviews:    'Reviews',
  users:      'Users',
  audits:     'Audit Log',
  settings:   'Settings',
};

const AdminDashboard = () => {
  const mainRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Derive current page title from URL
  const segment = location.pathname.split('/').filter(Boolean).pop();
  const pageTitle = PAGE_TITLES[segment] ?? 'Admin';

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Entrance animation
  useEffect(() => {
    if (!mainRef.current) return;
    anime.set(mainRef.current, { opacity: 0, translateY: 8 });
    anime({
      targets: mainRef.current,
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 420,
      easing: EASING.FABRIC,
    });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Sidebar (desktop fixed + mobile drawer) */}
      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* ── Main content ───────────────────────────────────── */}
      <main
        ref={mainRef}
        className="flex-1 min-h-screen overflow-x-hidden lg:ml-64"
        style={{ opacity: 0, willChange: 'opacity, transform' }}
      >
        {/* ── Top bar ──────────────────────────────────────── */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5">
            {/* Left: hamburger (mobile) + title */}
            <div className="flex items-center gap-3">
              {/* Hamburger — mobile only */}
              <button
                id="admin-menu-toggle"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-gray-900 text-white hover:bg-cardinal transition-colors active:scale-95"
                aria-label="Open navigation"
              >
                <Menu size={18} />
              </button>

              {/* Logo mark — visible only on mobile (sidebar hidden) */}
              <div className="lg:hidden flex items-center gap-2">
                <Shield size={13} className="text-cardinal" />
                <span className="text-xs font-black italic uppercase tracking-tight text-gray-900">
                  Stop &amp; Shop
                </span>
                <span className="text-[10px] text-gray-300 font-bold">·</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  {pageTitle}
                </span>
              </div>

              {/* Page title — desktop */}
              <div className="hidden lg:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="System Online" />
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">
                  {new Date().toLocaleDateString('en-PK', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Right: live indicator (mobile) */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse lg:hidden" title="System Online" />
              <span className="hidden sm:block text-[9px] font-black uppercase tracking-[0.35em] text-gray-300">
                {new Date().toLocaleDateString('en-PK', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────── */}
        <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
