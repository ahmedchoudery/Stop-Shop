import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Settings, 
  Users,
  LogOut,
  ChevronRight,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

const AdminSidebar = () => {
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  };

  const getAdminRole = () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return 'admin';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || 'admin';
    } catch {
      return 'admin';
    }
  };

  const role = getAdminRole();

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/admin/orders', label: 'Orders', icon: <ShoppingBag size={20} /> },
    { to: '/admin/products', label: 'Products', icon: <Package size={20} /> },
    { to: '/admin/users', label: 'Team', icon: <Users size={20} /> },
    ...(role === 'super-admin' || role === 'auditor' ? [{ to: '/admin/audits', label: 'Audits', icon: <ShieldCheck size={20} /> }] : []),
    ...(role === 'super-admin' ? [{ to: '/admin/settings', label: 'Settings', icon: <Settings size={20} /> }] : []),
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#8B0000] text-white flex flex-col shadow-2xl z-20">
      {/* Brand Header */}
      <div className="p-8 border-b border-red-900/50">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Stop & Shop</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-200/60 mt-2 italic">Control Center</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow p-4 mt-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `w-full flex items-center justify-between p-4 font-black uppercase tracking-widest text-[11px] transition-all rounded-sm border-l-4 ${
                isActive 
                  ? 'bg-red-900/50 text-[#FBBF24] border-[#FBBF24] shadow-inner' 
                  : 'hover:bg-red-800 text-red-100 border-transparent'
              }`
            }
          >
            <div className="flex items-center space-x-4">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <ChevronRight size={14} className="opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* RBAC Status Banner */}
      <div className="p-4 mx-4 mb-4 rounded-md border border-red-900/50 bg-black/20">
        <p className="text-[9px] font-black uppercase tracking-widest text-red-200/60 mb-2">Gate Status</p>
        <div className="flex items-center space-x-2">
          {import.meta.env.VITE_RBAC_ENABLED === 'true' ? (
             <ShieldCheck size={14} className="text-green-500" />
          ) : (
             <ShieldAlert size={14} className="text-yellow-500" />
          )}
          <span className={`text-[10px] font-black uppercase tracking-widest ${import.meta.env.VITE_RBAC_ENABLED === 'true' ? 'text-green-500' : 'text-yellow-500'}`}>
            {import.meta.env.VITE_RBAC_ENABLED === 'true' ? `SECURED (${import.meta.env.VITE_RBAC_STAGE || 'PROD'})` : 'DISABLED'}
          </span>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-red-900/50">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-4 p-4 text-[11px] font-black uppercase tracking-widest text-red-200 hover:text-white hover:bg-red-800 transition-all rounded-sm"
        >
          <LogOut size={20} />
          <span>Secure Logout</span>
        </button>
      </div>
      
      {/* Footer Decoration */}
      <div className="p-6 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-red-400 opacity-40">
          Gujarat Edition • 2026
        </p>
      </div>
    </aside>
  );
};

export default AdminSidebar;
