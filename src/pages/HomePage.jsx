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

  const { activeBucket, setActiveBucket, activeSub, setActiveSub, lastViewedBucket, setLastViewedBucket, shouldScrollGrid, sortBy, setSortBy } = useCart();

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
      } catch (err) {
        console.error('[Products API] Failed to fetch:', err.message);
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

      {/* Enhanced Sort Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-[72px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">View:</span>
            <span className="text-[10px] font-black text-[#ba1f3d] uppercase tracking-[0.4em]">
              {activeBucket} {activeSub ? `· ${activeSub}` : ''}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sort By:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-[11px] font-black text-[#ba1f3d] outline-none cursor-pointer border-b border-transparent hover:border-[#ba1f3d] transition-all uppercase tracking-widest pb-1"
            >
              <option value="featured">Newest</option>
              <option value="popular">Popular</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
            </select>
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

      {/* Newsletter */}
      <Newsletter />
    </>
  );
};

export default HomePage;