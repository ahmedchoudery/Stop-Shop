import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';

const PowerOfChoiceHero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-white text-gray-900 border-b border-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[95vh]">
        {/* Text Column */}
        <div className="lg:col-span-7 flex flex-col justify-center px-8 py-24 md:px-16 lg:px-24 bg-white z-10 relative">
          <div className={`max-w-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="flex items-center space-x-3 mb-10 overflow-hidden">
              <div className="w-10 h-[2px] bg-[#ba1f3d] animate-reveal-left" />
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#ba1f3d]">
                Supreme Elegance · Pakistan Edition
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black leading-[0.85] tracking-tighter mb-10 uppercase">
              Pure <br />
              <span className="text-transparent" style={{ WebkitTextStroke: '2px #ba1f3d' }}>Power</span>
            </h1>

            <p className="text-gray-500 text-xl font-medium leading-relaxed mb-12 max-w-lg">
              Define your own standard of excellence. Our bespoke collections are tailored for the modern Pakistani trendsetter.
            </p>

            <div className="flex flex-wrap gap-6 items-center">
              <a
                href="#trending"
                className="group relative px-10 py-5 bg-[#ba1f3d] text-white text-xs font-black uppercase tracking-[0.3em] flex items-center shadow-[0_20px_40px_rgba(186,31,61,0.2)] hover:shadow-[0_25px_50px_rgba(186,31,61,0.3)] hover:-translate-y-1 active:translate-y-0 transition-all duration-500"
              >
                <span className="relative z-10">Discover Collection</span>
                <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-2 transition-transform relative z-10" />
              </a>
              <button className="px-10 py-5 border-2 border-gray-900 text-gray-900 text-xs font-black uppercase tracking-[0.3em] hover:bg-gray-900 hover:text-white transition-all duration-500">
                Lookbook
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-12 mt-20 pt-16 border-t border-gray-100">
              {[
                { num: '100%', label: 'Fine Sourcing' },
                { num: '24h', label: 'Fast Delivery' },
                { num: '15k+', label: 'Elite Clients' },
              ].map(({ num, label }, i) => (
                <div
                  key={label}
                  className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${400 + i * 150}ms` }}
                >
                  <p className="text-3xl md:text-4xl font-black mb-2 text-gray-900">{num}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-16 hidden lg:flex flex-col items-center space-y-4">
            <div className="w-[1px] h-12 bg-gray-200 overflow-hidden">
                <div className="w-full h-full bg-[#ba1f3d] animate-scroll-indicator" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center vertical-text">Scroll Down</p>
          </div>
        </div>

        {/* Image Column */}
        <div className="lg:col-span-5 relative h-[70vh] lg:h-full overflow-hidden bg-gray-50">
          <div 
            className={`absolute inset-0 w-full h-full grayscale-[0.2] transition-all duration-[2000ms] ease-out-expo ${isVisible ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}
          >
            <img
              src="/src/assets/premium_suit_hero.png"
              alt="Power of Choice - Pakistan Premium Collection"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/20 lg:block hidden" />
          
          {/* Floating badge */}
          <div className={`absolute bottom-12 right-12 bg-gray-900 text-white p-8 shadow-3xl transition-all duration-1000 delay-700 animate-3d-float ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ba1f3d] mb-2">Exclusive</p>
            <p className="text-3xl font-black leading-none mb-1 uppercase tracking-tighter">Luxury <br/> Shipping</p>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-3">Orders over PKR 2,000</p>
          </div>

          {/* Decorative Pattern */}
          <div className="absolute top-0 right-0 p-12 opacity-5">
             <div className="w-48 h-48 border-[20px] border-gray-900 rounded-full" />
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); }
        @keyframes scroll-indicator {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scroll-indicator { animation: scroll-indicator 2s infinite cubic-bezier(0.77, 0, 0.175, 1); }
        .animate-reveal-left {
          animation: revealLeft 1s cubic-bezier(0.77, 0, 0.175, 1) forwards;
        }
        @keyframes revealLeft {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
      `}} />
    </section>
  );
};

export default PowerOfChoiceHero;