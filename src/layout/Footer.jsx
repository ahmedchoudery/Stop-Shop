"use client";

/**
 * @fileoverview Footer — Unified Dark Edition
 * Fix: added proper TikTok SVG icon (replaces broken "TT" text fallback).
 * Minor: refined spacing, improved link hover states, tighter typography.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Link } from '../utils/router-compat.jsx';
import { Facebook, Instagram, MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';

const MANIFESTO =
  'Every piece is a decision. Every purchase is a statement. ' +
  'Stop \u0026 Shop exists for those who choose deliberately.';

// ── TikTok SVG (lucide-react doesn't include this icon) ───────────────
const TikTokIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.85a8.18 8.18 0 004.78 1.53V6.93a4.85 4.85 0 01-1.01-.24z" />
  </svg>
);

const SOCIAL_LINKS = [
  { href: 'https://www.facebook.com/p/StopShop-100088444777668/', label: 'Facebook',  Icon: Facebook,  SvgIcon: null },
  { href: 'https://www.instagram.com/stopshop.701/',              label: 'Instagram', Icon: Instagram, SvgIcon: null },
  { href: 'https://www.tiktok.com/discover/stop-shop-gujrat',    label: 'TikTok',    Icon: null,      SvgIcon: TikTokIcon },
];

const SHOP_LINKS = [
  { label: 'Tops & Shirts', to: '/' },
  { label: 'Bottoms',       to: '/' },
  { label: 'Footwear',      to: '/' },
  { label: 'Accessories',   to: '/' },
  { label: 'New Arrivals',  to: '/' },
];

const HELP_LINKS = [
  { label: 'Track Order', to: '/track'   },
  { label: 'Returns',     to: '/returns' },
  { label: 'Size Guide',  to: '/returns' },
  { label: 'Search',      to: '/search'  },
  { label: 'Contact Us',  to: '/returns' },
];

const CONTACT_INFO = [
  { Icon: MapPin, text: 'Zaib Market, Near Glorious Mall', sub: 'Gujrat, Punjab, Pakistan' },
  { Icon: Phone,  text: '0306-8458655',                   sub: 'Mon–Sat, 10am–8pm'        },
  { Icon: Mail,   text: 'concierge@stop-shop.pk',         sub: null                        },
];

const PAYMENT_METHODS = ['JazzCash', 'Easypaisa', 'ATM Card', 'Bank Transfer', 'COD'];

// ── Nav link helper ───────────────────────────────────────────────────
const FooterLink = ({ to, children }) => (
  <Link
    to={to}
    className="group flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#555] hover:text-white transition-colors duration-250"
  >
    <span className="w-0 h-px bg-[#ba1f3d] group-hover:w-3 transition-all duration-300 flex-shrink-0" />
    {children}
  </Link>
);

// ── Footer ────────────────────────────────────────────────────────────
const Footer = () => {
  const borderRef = useRef(null);
  const year = new Date().getFullYear();

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

      {/* ── Animated separator ───────────────────────────────────── */}
      <div
        ref={borderRef}
        className="h-px bg-[#1a1a1a] origin-left"
        style={{ transform: 'scaleX(0)', transition: 'transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
        aria-hidden="true"
      />

      {/* ── Main Grid ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-20 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-14 gap-x-8">

          {/* ── Brand Block ─────────── */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-block mb-7" aria-label="Stop & Shop home">
              <span className="text-2xl font-black italic uppercase tracking-tighter text-[#ba1f3d]">
                Stop<span className="text-white not-italic">&</span>Shop
              </span>
            </Link>

            <p className="text-[11px] text-[#444] leading-relaxed mb-9 max-w-[260px] font-medium">
              Premium clothing for those who demand excellence in every thread.
              Gujrat, Pakistan.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2.5">
              {SOCIAL_LINKS.map(({ href, label, Icon, SvgIcon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group w-9 h-9 border border-[#1a1a1a] flex items-center justify-center text-[#444] hover:border-[#333] hover:text-white transition-all duration-300"
                >
                  {SvgIcon ? (
                    <SvgIcon size={14} />
                  ) : Icon ? (
                    <Icon size={14} />
                  ) : null}
                </a>
              ))}
            </div>
          </div>

          {/* ── Shop ────────────────── */}
          <div className="lg:col-span-2">
            <h4 className="text-[8px] font-black uppercase tracking-[0.55em] text-[#333] mb-7">
              Shop
            </h4>
            <ul className="space-y-4">
              {SHOP_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <FooterLink to={to}>{label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Help ────────────────── */}
          <div className="lg:col-span-2">
            <h4 className="text-[8px] font-black uppercase tracking-[0.55em] text-[#333] mb-7">
              Help
            </h4>
            <ul className="space-y-4">
              {HELP_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <FooterLink to={to}>{label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact ─────────────── */}
          <div className="lg:col-span-4">
            <h4 className="text-[8px] font-black uppercase tracking-[0.55em] text-[#333] mb-7">
              Visit Us
            </h4>

            <div className="space-y-5">
              {CONTACT_INFO.map(({ Icon, text, sub }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-7 h-7 border border-[#1a1a1a] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={11} className="text-[#444]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#777]">{text}</p>
                    {sub && (
                      <p className="text-[9px] text-[#3a3a3a] font-medium mt-0.5">{sub}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/923068458655"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-9 inline-flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.3em] text-[#25D366] border border-[#25D366]/15 px-5 py-3 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all duration-300"
            >
              <span>Chat on WhatsApp</span>
              <ArrowUpRight size={10} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Colophon ─────────────────────────────────────────────── */}
      <div className="border-t border-[#141414]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">

          <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-[#2a2a2a] max-w-sm leading-relaxed">
            {MANIFESTO}
          </p>

          <div className="flex flex-col sm:items-end gap-3 flex-shrink-0">
            {/* Payment methods */}
            <div className="flex items-center flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <span
                  key={m}
                  className="text-[7px] font-black uppercase tracking-widest text-[#2a2a2a] border border-[#1a1a1a] px-2.5 py-1"
                >
                  {m}
                </span>
              ))}
            </div>
            {/* Copyright */}
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#222]">
              © {year} Stop &amp; Shop · Gujrat, Pakistan
            </p>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;