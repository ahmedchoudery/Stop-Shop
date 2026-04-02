/**
 * @fileoverview AdminSidebar — Updated with Coupons nav item
 */

import React, { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Settings,
  Users, LogOut, ChevronRight, ShieldCheck,
  BarChart3, Tag, TrendingUp
} from 'lucide-react';
import { apiUrl } from '../config/api.js';
import { authFetch, clearToken } from '../lib/auth.js';
import { EASING } from '../hooks/useAnime.js';

const AdminSidebar = () => {
  const [role, setRole] = useState('admin');
  const navRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    authFetch(apiUrl('/api/admin/users'))
      .then(r => r.ok ? r.json() : null)
      .then(() => setRole('admin'))
      .catch(() => setRole('admin'));
  }, []);

  useEffect(() => {
    if (hasAnimated.current || !navRef.current) return;
    hasAnimated.current = true;

    const items = navRef.current.querySelectorAll('[data-nav]');
    anime.set(items, { opacity: 0, translateX: -16 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateX: [-16, 0],
      duration: 500,
      delay: anime.stagger(60, { start: 300 }),
      easing: EASING.FABRIC,
    });
  }, []);

  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
    { to: '/admin/orders',    label: 'Orders',     icon: ShoppingBag },
    { to: '/admin/products',  label: 'Products',   icon: Package },
    { to: '/admin/inventory', label: 'Inventory',  icon: BarChart3 },
    { to: '/admin/coupons',   label: 'Coupons',    icon: Tag },
    { to: '/admin/analytics', label: 'Analytics',  icon: TrendingUp },  // ← NEW
    { to: '/admin/users',     label: 'Team',       icon: Users },
    ...(role === 'super-admin' || role === 'auditor'
      ? [{ to: '/admin/audits', label: 'Audits', icon: ShieldCheck }]
      : []),
    ...(role === 'super-admin'
      ? [{ to: '/admin/settings', label: 'Settings', icon: Settings }]
      : []),
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0d0508] text-white flex flex-col z-20 overflow-hidden">

      {/* Grain texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#ba1f3d]" />

      {/* Brand Header */}
      <div className="relative px-7 py-8 border-b border-white/6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#ba1f3d] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-black">S&S</span>
          </div>
          <div>
            <h1 className="text-base font-black italic uppercase tracking-tighter text-white">
              Stop & Shop
            </h1>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/25 mt-0.5">
              Control Center
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="flex-grow px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            data-nav
            className={({ isActive }) =>
              `w-full flex items-center justify-between px-4 py-3 font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-200 rounded-sm border-l-2 relative overflow-hidden group ${
                isActive
                  ? 'bg-white/8 text-[#FBBF24] border-[#FBBF24]'
                  : 'hover:bg-white/5 text-white/50 border-transparent hover:text-white/80 hover:border-white/20'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out" />
                <div className="flex items-center space-x-3 relative z-10">
                  <Icon size={16} className={isActive ? 'text-[#FBBF24]' : ''} />
                  <span>{label}</span>
                </div>
                <ChevronRight
                  size={12}
                  className={`relative z-10 transition-all duration-200 ${
                    isActive ? 'opacity-100 text-[#FBBF24]' : 'opacity-0 group-hover:opacity-40'
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-white/6 pt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-white/40 hover:text-white hover:bg-white/5 rounded-sm transition-all duration-200 group"
        >
          <LogOut size={15} className="group-hover:rotate-12 transition-transform duration-200" />
          <span>Secure Logout</span>
        </button>
      </div>

      <div className="px-7 pb-5 text-center">
        <p className="text-[7px] font-black uppercase tracking-[0.4em] text-white/15">
          Gujrat · 2026
        </p>
      </div>
    </aside>
  );
};

export default AdminSidebar;