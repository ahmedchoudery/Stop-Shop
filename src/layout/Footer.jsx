import React from 'react';
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-950 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black tracking-tighter uppercase">STOP & SHOP</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Premium quality clothing for the modern lifestyle. Based in Gujarat, serving the style-conscious.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-red-500 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="hover:text-red-500 transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-red-500 transition-colors"><Twitter size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-gray-500">Shop</h3>
            <ul className="space-y-4 text-sm font-bold">
              <li><a href="#tops" className="hover:text-red-500 transition-colors">Tops</a></li>
              <li><a href="#bottoms" className="hover:text-red-500 transition-colors">Bottoms</a></li>
              <li><a href="#footwear" className="hover:text-red-500 transition-colors">Footwear</a></li>
              <li><a href="#accessories" className="hover:text-red-500 transition-colors">Accessories</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-gray-500">Support</h3>
            <ul className="space-y-4 text-sm font-bold">
              <li><a href="#" className="hover:text-red-500 transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Returns & Exchanges</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">FAQs</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-gray-500">Visit Us</h3>
            <ul className="space-y-4 text-sm font-bold">
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-red-600 mt-0.5" />
                <span className="text-gray-400 font-medium">Main Bazaar, Ahmedabad,<br />Gujarat, India</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-red-600" />
                <span className="text-gray-400 font-medium">+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-red-600" />
                <span className="text-gray-400 font-medium">hello@stop-shop.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">
            © 2026 STOP & SHOP Clothing. All rights reserved.
          </p>
          <div className="flex space-x-6 text-[10px] text-gray-600 font-black uppercase tracking-tighter">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
