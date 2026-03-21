import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Persistent Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-grow ml-64 bg-white flex flex-col min-w-0 min-h-screen">
        <section className="flex-grow p-10 bg-white">
          <Outlet />
        </section>
        
        {/* Global Admin Footer */}
        <footer className="p-8 border-t border-gray-50 bg-white text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
            Stop & Shop Logistics Infrastructure • Verified Secure
          </p>
        </footer>
      </main>
    </div>
  );
};

export default AdminDashboard;
;
