import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import PowerOfChoiceHero from '../components/PowerOfChoiceHero';
import ProductGrid from '../components/ProductGrid';
import Newsletter from '../components/Newsletter';
import ReviewsSection from '../components/ReviewsSection';
import RecentlyViewedSection from '../components/RecentlyViewedSection';
import { products as staticProducts } from '../data/products';

const HomePage = ({ onProductsLoaded }) => {
  const [products, setProducts] = useState([]);
  const [isFetching, setIsFetching] = useState(navigator.onLine);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [fetchError, setFetchError] = useState(false);

  const { activeBucket, setActiveBucket, activeSub, setActiveSub, lastViewedBucket, setLastViewedBucket } = useCart();

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setIsFetching(true); setFetchError(false); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    const fetchCloudInventory = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/public/products');
        if (!response.ok) throw new Error('Cloud fetch failed');
        const data = await response.json();
        setProducts(data);
        if (onProductsLoaded) onProductsLoaded(data);
        setIsFetching(false);
        setFetchError(false);
      } catch {
        // Fallback to static products
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

  const buckets = ['All', 'Tops', 'Bottoms', 'Accessories'];

  const handleBucketClick = (bucket) => {
    setActiveBucket(bucket);
    setActiveSub(null);
    if (bucket !== 'All') setLastViewedBucket(bucket);
  };

  const visibleSubCategories = subCategoryMap[lastViewedBucket] || [];

  return (
    <>
      <div id="tops" />
      <PowerOfChoiceHero />

      {/* Category Filter */}
      <div className="bg-[#F5F5F5] border-b border-gray-200 pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8 sm:space-x-12 mb-6 overflow-x-auto pb-2">
            {buckets.map(bucket => (
              <button
                key={bucket}
                onClick={() => handleBucketClick(bucket)}
                className={`text-sm font-black uppercase tracking-[0.3em] pb-3 transition-all relative flex-shrink-0 ${activeBucket === bucket
                    ? 'text-red-700 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-red-700'
                    : 'text-gray-400 hover:text-gray-900'
                  }`}
              >
                {bucket}
              </button>
            ))}
          </div>

          <div className="flex justify-center items-center flex-wrap gap-4 sm:gap-6 pb-8 border-t border-gray-50 pt-5">
            <button
              onClick={() => { setActiveSub(null); if (activeBucket === 'All') setActiveBucket(lastViewedBucket); }}
              className={`text-xs uppercase tracking-[0.2em] transition-all pb-1 ${!activeSub ? 'font-bold text-gray-900 border-b-2 border-gray-400' : 'text-gray-400 hover:text-gray-900 font-semibold border-b-2 border-transparent'
                }`}
            >
              All {lastViewedBucket}
            </button>
            {visibleSubCategories.map(sub => (
              <button
                key={sub}
                onClick={() => { setActiveSub(sub); if (activeBucket === 'All') setActiveBucket(lastViewedBucket); }}
                className={`text-xs uppercase tracking-[0.2em] transition-all pb-1 ${activeSub === sub ? 'font-bold text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-900 font-semibold border-b-2 border-transparent'
                  }`}
              >
                {sub}
              </button>
            ))}
            {activeBucket === 'All' && (
              <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest self-center">— from {lastViewedBucket}</span>
            )}
          </div>
        </div>
      </div>

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