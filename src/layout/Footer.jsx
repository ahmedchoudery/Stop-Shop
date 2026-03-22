import React from 'react';
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, Shield, Truck, RotateCcw, CreditCard } from 'lucide-react';

const TRUST_BADGES = [
  { icon: Shield, label: 'Secure Payment', sub: '256-bit SSL' },
  { icon: Truck, label: 'Free Shipping', sub: 'Orders over ₹2000' },
  { icon: RotateCcw, label: 'Easy Returns', sub: '30-day policy' },
  { icon: CreditCard, label: 'Multiple Payment', sub: 'Card, UPI, COD' },
];

const Footer = () => {
  return (
    <footer className="bg-gray-950 text-white">
      {/* Trust Bar */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-red-900/30 transition-colors flex-shrink-0">
                  <Icon size={22} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-white">{label}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6 md:col-span-1">
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase text-white">STOP & SHOP</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 mt-1">Gujarat Edition</p>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Premium quality clothing for the modern lifestyle. Crafted with precision, worn with purpose.
            </p>
            <div className="flex space-x-3">
              {[
                { Icon: Facebook, href: '#' },
                { Icon: Instagram, href: '#' },
                { Icon: Twitter, href: '#' },
              ].map(({ Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  className="w-9 h-9 bg-white/5 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-gray-500">Shop</h3>
            <ul className="space-y-4">
              {['Tops', 'Bottoms', 'Footwear', 'Accessories', 'New Arrivals', 'Sale'].map(item => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                    className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors uppercase tracking-wide"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-gray-500">Help</h3>
            <ul className="space-y-4">
              {['Shipping Policy', 'Returns & Exchanges', 'Size Guide', 'FAQs', 'Track Order', 'Contact Us'].map(item => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors uppercase tracking-wide"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-gray-500">Visit Us</h3>
            <ul className="space-y-5">
              <li className="flex items-start space-x-3">
                <MapPin size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-500 leading-relaxed">Main Bazaar, Ahmedabad,<br />Gujarat 380054, India</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={16} className="text-red-600 flex-shrink-0" />
                <span className="text-sm text-gray-500">+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={16} className="text-red-600 flex-shrink-0" />
                <span className="text-sm text-gray-500">hello@stop-shop.in</span>
              </li>
            </ul>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center space-x-2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-all"
            >
              <span>💬</span>
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            © 2026 Stop & Shop Clothing. All rights reserved.
          </p>
          <div className="flex items-center space-x-2">
            {/* Payment icons text */}
            <div className="flex space-x-2 text-[9px] font-black text-gray-700 uppercase tracking-wider">
              <span className="bg-white/5 px-2 py-1 rounded">VISA</span>
              <span className="bg-white/5 px-2 py-1 rounded">MASTERCARD</span>
              <span className="bg-white/5 px-2 py-1 rounded">UPI</span>
              <span className="bg-white/5 px-2 py-1 rounded">COD</span>
            </div>
          </div>
          <div className="flex space-x-6 text-[10px] text-gray-600 font-black uppercase tracking-tighter">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;