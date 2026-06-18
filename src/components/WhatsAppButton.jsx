/**
 * @fileoverview WhatsAppButton.jsx
 * Floating WhatsApp button — visible only when viewing the homepage hero section.
 * Vanishes when the user scrolls past the hero section.
 *
 * Applies: design-spells (spring entrance, pulse ring, tooltip on hover, active-scale tap response)
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from '../utils/router-compat.jsx';

// ── Config — country code + number, no + or spaces ────────────────
const WHATSAPP_NUMBER = '923068458655';
const DEFAULT_MESSAGE = "Hi! I'm shopping at Stop & Shop and need some help. 🛍️";

const WhatsAppButton = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [isInHero, setIsInHero] = useState(true);
  const [tooltip, setTooltip] = useState(false);

  const isHomePage = location.pathname === '/';

  // Delayed entrance — appear shortly after homepage loads
  useEffect(() => {
    if (!isHomePage) return;
    const t1 = setTimeout(() => setVisible(true), 500);
    return () => { clearTimeout(t1); };
  }, [isHomePage]);

  // Track scroll position compared to hero section height
  useEffect(() => {
    if (!isHomePage) return;

    const handleScroll = () => {
      const hero = document.getElementById('hero-section');
      const heroHeight = hero ? hero.offsetHeight : window.innerHeight;

      // The button stays visible only within the hero section height
      if (window.scrollY < heroHeight - 80) {
        setIsInHero(true);
      } else {
        setIsInHero(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  if (!isHomePage) return null;

  const handleClick = () => {
    const encoded = encodeURIComponent(DEFAULT_MESSAGE);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* ── Floating Button ──────────────────────────────────── */}
      <div
        className={`
          fixed bottom-6 md:bottom-8 right-4 md:right-8 z-[999]
          transition-all duration-500 ease-in-out active-scale
          ${visible && isInHero
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-12 pointer-events-none'
          }
        `}
        style={{ willChange: 'transform, opacity' }}
      >
        {/* Tooltip */}
        <div
          className={`
            absolute bottom-full right-0 mb-3 whitespace-nowrap
            bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest
            px-4 py-2.5 rounded-[4px] shadow-md
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

        {/* Button */}
        <button
          onClick={handleClick}
          onMouseEnter={() => setTooltip(true)}
          onMouseLeave={() => setTooltip(false)}
          aria-label="Chat on WhatsApp"
          className="
            relative w-14 h-14 rounded-[4px]
            bg-white border border-gray-200
            flex items-center justify-center
            transition-all duration-300
            hover:bg-gray-50 hover:scale-105 active:scale-95
            shadow-[0_4px_12px_rgba(0,0,0,0.03)]
          "
          style={{ willChange: 'transform' }}
        >
          {/* WhatsApp SVG icon */}
          <svg
            viewBox="0 0 24 24"
            fill="#346538"
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