'use client';

import React, { useEffect } from 'react';
import { AlertOctagon, RefreshCw, ArrowLeft } from 'lucide-react';

/**
 * Stop & Shop — Premium Dynamic Error Boundary
 * Implements nextjs-best-practices (using native error.tsx/error.jsx boundary)
 * Captures all children segment crashes and exposes reset recovery triggers.
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[App Segment Error]:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center px-4 bg-[#F7F6F3]">
      <div className="max-w-md w-full bg-white border border-gray-100 rounded-[4px] p-8 shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-center animate-fade-in">
        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-[4px] bg-[#FDEBEC] flex items-center justify-center mx-auto mb-6">
          <AlertOctagon className="w-6 h-6 text-[#9F2F2D]" />
        </div>

        {/* Text Headers */}
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#9F2F2D] mb-2">
          Operational Error
        </p>
        <h1 className="text-lg font-black uppercase tracking-[0.1em] text-gray-900 mb-3">
          An error occurred
        </h1>
        <p className="text-xs text-gray-500 font-bold leading-relaxed mb-8 max-w-sm mx-auto">
          We encountered an issue loading this section. Please try re-rendering or return to the home page.
        </p>

        {/* Recovery Action Form */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Reset button */}
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-[4px] transition-all duration-200"
          >
            <RefreshCw size={12} />
            <span>Try Re-rendering</span>
          </button>

          {/* Go Home button */}
          <a
            href="/"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 border border-gray-200 hover:border-gray-900 text-gray-600 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-[4px] transition-all duration-200"
          >
            <ArrowLeft size={12} />
            <span>Return Home</span>
          </a>
        </div>
      </div>
    </div>
  );
}
