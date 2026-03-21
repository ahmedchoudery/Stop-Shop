import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import AnnouncementBar from '../components/AnnouncementBar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-red-100 selection:text-red-900">
      <AnnouncementBar />
      {/* Sticky Navbar at the top */}
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      {/* Main Content Area - bg-white and min-h-screen ensures footer stays at bottom */}
      <main className="flex-grow bg-white">
        {children}
      </main>

      {/* Footer at the bottom */}
      <Footer />
    </div>
  );
};

export default Layout;
