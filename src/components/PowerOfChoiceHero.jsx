import React from 'react';
import { ArrowRight } from 'lucide-react';

const PowerOfChoiceHero = () => {
  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[85vh]">
        {/* Text Content Column */}
        <div className="flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 bg-[#0A0A0A] z-10">
          <div className="max-w-xl animate-in fade-in slide-in-from-left-8 duration-700">
            <span className="block text-xs font-black uppercase tracking-[0.4em] text-red-600 mb-6">
              New Era of Tailoring
            </span>
            <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tighter mb-8 uppercase">
              The Power <br />
              <span className="text-gray-400">Of Choice</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed mb-10 max-w-md">
              Discover the ultimate expression of individuality. Our bespoke suits are crafted for those who define their own success.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="group px-8 py-4 bg-white text-black text-xs font-black uppercase tracking-widest flex items-center hover:bg-red-600 hover:text-white transition-all duration-300">
                Explore Collection
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 border border-white/20 text-white text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                The Lookbook
              </button>
            </div>
            
            {/* Stats/Badges */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-white/10">
              <div>
                <p className="text-2xl font-black mb-1">100%</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Wool Sourced</p>
              </div>
              <div>
                <p className="text-2xl font-black mb-1">24h</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Global Delivery</p>
              </div>
              <div>
                <p className="text-2xl font-black mb-1">9k+</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Bespoke Clients</p>
              </div>
            </div>
          </div>
        </div>

        {/* Image Column */}
        <div className="relative h-[50vh] md:h-full overflow-hidden">
          <img 
            src="/src/assets/premium_suit_hero.png" 
            alt="Power of Choice - Bespoke Suits"
            className="absolute inset-0 w-full h-full object-cover object-top hover:scale-105 transition-transform duration-1000 grayscale-[0.2] hover:grayscale-0"
          />
          {/* Subtle Overlay for better visual integration */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] to-transparent md:block hidden opacity-60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent md:hidden block"></div>
        </div>
      </div>
    </section>
  );
};

export default PowerOfChoiceHero;
