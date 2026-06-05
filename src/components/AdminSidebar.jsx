/**
 * @fileoverview AdminSidebar — Fixed sidebar on desktop, slide-in drawer on mobile.
 * Props:
 *   mobileOpen  (bool)   — whether the mobile drawer is visible
 *   onClose     (fn)     — called when the drawer should be closed
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Settings,
  FileText,
  Tag,
  BarChart3,
  Star,
  LogOut,
  Shield,
  X,
} from 'lucide-react';
import { clearToken } from '../lib/auth.js';

const NAV_ITEMS = [
  { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/orders',     icon: ShoppingCart,    label: 'Orders' },
  { to: '/admin/products',   icon: Package,         label: 'Products' },
  { to: '/admin/inventory',  icon: Boxes,           label: 'Inventory' },
  { to: '/admin/analytics',  icon: BarChart3,       label: 'Analytics' },
  { to: '/admin/coupons',    icon: Tag,             label: 'Coupons' },
  { to: '/admin/reviews',    icon: Star,            label: 'Reviews' },
  { to: '/admin/users',      icon: Users,           label: 'Users' },
  { to: '/admin/audits',     icon: FileText,        label: 'Audit Log' },
  { to: '/admin/settings',   icon: Settings,        label: 'Settings' },
];

const SidebarContent = ({ onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/login', { replace: true });
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black italic uppercase tracking-tighter text-cardinal">
            Stop &amp; Shop
          </h1>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <Shield size={9} className="text-gray-500" />
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500">
              Admin Panel
            </p>
          </div>
        </div>
        {/* Close button — visible only on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-black hover:bg-white/10 transition-all"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-cardinal text-white shadow-lg shadow-cardinal/30'
                  : 'text-gray-400 hover:text-black hover:bg-white/8'
              }`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const AdminSidebar = ({ mobileOpen = false, onClose }) => {
  return (
    <>
      {/* ── Desktop: fixed sidebar ─────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-gray-900 text-black flex-col z-40">
        <SidebarContent />
      </aside>

      {/* ── Mobile: slide-in drawer ────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-72 bg-gray-900 text-black z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onClose={onClose} />
      </aside>
    </>
  );
};

export default AdminSidebar;