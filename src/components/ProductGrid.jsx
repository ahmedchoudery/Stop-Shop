import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import ProductCard from './ProductCard';
import { useCart } from '../context/CartContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ProductGrid = ({ products, activeBucket = 'All', activeSubCategory = null }) => {
  const { openDrawer, sortBy } = useCart();
  const gridRef = useRef(null);

  const handleSelectProduct = useCallback((product) => {
    openDrawer('product', product);
  }, [openDrawer]);

  const sortedProducts = useMemo(() => {
    const filtered = products.filter(item => {
      const bucketMatch = activeBucket === 'All' || item.bucket === activeBucket;
      const subMatch = !activeSubCategory || item.subCategory === activeSubCategory;
      return bucketMatch && subMatch;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'popular') return b.rating - a.rating;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'price-low') return a.price - b.price;
      return 0;
    });
  }, [products, activeBucket, activeSubCategory, sortBy]);

  useEffect(() => {
    if (!gridRef.current || sortedProducts.length === 0) return;

    const cards = gridRef.current.querySelectorAll('.product-card-reveal');
    
    const ctx = gsap.context(() => {
      gsap.fromTo(cards, 
        { 
          y: 60, 
          opacity: 0,
          scale: 0.95
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          stagger: 0.1,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }, gridRef);

    return () => ctx.revert();
  }, [sortedProducts]);

  return (
    <div id="product-grid" className="bg-white py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center mb-20 overflow-hidden">
          <div className="reveal-title">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-3">Curated Selection</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">
              {activeBucket !== 'All' ? activeBucket : 'Complete Catalog'}
            </h2>
          </div>
        </div>
        
        <div className="block">
          {sortedProducts.length > 0 ? (
            <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-16">
              {sortedProducts.map((product) => (
                <div key={product.id} className="product-card-reveal opacity-0">
                  <ProductCard 
                    product={product} 
                    onSelectProduct={() => handleSelectProduct(product)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-[50vh] w-full border border-dashed border-gray-200 bg-gray-50/30 rounded-[3rem]">
              <p className="text-gray-400 font-black tracking-[0.6em] uppercase text-xs">
                Collection Dropping Soon
              </p>
              <p className="text-gray-300 font-bold tracking-[0.3em] text-[10px] mt-6 uppercase italic">
                {activeSubCategory ? `${activeSubCategory} · ` : ''}{activeBucket !== 'All' ? activeBucket : 'Bespoke Styles'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(ProductGrid);

