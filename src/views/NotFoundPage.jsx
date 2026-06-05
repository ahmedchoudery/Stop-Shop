/**
 * @fileoverview NotFoundPage — 404 error page.
 *
 * Preserves the editorial aesthetic: oversized 404 wall-text in
 * gray-50 acts as pure typographic texture behind the centered
 * "Page Not Found" headline. Cardinal Red CTA returns to home.
 *
 * Extracted from App.jsx inline JSX to enable lazy code-splitting
 * and keep the routing table clean (frontend-dev-guidelines §3).
 */

import React from 'react';
import { Link } from '../utils/router-compat.jsx';

const NotFoundPage = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-center px-6">
      {/* Oversized wall-text 404 — pure typographic texture */}
      <h1
        className="font-black text-gray-50 leading-none select-none"
        style={{ fontSize: 'clamp(100px, 20vw, 180px)' }}
        aria-hidden="true"
      >
        404
      </h1>

      {/* Actual heading for screen readers */}
      <p className="text-xl font-black uppercase tracking-tighter text-gray-900 mt-4">
        Page Not Found
      </p>

      {/* Sub-label — brand voice, not generic "oops" */}
      <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest font-black">
        The design doesn&apos;t exist here.
      </p>

      {/* CTA — Cardinal Red, matching primary button spec from DESIGN.md */}
      <Link
        to="/"
        className="mt-10 inline-flex items-center space-x-2 px-10 py-5 bg-cardinal text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-gray-900 transition-all duration-300 shadow-xl"
      >
        <span>Return Home</span>
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
