import React from 'react';

const Hero = () => {
  return (
    <section className="bg-white py-16 sm:py-24 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight">
          SUMMER COLLECTION
        </h1>
        <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
          Explore our latest arrivals for the sunny season. Quality, comfort, and style combined.
        </p>
        <div className="mt-8">
          <button className="inline-block bg-black text-white px-8 py-3 font-semibold hover:bg-gray-800 transition-all uppercase tracking-widest text-sm">
            Shop New Arrivals
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
