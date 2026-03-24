import React from 'react';
import { X, MapPin, ChevronRight } from 'lucide-react';

const MobileDrawer = ({ isOpen, onClose }) => {
  const categories = ['Tops', 'Bottoms', 'Footwear', 'Accessories'];
  const CARDINAL = '#ba1f3d';

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[100] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-[85%] sm:w-[400px] bg-white z-[101] shadow-2xl transition-transform duration-700 cubic-bezier(0.23, 1, 0.32, 1) transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h2 className="text-2xl font-black tracking-tighter uppercase" style={{ color: CARDINAL }}>
              Menu
            </h2>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={24} className="text-gray-900" />
            </button>
          </div>

          {/* Categories */}
          <nav className="flex-grow py-10 px-8">
            <ul className="space-y-8">
              {['Home', ...categories].map((item, i) => (
                <li key={item} className={`transform transition-all duration-700 delay-[${i * 50}ms] ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}>
                  <a 
                    href={item === 'Home' ? '/' : `#${item.toLowerCase()}`}
                    onClick={onClose}
                    className="flex items-center justify-between text-3xl font-black text-gray-900 hover:text-[#ba1f3d] transition-colors py-2 uppercase tracking-tighter"
                  >
                    <span>{item}</span>
                    <ChevronRight size={24} className="text-gray-200" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-10 border-t border-gray-50 bg-gray-50/50">
            <a 
              href="#store-locator"
              onClick={onClose}
              className="flex items-center space-x-4 text-sm font-black text-gray-900 hover:text-[#ba1f3d] transition-all group"
            >
              <div className="bg-[#ba1f3d]/5 p-3 rounded-2xl group-hover:bg-[#ba1f3d] group-hover:text-white transition-all">
                <MapPin size={20} className="text-[#ba1f3d] group-hover:text-white" />
              </div>
              <span className="uppercase tracking-[0.3em]">Store Locator</span>
            </a>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mt-8">Stop & Shop Pakistan Edition</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;
