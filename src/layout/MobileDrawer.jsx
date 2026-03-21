import React from 'react';
import { X, MapPin, ChevronRight } from 'lucide-react';

const MobileDrawer = ({ isOpen, onClose }) => {
  const categories = ['Tops', 'Bottoms', 'Footwear', 'Accessories'];

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-[80%] bg-white z-[101] shadow-2xl transition-transform duration-500 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-black text-red-700 tracking-tighter uppercase">Menu</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-900" />
            </button>
          </div>

          {/* Categories */}
          <nav className="flex-grow py-8 px-6">
            <ul className="space-y-6">
              {categories.map((item) => (
                <li key={item}>
                  <a 
                    href={`#${item.toLowerCase()}`}
                    onClick={onClose}
                    className="flex items-center justify-between text-2xl font-bold text-gray-900 hover:text-red-600 transition-colors py-2"
                  >
                    <span>{item}</span>
                    <ChevronRight size={20} className="text-gray-300" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-8 border-t border-gray-100 bg-gray-50/50">
            <a 
              href="#store-locator"
              onClick={onClose}
              className="flex items-center space-x-3 text-sm font-black text-gray-900 hover:text-red-700 transition-all group"
            >
              <div className="bg-red-100 p-2 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-all">
                <MapPin size={18} className="text-red-600 group-hover:text-white" />
              </div>
              <span className="uppercase tracking-widest">Find Our Store</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;
