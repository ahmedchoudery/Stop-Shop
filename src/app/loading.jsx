import React from 'react';

/**
 * Stop & Shop — Premium Editorial Global Loader
 * Implements nextjs-best-practices (using native loading.tsx/loading.jsx)
 * Establishes instant visual response for slow server-side DB connections.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#F7F6F3] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-6 text-center">
        {/* Brand initials */}
        <div className="text-lg font-black uppercase tracking-[0.3em] text-[#111111]">
          Stop & Shop
        </div>

        {/* Minimal linear loader */}
        <style>{`
          @keyframes loading-slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
        <div className="w-48 h-[2px] bg-gray-200 overflow-hidden relative">
          <div 
            className="absolute inset-y-0 w-1/2 bg-gray-900" 
            style={{ 
              animation: 'loading-slide 1.5s infinite ease-in-out',
              willChange: 'transform' 
            }} 
          />
        </div>

        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">
          Loading
        </p>
      </div>
    </div>
  );
}
