/**
 * @fileoverview WhatsAppButton.jsx
 * Floating WhatsApp button — fixed bottom-right on all storefront pages.
 * Tapping opens WhatsApp with a pre-filled message.
 * Hidden on admin pages automatically.
 *
 * Applies: design-spells (spring entrance, pulse ring, tooltip on hover)
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ── Config — change these to your actual WhatsApp number ──────────
const WHATSAPP_NUMBER = '923068458655'; // Format: country code + number, no + or spaces
const DEFAULT_MESSAGE = "Hi! I'm shopping at Stop & Shop and need some help. 🛍️";

const WhatsAppButton = () => {
  const location  = useLocation();
  const [visible, setVisible]   = useState(false);
  const [tooltip, setTooltip]   = useState(false);
  const [pulse,   setPulse]     = useState(false);

  // Hide on admin and login pages
  const isAdminPage = location.pathname.startsWith('/admin') ||
                      location.pathname === '/login';

  // Delayed entrance — appear 2s after page load
  useEffect(() => {
    if (isAdminPage) return;
    const t1 = setTimeout(() => setVisible(true), 2000);
    const t2 = setTimeout(() => setPulse(true),   4000); // Start pulse ring after 4s
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isAdminPage]);

  if (isAdminPage) return null;

  const handleClick = () => {
    const encoded = encodeURIComponent(DEFAULT_MESSAGE);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* ── Floating Button ──────────────────────────────────── */}
      <div
        className={`
          fixed bottom-6 right-6 z-[999]
          transition-all duration-700
          ${visible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8 pointer-events-none'
          }
        `}
        style={{ willChange: 'transform, opacity' }}
      >
        {/* Tooltip */}
        <div
          className={`
            absolute bottom-full right-0 mb-3 whitespace-nowrap
            bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest
            px-4 py-2.5 rounded-xl shadow-xl
            transition-all duration-300
            ${tooltip
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 pointer-events-none'
            }
          `}
        >
          Chat with us on WhatsApp
          {/* Arrow */}
          <div className="absolute bottom-0 right-5 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
        </div>

        {/* Pulse ring — attention grabber */}
        {pulse && (
          <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30 pointer-events-none" />
        )}

        {/* Button */}
        <button
          onClick={handleClick}
          onMouseEnter={() => setTooltip(true)}
          onMouseLeave={() => setTooltip(false)}
          aria-label="Chat on WhatsApp"
          className="
            relative w-14 h-14 rounded-full
            bg-[#25D366] hover:bg-[#20ba58]
            shadow-[0_8px_30px_rgba(37,211,102,0.4)]
            hover:shadow-[0_12px_40px_rgba(37,211,102,0.6)]
            flex items-center justify-center
            transition-all duration-300
            hover:scale-110 active:scale-95
          "
          style={{ willChange: 'transform' }}
        >
          {/* WhatsApp SVG icon */}
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-7 h-7"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </button>
      </div>
    </>
  );
};

export default WhatsAppButton;