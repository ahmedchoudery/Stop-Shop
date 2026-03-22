import React, { useEffect, useState } from 'react';
import { X, CheckCircle, ShoppingBag } from 'lucide-react';

const Toast = ({ message, onClose, onViewCart }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 4000;
    const interval = 50;
    const step = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) { clearInterval(timer); return 0; }
        return prev - step;
      });
    }, interval);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed top-5 right-5 z-[200] animate-slide-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-80">
        {/* Progress bar */}
        <div
          className="h-0.5 bg-green-500 transition-all duration-50 ease-linear"
          style={{ width: `${progress}%` }}
        />

        <div className="p-4 flex items-start space-x-3">
          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle size={18} className="text-green-600" />
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-sm font-black text-gray-900 leading-tight">Added to Cart!</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{message.replace('Added ', '').replace(' to cart!', '')}</p>
            <button
              onClick={onViewCart}
              className="mt-2 flex items-center space-x-1.5 text-[11px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors"
            >
              <ShoppingBag size={11} />
              <span>View Cart</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-300 hover:text-gray-600 transition-colors flex-shrink-0 rounded-lg hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;