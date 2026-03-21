import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import PowerOfChoiceHero from '../components/PowerOfChoiceHero';
import ProductGrid from '../components/ProductGrid';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [isFetching, setIsFetching] = useState(navigator.onLine);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [fetchError, setFetchError] = useState(false);
  
  const { 
    activeBucket, setActiveBucket, 
    activeSub, setActiveSub, 
    lastViewedBucket, setLastViewedBucket 
  } = useCart();

  // Network Watcher: Monitor live connection status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsFetching(true); // Restart fetching visual when connection returns
      setFetchError(false);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch live inventory from CMS (Backend API)
  useEffect(() => {
    if (!isOnline) return;

    const fetchCloudInventory = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/public/products');
        if (!response.ok) throw new Error('Cloud fetch failed');
        const data = await response.json();
        setProducts(data);
        setIsFetching(false);
        setFetchError(false);
      } catch (err) {
        console.error('Failed to sync master inventory:', err);
        setFetchError(true);
        // Intentionally hanging isFetching to prevent displaying an empty grid layout
      }
    };
    fetchCloudInventory();
  }, [isOnline]); // Retry immediately when connection is restored

  // Dynamically derive the category tree from whatever products the cloud returns
  const subCategoryMap = useMemo(() => {
    const map = products.reduce((acc, product) => {
      if (!product.bucket) return acc;
      if (!acc[product.bucket]) acc[product.bucket] = new Set();
      if (product.subCategory) acc[product.bucket].add(product.subCategory);
      return acc;
    }, {});
    
    Object.keys(map).forEach(key => {
      map[key] = Array.from(map[key]);
    });
    return map;
  }, [products]);

  const buckets = ['All', 'Tops', 'Bottoms', 'Accessories'];

  const handleBucketClick = (bucket) => {
    setActiveBucket(bucket);
    setActiveSub(null); // Reset sub when switching buckets
    // Only update lastViewedBucket for real buckets (not "All")
    if (bucket !== 'All') {
      setLastViewedBucket(bucket);
    }
  };

  // The sub-menu always shows the sub-categories from lastViewedBucket
  const visibleSubCategories = subCategoryMap[lastViewedBucket] || [];

  const handleSubClick = (sub) => {
    setActiveSub(sub);
    // If the user clicks a sub while in "All" view, jump back to its parent bucket
    if (activeBucket === 'All') {
      setActiveBucket(lastViewedBucket);
    }
  };

  return (
    <>
      <div id="tops"></div>
      <PowerOfChoiceHero />
      
      {/* Filtering UI */}
      <div className="bg-[#F5F5F5] border-b border-gray-200 pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Bucket Tabs */}
          <div className="flex justify-center space-x-12 mb-6">
            {buckets.map((bucket) => (
              <button
                key={bucket}
                onClick={() => handleBucketClick(bucket)}
                className={`text-sm font-black uppercase tracking-[0.3em] pb-3 transition-all relative ${
                  activeBucket === bucket 
                    ? 'text-red-700 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-red-700' 
                    : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                {bucket}
              </button>
            ))}
          </div>

          {/* Sub-Menu — Always visible, driven by lastViewedBucket */}
          {/* The visibility is NOT tied to activeBucket so it persists even in "All" view */}
          <div className="flex justify-center items-center flex-wrap gap-6 pb-8 border-t border-gray-50 pt-5">

            {/* "All [Bucket]" Reset Link — uses silver underline when active */}
            <button
              onClick={() => {
                setActiveSub(null);
                // If in "All" view, snap back to last viewed bucket
                if (activeBucket === 'All') setActiveBucket(lastViewedBucket);
              }}
              className={`text-xs uppercase tracking-[0.2em] transition-all pb-1 ${
                !activeSub
                  ? 'font-bold text-gray-900 border-b-2 border-gray-400'
                  : 'text-gray-400 hover:text-gray-900 font-semibold border-b-2 border-transparent hover:border-gray-300'
              }`}
            >
              All {lastViewedBucket}
            </button>

            {/* Sub-category links — bold + underline when active */}
            {visibleSubCategories.map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  // 1. Set the active sub-category
                  setActiveSub(sub);
                  // 2. Auto-Parent Logic: if in "All" view, snap to the parent bucket
                  if (activeBucket === 'All') {
                    setActiveBucket(lastViewedBucket);
                  }
                }}
                className={`text-xs uppercase tracking-[0.2em] transition-all pb-1 ${
                  activeSub === sub
                    ? 'font-bold text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-400 hover:text-gray-900 font-semibold border-b-2 border-transparent hover:border-gray-300'
                }`}
              >
                {sub}
              </button>
            ))}

            {/* Context hint — shows which bucket's sub-menu is displayed when in "All" view */}
            {activeBucket === 'All' && (
              <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest self-center">
                — from {lastViewedBucket}
              </span>
            )}
          </div>

        </div>
      </div>

      <div id="trending">
        {isFetching || !isOnline || fetchError ? (
          <div className="bg-[#F5F5F5] py-16 flex flex-col justify-center items-center h-64 w-full animate-pulse transition-opacity duration-1000 ease-in opacity-100">
            <div className="animate-spin h-6 w-6 border-t-2 border-gray-400 rounded-full mb-4"></div>
            {!isOnline && (
              <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">
                Waiting for network connection...
              </p>
            )}
            {fetchError && isOnline && (
              <p className="text-[10px] uppercase font-black tracking-widest text-red-500">
                Syncing with Cloud...
              </p>
            )}
          </div>
        ) : (
          <ProductGrid 
            products={products} 
            activeBucket={activeBucket}
            activeSubCategory={activeSub}
          />
        )}
      </div>
    </>
  );
};

export default HomePage;
