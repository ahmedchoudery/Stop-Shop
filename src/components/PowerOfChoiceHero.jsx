import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import HeroScene from './HeroScene';

const PowerOfChoiceHero = () => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const badgeRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance Animation
      gsap.from(textRef.current.children, {
        y: 100,
        opacity: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: 'expo.out'
      });

      gsap.from(badgeRef.current, {
        x: 50,
        opacity: 0,
        duration: 1,
        delay: 0.8,
        ease: 'power3.out'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative overflow-hidden bg-white text-gray-900 border-b border-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[90vh]">
        
        {/* Text Column */}
        <div className="lg:col-span-7 flex flex-col justify-center px-8 py-24 md:px-16 lg:px-24 bg-white z-20 relative">
          <div ref={textRef} className="max-w-2xl">
            <div className="flex items-center space-x-3 mb-10 overflow-hidden">
              <div className="w-10 h-[2px] bg-[#ba1f3d]" />
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#ba1f3d]">
                Supreme Elegance · Pakistan Edition
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-black leading-[0.8] tracking-tighter mb-10 uppercase">
              <span className="block text-gray-900">The Power</span>
              <span className="block text-transparent" style={{ WebkitTextStroke: '2px #ba1f3d' }}>
                Of Choice
              </span>
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
          </div>
        </div>

        {/* 3D Visual Column */}
        <div className="lg:col-span-5 relative h-[70vh] lg:h-full overflow-hidden bg-gray-50 flex items-center justify-center">
          {/* 3D Scene */}
          <div className="absolute inset-0 z-0 bg-gradient-to-tr from-gray-50 to-white">
             <HeroScene />
          </div>

          
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/40 lg:block hidden z-10 pointer-events-none" />
          
          {/* Floating badge */}
          <div ref={badgeRef} className="absolute bottom-12 right-12 bg-gray-900 text-white p-8 shadow-3xl z-20">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ba1f3d] mb-2">Exclusive</p>
            <p className="text-3xl font-black leading-none mb-1 uppercase tracking-tighter">Luxury <br/> Shipping</p>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-3">Orders over PKR 2,000</p>
          </div>

          {/* Decorative Pattern */}
          <div className="absolute top-0 right-0 p-12 opacity-5 z-0">
             <div className="w-48 h-48 border-[20px] border-gray-900 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PowerOfChoiceHero;