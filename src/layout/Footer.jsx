/**
 * Footer — Premium Minimalist Edition
 * Surgical grid, razor-thin dividers, Cardinal Red accents as status signals.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100">
      {/* ── Main Grid ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-20 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-16 gap-x-8">

          {/* Brand Block — 4 cols */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-block mb-8">
              <span className="text-2xl font-black italic uppercase tracking-tighter text-[#ba1f3d]">
                Stop<span className="text-gray-900 not-italic">&</span>Shop
              </span>
            </Link>

            <p className="text-sm text-gray-500 leading-relaxed mb-10 max-w-[280px]">
              Premium clothing for those who demand excellence in every thread.
              Gujrat, Pakistan.
            </p>

            {/* Social */}
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
                  className="w-9 h-9 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#ba1f3d] hover:text-[#ba1f3d] transition-all duration-300 group"
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
            <h4 className="text-[8px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-7">
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
                    className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors duration-200 uppercase tracking-[0.15em]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help — 2 cols */}
          <div className="lg:col-span-2">
            <h4 className="text-[8px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-7">
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
                    className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors duration-200 uppercase tracking-[0.15em]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — 4 cols */}
          <div className="lg:col-span-4">
            <h4 className="text-[8px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-7">
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
                  <div className="w-7 h-7 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={12} className="text-[#ba1f3d]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{text}</p>
                    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/923068458655"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#25D366] border border-[#25D366]/30 px-4 py-2.5 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all duration-300"
            >
              <span>Chat on WhatsApp</span>
              <ArrowUpRight size={11} />
            </a>
          </div>
        </div>

        {/* ── Bottom Bar ──────────────────────────────────── */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">

          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.4em]">
            © {year} Stop & Shop · Gujrat, Pakistan
          </p>

          {/* Payment badges */}
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
            {['JazzCash', 'Easypaisa', 'ATM Card', 'Bank Transfer', 'COD'].map(m => (
              <span
                key={m}
                className="text-[7px] font-black uppercase tracking-widest text-gray-400 border border-gray-100 px-2 py-1"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;