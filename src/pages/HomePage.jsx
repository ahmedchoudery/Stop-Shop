import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import PowerOfChoiceHero from '../components/PowerOfChoiceHero';
import ProductGrid from '../components/ProductGrid';
import Newsletter from '../components/Newsletter';
import ReviewsSection from '../components/ReviewsSection';
import RecentlyViewedSection from '../components/RecentlyViewedSection';
import { products as staticProducts } from '../data/products';
import { apiUrl } from '../config/api';

const HomePage = ({ onProductsLoaded }) => {
  const [products, setProducts] = useState([]);
  const [isFetching, setIsFetching] = useState(navigator.onLine);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [fetchError, setFetchError] = useState(false);

  const { activeBucket, setActiveBucket, activeSub, setActiveSub, lastViewedBucket, setLastViewedBucket, shouldScrollGrid } = useCart();

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setIsFetching(true); setFetchError(false); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // Smooth Scroll Trigger
  useEffect(() => {
    if (shouldScrollGrid > 0) {
      const element = document.getElementById('product-grid');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [shouldScrollGrid]);

  useEffect(() => {
    if (!isOnline) return;
    const fetchCloudInventory = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/public/products`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
    
        if (!response.ok) throw new Error('Cloud fetch failed');
        const data = await response.json();
        setProducts(data);
        if (onProductsLoaded) onProductsLoaded(data);
        setIsFetching(false);
        setFetchError(false);
      } catch {
        // Fallback to static products after timeout or error
        setProducts(staticProducts);
        if (onProductsLoaded) onProductsLoaded(staticProducts);
        setFetchError(true);
        setIsFetching(false);
      }
    };
    fetchCloudInventory();
  }, [isOnline]);

  const subCategoryMap = useMemo(() => {
    const map = products.reduce((acc, product) => {
      if (!product.bucket) return acc;
      if (!acc[product.bucket]) acc[product.bucket] = new Set();
      if (product.subCategory) acc[product.bucket].add(product.subCategory);
      return acc;
    }, {});
    Object.keys(map).forEach(key => { map[key] = Array.from(map[key]); });
    return map;
  }, [products]);

  const buckets = ['All', 'Tops', 'Bottoms', 'Footwear', 'Accessories'];

  const DEFAULT_SUB_CATEGORIES = {
    'Tops': ['Shirts', 'T-Shirts', 'SweatShirts', 'Hoodies', 'Sweater', 'Jackets'],
    'Bottoms': ['Jeans', 'Trousers', 'Shorts'],
    'Accessories': ['Watches', 'Glasses', 'Caps', 'Rings', 'Bracelet', 'Chains', 'Bags'],
    'Footwear': []
  };

  const handleBucketClick = (bucket) => {
    setActiveBucket(bucket);
    setActiveSub(null);
    if (bucket !== 'All') setLastViewedBucket(bucket);
  };

  const visibleSubCategories = useMemo(() => {
    const fromDB = subCategoryMap[lastViewedBucket] || [];
    const defaults = DEFAULT_SUB_CATEGORIES[lastViewedBucket] || [];
    // Combine and unique
    return Array.from(new Set([...defaults, ...fromDB]));
  }, [subCategoryMap, lastViewedBucket]);

  return (
    <>
      <div id="tops" />
      <PowerOfChoiceHero />

      {/* Category Filter */}
      <div className="bg-white border-b border-gray-100 sticky top-[72px] z-40 overflow-x-auto no-scrollbar shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Main Buckets */}
          <div className="flex items-center space-x-12 h-20 border-b border-gray-50">
            {buckets.map(bucket => (
              <button
                key={bucket}
                onClick={() => handleBucketClick(bucket)}
                className={`text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap transition-all relative group h-full flex items-center ${activeBucket === bucket
                    ? 'text-[#ba1f3d]'
                    : 'text-gray-400 hover:text-gray-900'
                  }`}
              >
                {bucket}
                <span className={`absolute bottom-0 left-0 w-full h-[3px] bg-[#ba1f3d] transition-all duration-500 scale-x-0 group-hover:scale-x-100 ${activeBucket === bucket ? 'scale-x-100' : ''}`} />
              </button>
            ))}
          </div>

          {/* Sub-categories */}
          <div className="flex items-center flex-wrap gap-8 py-6">
            <button
              onClick={() => { setActiveSub(null); if (activeBucket === 'All') setActiveBucket(lastViewedBucket); }}
              className={`text-[9px] uppercase tracking-[0.25em] transition-all pb-1 border-b-2 ${!activeSub ? 'font-black text-gray-900 border-[#ba1f3d]' : 'text-gray-400 hover:text-gray-900 font-bold border-transparent'
                }`}
            >
              All {lastViewedBucket}
            </button>
            {visibleSubCategories.map(sub => (
              <button
                key={sub}
                onClick={() => { setActiveSub(sub); if (activeBucket === 'All') setActiveBucket(lastViewedBucket); }}
                className={`text-[9px] uppercase tracking-[0.25em] transition-all pb-1 border-b-2 ${activeSub === sub ? 'font-black text-gray-900 border-[#ba1f3d]' : 'text-gray-400 hover:text-gray-900 font-bold border-transparent'
                  }`}
              >
                {sub}
              </button>
            ))}
            {activeBucket === 'All' && (
              <span className="text-[8px] text-gray-300 font-black uppercase tracking-[0.4em] ml-auto">— Curated from {lastViewedBucket}</span>
            )}
          </div>
        </div>
      </div>

      <div id="product-grid" />

      {/* Products */}
      <div id="trending">
        {isFetching && !fetchError ? (
          <div className="bg-[#F5F5F5] py-16 flex flex-col justify-center items-center h-64">
            <div className="animate-spin h-6 w-6 border-t-2 border-gray-400 rounded-full mb-4" />
            {!isOnline && <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Waiting for network...</p>}
          </div>
        ) : (
          <ProductGrid products={products} activeBucket={activeBucket} activeSubCategory={activeSub} />
        )}
      </div>

      {/* Recently Viewed — only shows once user has browsed at least 1 product */}
      <RecentlyViewedSection />

      {/* Reviews */}
      <ReviewsSection />

      {/* Newsletter */}
      <Newsletter />
    </>
  );
};

export default HomePage;