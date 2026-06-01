'use client';

import React, { useEffect } from 'react';
import { AlertOctagon, RefreshCw, ArrowLeft } from 'lucide-react';

/**
 * Stop & Shop — Premium Dynamic Error Boundary
 * Implements nextjs-best-practices (using native error.tsx/error.jsx boundary)
 * Captures all children segment crashes and exposes surgical reset recovery triggers.
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    // Log fatal runtime errors securely to diagnostic services
    console.error('[App Segment Error]:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center px-4 bg-gray-50/50">
      <div className="max-w-md w-full bg-white border border-gray-100 rounded-3xl p-8 shadow-xl shadow-gray-100/50 text-center animate-fade-in">
        {/* Warning Icon Envelope */}
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <AlertOctagon className="w-8 h-8 text-[#ba1f3d]" />
        </div>

        {/* Text Headers */}
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ba1f3d] mb-2">
          Operational Error
        </p>
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900 mb-3">
          Something went sideways
        </h1>
        <p className="text-xs text-gray-500 font-bold leading-relaxed mb-8 max-w-sm mx-auto">
          An error occurred while compiling this page segment. The database transaction might have timed out or an element connection lapsed.
        </p>

        {/* Recovery Action Form */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Reset button */}
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-[#ba1f3d] hover:bg-[#a01630] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 shadow-lg shadow-red-200/50"
          >
            <RefreshCw size={12} className="animate-spin [animation-duration:10s]" />
            <span>Try Re-rendering</span>
          </button>

          {/* Go Home button */}
          <a
            href="/"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 border-2 border-gray-200 hover:border-gray-900 text-gray-600 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200"
          >
            <ArrowLeft size={12} />
            <span>Return Home</span>
          </a>
        </div>
      </div>
    </div>
  );
}
