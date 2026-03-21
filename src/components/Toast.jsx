import React from 'react';
import { X, CheckCircle } from 'lucide-react';

const Toast = ({ message, onClose, onViewCart }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-in">
      <div className="bg-white border-l-4 border-green-500 shadow-2xl rounded-lg p-4 flex items-center space-x-4 max-w-sm">
        <div className="flex-shrink-0 text-green-500">
          <CheckCircle size={24} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">{message}</p>
          <button 
            onClick={onViewCart}
            className="text-yellow-600 hover:text-yellow-700 text-xs font-bold uppercase tracking-wider mt-1 block transition-colors"
          >
            View Cart 🟡
          </button>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
