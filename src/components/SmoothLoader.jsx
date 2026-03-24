import React, { useEffect, useState } from 'react';

const SmoothLoader = ({ onComplete }) => {
  const [percent, setPercent] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(onComplete, 800); // Wait for exit animation
          }, 400);
          return 100;
        }
        // Random increments for a more 'organic' feel
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-all duration-700 ease-out-expo ${isExiting ? 'opacity-0 translate-y-[-100%]' : 'opacity-100'}`}>
      <div className="relative flex flex-col items-center">
        {/* Logo Text */}
        <div className="mb-12 overflow-hidden">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-[#ba1f3d] animate-reveal-up">
            STOP<span className="text-gray-900 ml-1">&</span>SHOP
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 mt-2 text-center animate-reveal-up animation-delay-200">
            Pakistan Edition
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-64 h-[2px] bg-gray-100 relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-[#ba1f3d] transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Percent indicator */}
        <div className="mt-6">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ba1f3d]">
            {percent === 100 ? 'Welcome' : `Loading ${Math.min(percent, 100)}%`}
          </span>
        </div>
      </div>

      {/* Floating Design Elements */}
      <div className="absolute bottom-12 left-12 flex flex-col space-y-2 opacity-20">
        <div className="w-12 h-[2px] bg-[#ba1f3d]" />
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-900">Premium Essentials</p>
      </div>

      <div className="absolute top-12 right-12 hidden md:block opacity-20 text-right">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-900 leading-relaxed">
              Design Tier v1.0<br/>
              Cardinal Systems
          </p>
      </div>
    </div>
  );
};

export default SmoothLoader;
