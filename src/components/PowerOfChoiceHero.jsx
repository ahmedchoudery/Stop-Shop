import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';

const PowerOfChoiceHero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[90vh]">
        {/* Text Column */}
        <div className="flex flex-col justify-center px-6 py-16 md:px-16 lg:px-24 bg-[#0A0A0A] z-10 relative">
          {/* Decorative accent */}
          <div className="absolute left-0 top-1/3 w-1 h-32 bg-gradient-to-b from-red-600 to-transparent" />

          <div className={`max-w-xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-px bg-red-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500">
                New Era of Tailoring
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter mb-8 uppercase">
              The Power <br />
              <span className="text-transparent" style={{
                WebkitTextStroke: '1px rgba(255,255,255,0.2)'
              }}>Of Choice</span>
            </h1>

            <p className="text-gray-400 text-lg font-medium leading-relaxed mb-10 max-w-md">
              Discover the ultimate expression of individuality. Our bespoke styles are crafted for those who define their own success.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#trending"
                className="group px-8 py-4 bg-red-600 text-white text-xs font-black uppercase tracking-widest flex items-center rounded-xl hover:bg-red-500 transition-all duration-300 shadow-2xl shadow-red-900/40"
              >
                Shop Now
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <button className="px-8 py-4 border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all rounded-xl backdrop-blur-sm">
                The Lookbook
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-white/5">
              {[
                { num: '100%', label: 'Wool Sourced' },
                { num: '24h', label: 'Express Delivery' },
                { num: '9k+', label: 'Happy Clients' },
              ].map(({ num, label }, i) => (
                <div
                  key={label}
                  className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${300 + i * 100}ms` }}
                >
                  <p className="text-2xl md:text-3xl font-black mb-1 text-white">{num}</p>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-16 hidden md:flex flex-col items-center space-y-2 animate-bounce">
            <ArrowDown size={16} className="text-gray-700" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-700 rotate-90 mt-2">Scroll</p>
          </div>
        </div>

        {/* Image Column */}
        <div className="relative h-[60vh] md:h-full overflow-hidden">
          <img
            src="/src/assets/premium_suit_hero.png"
            alt="Power of Choice - Premium Collection"
            className="absolute inset-0 w-full h-full object-cover object-top hover:scale-105 transition-transform duration-1000 grayscale-[0.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] to-transparent md:block hidden opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent md:hidden block" />

          {/* Floating badge */}
          <div className={`absolute top-8 right-8 bg-yellow-400 text-black p-4 rounded-2xl shadow-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`} style={{ transitionDelay: '600ms' }}>
            <p className="text-[10px] font-black uppercase tracking-widest">Free</p>
            <p className="text-lg font-black leading-tight">Shipping</p>
            <p className="text-[9px] font-bold text-black/60">₹2000+</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PowerOfChoiceHero;