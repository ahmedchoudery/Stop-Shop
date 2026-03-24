import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, ShieldCheck, CreditCard, Globe } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const CARDINAL = '#ba1f3d';

  return (
    <footer className="bg-white border-t border-gray-100 text-gray-900 pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          
          {/* Brand Col */}
          <div className="flex flex-col md:col-span-1">
            <Link to="/" className="text-3xl font-black tracking-tighter mb-8 uppercase" style={{ color: CARDINAL }}>
              STOP<span className="text-gray-900 ml-1">&</span>SHOP
            </Link>
            <p className="text-gray-500 text-sm font-medium leading-relaxed mb-10 max-w-xs">
              The pinnacle of Pakistani craft. Dedicated to those who demand excellence in every fiber. Experience the Power of Choice.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/p/StopShop-100088444777668/" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 text-gray-900 hover:bg-[#ba1f3d] hover:text-white transition-all rounded-none hover:-translate-y-1">
                <Facebook size={18} />
              </a>
              <a href="https://www.instagram.com/stopshop.701/" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 text-gray-900 hover:bg-[#ba1f3d] hover:text-white transition-all rounded-none hover:-translate-y-1">
                <Instagram size={18} />
              </a>
              <a href="https://www.tiktok.com/discover/stop-shop-gujrat" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 text-gray-900 hover:bg-[#ba1f3d] hover:text-white transition-all rounded-none hover:-translate-y-1">
                <span className="text-[10px] font-black tracking-tight">TikTok</span>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ba1f3d] mb-10">Collections</h4>
            <ul className="space-y-6">
              {['Tops', 'Bottoms', 'Footwear', 'Accessories'].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-xs font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.2em]">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Experience */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ba1f3d] mb-10">Experience</h4>
            <ul className="space-y-6">
              {['Orders', 'Returns', 'Sizing', 'Concierge'].map((item) => (
                <li key={item}><Link to="#" className="text-xs font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.2em]">{item}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="bg-gray-50/50 p-10 border border-gray-100">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ba1f3d] mb-8">Pakistan HQ</h4>
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <MapPin size={20} className="text-[#ba1f3d] mt-1 shrink-0" />
                <p className="text-xs font-black text-gray-900 leading-relaxed uppercase tracking-tighter">
                  Zaib Market Near<br />Glorious Mall, Gujrat
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Phone size={20} className="text-[#ba1f3d] shrink-0" />
                <p className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">0306-84586556</p>
              </div>
              <div className="flex items-center space-x-4">
                <Mail size={20} className="text-[#ba1f3d] shrink-0" />
                <p className="text-xs font-black text-gray-900 uppercase tracking-tighter">concierge@stop-shop.pk</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center space-y-10 md:space-y-0">
          <div className="flex items-center space-x-10">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.5em]">
              © {currentYear} STOP & SHOP | PAKISTAN EDITION
            </p>
            <div className="hidden sm:flex items-center space-x-2">
              <ShieldCheck size={14} className="text-[#ba1f3d]" />
              <span className="text-[8px] font-black text-gray-900 uppercase tracking-[0.3em]">Encrypted Checkout</span>
            </div>
          </div>

          <div className="flex items-center space-x-8 grayscale opacity-50">
            <div className="flex items-center space-x-4 border-r border-gray-200 pr-8">
               <span className="text-[9px] font-black uppercase tracking-widest text-gray-900">JazzCash</span>
               <span className="text-[9px] font-black uppercase tracking-widest text-gray-900">EasyPaisa</span>
            </div>
            <div className="flex items-center space-x-6">
              <CreditCard size={20} className="text-gray-900" />
              <Globe size={20} className="text-gray-900" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;