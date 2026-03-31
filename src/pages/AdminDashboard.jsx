/**
 * @fileoverview AdminDashboard — Design Spells Edition
 * Fix: replaced require('animejs') with ESM import — page entrance animations are now functional
 * Applies: animejs-animation (page entrance), design-md (admin dark theme)
 */

import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar.jsx';
import { EASING } from '../hooks/useAnime.js';

const AdminDashboard = () => {
  const mainRef = useRef(null);

  useEffect(() => {
    if (!mainRef.current) return;

    anime.set(mainRef.current, { opacity: 0 });
    anime({
      targets: mainRef.current,
      opacity: [0, 1],
      duration: 500,
      easing: EASING.FABRIC,
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      {/* Main content area */}
      <main
        ref={mainRef}
        className="flex-1 ml-64 min-h-screen overflow-y-auto"
        style={{ opacity: 0, willChange: 'opacity' }}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="System Online" />
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">
            {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Page content */}
        <div className="p-8 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
