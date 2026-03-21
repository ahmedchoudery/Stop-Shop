import React, { useState, useEffect, useMemo } from 'react';
import ProductCard from './ProductCard';
import { useCart } from '../context/CartContext';

const ProductGrid = ({ products, activeBucket = 'All', activeSubCategory = null }) => {
  const [sortBy, setSortBy] = useState('featured');
  const { openDrawer } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [imagesLoadedCount, setImagesLoadedCount] = useState(0);

  // Scroll Snap and Loading Reset logic
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIsLoading(true);
    setImagesLoadedCount(0);
  }, [activeBucket, activeSubCategory, products]);

  // Flawless Filtering: Memoized two-level grid rendering 
  const sortedProducts = useMemo(() => {
    const filtered = products.filter(item => {
      // 1. If activeBucket === "All", return all products.
      // 2. If a bucket is selected but activeSub is null, return all products in that bucket.
      // 3. If both are selected, return only products matching both category and subCategory.
      const bucketMatch = activeBucket === 'All' || item.bucket === activeBucket;
      const subMatch = !activeSubCategory || item.subCategory === activeSubCategory;
      return bucketMatch && subMatch;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'popular') return b.rating - a.rating;
      return 0; // Featured/Default
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
    <div className="bg-[#F5F5F5] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">
            {activeBucket !== 'All' ? `${activeBucket}` : 'Trending Now'}
          </h2>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sort By:</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-black text-red-700 outline-none cursor-pointer border-b border-red-200 hover:border-red-700 transition-colors uppercase tracking-widest pb-0.5"
              >
                <option value="featured">Featured</option>
                <option value="popular">Popular</option>
              </select>
            </div>
            <a href="#" className="text-xs font-black text-red-600 hover:text-red-700 transition-colors underline decoration-1 underline-offset-[6px] uppercase tracking-widest">
              View All
            </a>
          </div>
        </div>
        
        {/* Master Loading Spinner */}
        {isLoading && (
          <div className="flex justify-center items-center h-64 w-full animate-pulse transition-opacity duration-1000 ease-in opacity-100">
            <div className="animate-spin h-6 w-6 border-t-2 border-gray-400 rounded-full"></div>
          </div>
        )}

        {/* Structured Grid with 1px Borders */}
        <div className={isLoading ? 'hidden' : 'block'}>
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-l border-gray-200">
              {sortedProducts.map((product) => (
                <div key={product.id} className="bg-transparent border-b border-r border-gray-200">
                  <ProductCard 
                    product={product} 
                    onSelectProduct={() => openDrawer('product', product)}
                    onImageLoad={handleImageLoad}
                  />
                </div>
              ))}
            </div>
          ) : (
            // Fallback UI — shown when filtered array length is 0
            <div className="flex flex-col justify-center items-center h-64 w-full border border-dashed border-gray-200">
              <p className="text-gray-400 font-light tracking-widest uppercase text-sm">
                Collection coming soon
              </p>
              <p className="text-gray-300 font-light tracking-[0.4em] text-[10px] mt-3 uppercase">
                {activeSubCategory ? `${activeSubCategory} · ` : ''}{activeBucket !== 'All' ? activeBucket : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductGrid;
