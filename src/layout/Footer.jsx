"use client";

/**
 * @fileoverview Footer — Unified Dark Edition
 * Theme: Full dark, section headers neutral grey, social icons white hover.
 * Cardinal Red: logo only.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Link } from '../utils/router-compat.jsx';
import { Facebook, Instagram, MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';

const MANIFESTO =
  'Every piece is a decision. Every purchase is a statement. ' +
  'Stop \u0026 Shop exists for those who choose deliberately.';

const Footer = () => {
  const borderRef = useRef(null);
  const year = new Date().getFullYear();

  // Subtle white border draw on scroll into view
  const observeBorder = useCallback(() => {
    const el = borderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transform = 'scaleX(1)';
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(observeBorder, [observeBorder]);

  return (
    <footer className="bg-[#0d0d0d]" aria-label="Site footer">

      {/* ── Thin white separator ─────────────────────────────── */}
      <div
        ref={borderRef}
        className="h-px bg-[#1f1f1f] origin-left"
        style={{
          transform: 'scaleX(0)',
          transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        aria-hidden="true"
      />

      {/* ── Main Grid ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-20 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-16 gap-x-8">

          {/* Brand Block — 4 cols */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-block mb-8" aria-label="Stop & Shop home">
              {/* Logo — red stays (brand) */}
              <span className="text-2xl font-black italic uppercase tracking-tighter text-[#ba1f3d]">
                Stop<span className="text-white not-italic">&</span>Shop
              </span>
            </Link>

            <p className="text-sm text-[#555] leading-relaxed mb-10 max-w-[280px]">
              Premium clothing for those who demand excellence in every thread.
              Gujrat, Pakistan.
            </p>

            {/* Social — hover white */}
            <div className="flex items-center space-x-3">
              {[
                { href: 'https://www.facebook.com/p/StopShop-100088444777668/', label: 'Facebook', Icon: Facebook },
                { href: 'https://www.instagram.com/stopshop.701/', label: 'Instagram', Icon: Instagram },
                { href: 'https://www.tiktok.com/discover/stop-shop-gujrat', label: 'TikTok', Icon: null },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 border border-[#1f1f1f] flex items-center justify-center text-[#555] hover:border-[#444] hover:text-white transition-all duration-300"
                >
                  {Icon
                    ? <Icon size={14} />
                    : <span className="text-[8px] font-black tracking-wider">TT</span>
                  }
                </a>
              ))}
            </div>
          </div>

          {/* Collections — 2 cols */}
          <div className="lg:col-span-2">
            <h4 className="text-[8px] font-black uppercase tracking-[0.5em] text-[#444] mb-7">
              Shop
            </h4>
            <ul className="space-y-4">
              {[
                { label: 'Tops & Shirts', to: '/' },
                { label: 'Bottoms', to: '/' },
                { label: 'Footwear', to: '/' },
                { label: 'Accessories', to: '/' },
                { label: 'New Arrivals', to: '/' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-xs font-bold text-[#555] hover:text-white transition-colors duration-200 uppercase tracking-[0.15em]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help — 2 cols */}
          <div className="lg:col-span-2">
            <h4 className="text-[8px] font-black uppercase tracking-[0.5em] text-[#444] mb-7">
              Help
            </h4>
            <ul className="space-y-4">
              {[
                { label: 'Track Order', to: '/track' },
                { label: 'Returns', to: '/returns' },
                { label: 'Size Guide', to: '/returns' },
                { label: 'Search', to: '/search' },
                { label: 'Contact Us', to: '/returns' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-xs font-bold text-[#555] hover:text-white transition-colors duration-200 uppercase tracking-[0.15em]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — 4 cols */}
          <div className="lg:col-span-4">
            <h4 className="text-[8px] font-black uppercase tracking-[0.5em] text-[#444] mb-7">
              Visit Us
            </h4>

            <div className="space-y-5">
              {[
                {
                  Icon: MapPin,
                  text: 'Zaib Market, Near Glorious Mall',
                  sub: 'Gujrat, Punjab, Pakistan',
                },
                { Icon: Phone, text: '0306-8458655', sub: 'Mon–Sat, 10am–8pm' },
                { Icon: Mail, text: 'concierge@stop-shop.pk', sub: null },
              ].map(({ Icon, text, sub }) => (
                <div key={text} className="flex items-start space-x-3">
                  <div className="w-7 h-7 border border-[#1f1f1f] flex items-center justify-center flex-shrink-0">
                    <Icon size={12} className="text-[#555]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#888]">{text}</p>
                    {sub && <p className="text-[10px] text-[#444] mt-0.5">{sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp CTA — stays green (brand colour) */}
            <a
              href="https://wa.me/923068458655"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#25D366] border border-[#25D366]/20 px-4 py-2.5 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all duration-300"
            >
              <span>Chat on WhatsApp</span>
              <ArrowUpRight size={11} />
            </a>
          </div>
        </div>
      </div>

      {/* ── Colophon strip ──────────────────────────────────── */}
      <div className="border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#333] max-w-md leading-relaxed">
            {MANIFESTO}
          </p>

          <div className="flex flex-col sm:items-end gap-3 flex-shrink-0">
            <div className="flex items-center flex-wrap gap-1.5">
              {['JazzCash', 'Easypaisa', 'ATM Card', 'Bank Transfer', 'COD'].map(m => (
                <span
                  key={m}
                  className="text-[7px] font-black uppercase tracking-widest text-[#333] border border-[#222] px-2 py-1"
                >
                  {m}
                </span>
              ))}
            </div>
            <p className="text-[8px] font-bold uppercase tracking-[0.35em] text-[#2a2a2a]">
              © {year} Stop &amp; Shop · Gujrat, Pakistan
            </p>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;