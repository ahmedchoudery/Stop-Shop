import React from 'react';

/**
 * Stop & Shop — Premium Editorial Global Loader
 * Implements nextjs-best-practices (using native loading.tsx/loading.jsx)
 * Establishes instant visual response for slow server-side DB connections.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
      {/* Decorative Brand Accent (Top pulsing strip) */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-100 via-[#ba1f3d] to-red-100 animate-pulse" />

      {/* Main Loader Content */}
      <div className="flex flex-col items-center space-y-6 max-w-xs text-center px-6">
        {/* Pulsing editorial brand initials */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full border border-gray-100 flex items-center justify-center shadow-lg shadow-gray-100/50 bg-white/80 backdrop-blur-md animate-scale">
            <span className="text-xl font-black italic text-[#ba1f3d] tracking-tighter">S</span>
            <span className="text-xs text-gray-400 font-bold mx-0.5">&</span>
            <span className="text-xl font-black italic text-[#ba1f3d] tracking-tighter">S</span>
          </div>
          {/* External animated orbit ring */}
          <div className="absolute -inset-1 border border-[#ba1f3d]/20 rounded-full animate-spin [animation-duration:3s]" />
        </div>

        {/* Minimal text loading feedback */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-900 mb-1">
            Deliberating Style
          </h2>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
            Acquiring premium items...
          </p>
        </div>
      </div>
    </div>
  );
}
