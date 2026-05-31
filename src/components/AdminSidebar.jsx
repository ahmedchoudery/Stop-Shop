/**
 * @fileoverview AdminSidebar — Fixed sidebar navigation for the admin dashboard.
 * Uses NavLink (no Router) — it lives inside the App's existing Router.
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

const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col z-40">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="text-lg font-black italic uppercase tracking-tighter text-[#ba1f3d]">
          Stop & Shop
        </h1>
        <div className="flex items-center space-x-1.5 mt-1">
          <Shield size={10} className="text-gray-500" />
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500">
            Admin Panel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-[#ba1f3d] text-white shadow-lg shadow-[#ba1f3d]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
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
          className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;