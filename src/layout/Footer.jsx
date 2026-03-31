/**
 * @fileoverview Footer — Design Spells Edition
 * Applies: animejs-animation (scroll-triggered reveal), design-spells (underline draw on links),
 *          design-md (Cardinal Red system, editorial spacing, brand voice)
 */

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, MapPin, Phone, Mail, ShieldCheck } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';
import { useIntersectionObserver } from '../hooks/useUtils.js';

const Footer = () => {
  const year = new Date().getFullYear();
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });
  const hasAnimated = useRef(false);
  const colsRef = useRef(null);

  useEffect(() => {
    if (!isIntersecting || hasAnimated.current || !colsRef.current) return;
    hasAnimated.current = true;

    let anime;
    try { anime = require('animejs').default ?? require('animejs'); } catch { return; }

    const cols = colsRef.current.querySelectorAll('[data-footer-col]');
    anime.set(cols, { opacity: 0, translateY: 30 });
    anime({
      targets: cols,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 700,
      delay: anime.stagger(100),
      easing: EASING.FABRIC,
    });
  }, [isIntersecting]);

  return (
    <footer ref={ref} className="bg-white border-t border-gray-100 text-gray-900 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Main columns */}
        <div ref={colsRef} className="grid grid-cols-1 md:grid-cols-4 gap-14 mb-20">

          {/* Brand Column */}
          <div data-footer-col className="md:col-span-1" style={{ opacity: 0 }}>
            <Link to="/" className="inline-block mb-6 group">
              <span className="text-3xl font-black italic uppercase tracking-tighter text-[#ba1f3d] group-hover:opacity-80 transition-opacity">
                Stop<span className="text-gray-900 not-italic mx-0.5">&</span>Shop
              </span>
            </Link>
            <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8 max-w-xs">
              The pinnacle of Pakistani craft. Dedicated to those who demand excellence in every fiber.
            </p>
            <div className="flex space-x-3">
              {[
                { href: 'https://www.facebook.com/p/StopShop-100088444777668/', Icon: Facebook, label: 'Facebook' },
                { href: 'https://www.instagram.com/stopshop.701/', Icon: Instagram, label: 'Instagram' },
                { href: 'https://www.tiktok.com/discover/stop-shop-gujrat', icon: 'TT', label: 'TikTok' },
              ].map(({ href, Icon, icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#ba1f3d] hover:text-white hover:border-[#ba1f3d] transition-all duration-300 hover:-translate-y-1 group"
                >
                  {Icon ? (
                    <Icon size={16} />
                  ) : (
                    <span className="text-[9px] font-black">{icon}</span>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Collections */}
          <div data-footer-col style={{ opacity: 0 }}>
            <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ba1f3d] mb-8">
              Collections
            </h4>
            <ul className="space-y-4">
              {['Tops & Shirts', 'Bottoms & Denim', 'Footwear', 'Accessories'].map(item => (
                <li key={item}>
                  <Link
                    to="/"
                    className="text-xs font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.2em] underline-draw"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Experience */}
          <div data-footer-col style={{ opacity: 0 }}>
            <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ba1f3d] mb-8">
              Experience
            </h4>
            <ul className="space-y-4">
              {['Track Order', 'Returns & Exchange', 'Size Guide', 'Care Instructions'].map(item => (
                <li key={item}>
                  <Link
                    to="/"
                    className="text-xs font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.2em] underline-draw"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div
            data-footer-col
            className="bg-gray-50 p-8 border border-gray-100"
            style={{ opacity: 0 }}
          >
            <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ba1f3d] mb-7">
              Pakistan HQ
            </h4>
            <div className="space-y-5">
              {[
                { Icon: MapPin, text: 'Zaib Market, Near Glorious Mall, Gujrat' },
                { Icon: Phone, text: '0306-84586556' },
                { Icon: Mail, text: 'concierge@stop-shop.pk' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-start space-x-3">
                  <Icon size={16} className="text-[#ba1f3d] mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-tight leading-relaxed">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-6">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em]">
              © {year} Stop & Shop · Pakistan Edition
            </p>
            <div className="hidden sm:flex items-center space-x-2">
              <ShieldCheck size={12} className="text-[#ba1f3d]" />
              <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.3em]">
                Encrypted Checkout
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 opacity-50 grayscale">
            {['JazzCash', 'EasyPaisa', 'COD'].map(method => (
              <span key={method} className="text-[8px] font-black uppercase tracking-widest text-gray-600 border border-gray-300 px-2 py-1">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;