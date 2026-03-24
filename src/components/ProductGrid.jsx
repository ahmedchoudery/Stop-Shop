import React, { useState, useEffect, useMemo } from 'react';
import ProductCard from './ProductCard';
import { useCart } from '../context/CartContext';

const ProductGrid = ({ products, activeBucket = 'All', activeSubCategory = null }) => {
  const { openDrawer, sortBy, setSortBy } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [imagesLoadedCount, setImagesLoadedCount] = useState(0);

  // Loading Reset logic
  useEffect(() => {
    setIsLoading(true);
    setImagesLoadedCount(0);
  }, [activeBucket, activeSubCategory, products]);

  // Flawless Filtering: Memoized two-level grid rendering 
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
      return 0; // Newest/Featured
    });
  }, [products, activeBucket, activeSubCategory, sortBy]);

  // Master Loading State Resolver
  useEffect(() => {
    if (sortedProducts.length === 0) {
      setIsLoading(false);
    } else if (imagesLoadedCount >= sortedProducts.length) {
      setIsLoading(false);
    }
  }, [imagesLoadedCount, sortedProducts.length]);

  const handleImageLoad = () => {
    setImagesLoadedCount(prev => prev + 1);
  };

  return (
    <div id="product-grid" className="bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ba1f3d] mb-2">Curated Selection</p>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
              {activeBucket !== 'All' ? activeBucket : 'Complete Catalog'}
            </h2>
          </div>
        </div>
        
        {/* Master Loading Spinner */}
        {isLoading && (
          <div className="flex justify-center items-center h-96 w-full transition-opacity duration-1000 ease-in opacity-100">
            <div className="animate-spin h-8 w-8 border-t-2 border-[#ba1f3d] rounded-full"></div>
          </div>
        )}

        {/* Structured Grid */}
        <div className={isLoading ? 'hidden' : 'block'}>
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
              {sortedProducts.map((product) => (
                <div key={product.id} className="animate-fade-up">
                  <ProductCard 
                    product={product} 
                    onSelectProduct={() => openDrawer('product', product)}
                    onImageLoad={handleImageLoad}
                  />
                </div>
              ))}
            </div>
          ) : (
            // Fallback UI
            <div className="flex flex-col justify-center items-center h-96 w-full border border-dashed border-gray-200 bg-gray-50/30 rounded-3xl">
              <p className="text-gray-400 font-black tracking-[0.4em] uppercase text-xs">
                Collection Dropping Soon
              </p>
              <p className="text-gray-300 font-bold tracking-widest text-[9px] mt-4 uppercase">
                {activeSubCategory ? `${activeSubCategory} · ` : ''}{activeBucket !== 'All' ? activeBucket : 'Bespoke Styles'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductGrid;
