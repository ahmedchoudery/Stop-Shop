import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ProductCard from './ProductCard';

const SORT_OPTIONS = [
  { label: 'Popularity', value: 'popular' },
  { label: 'Price: Low to High', value: 'price-low' },
  { label: 'Price: High to Low', value: 'price-high' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.8, 
      ease: [0.16, 1, 0.3, 1] 
    }
  }
};

const ProductGrid = ({ products, activeBucket = 'All', activeSubCategory = null }) => {
  const { openDrawer, sortBy, setSortBy } = useCart();
  const headingRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(20);

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(20);
  }, [activeBucket, activeSubCategory]);

  const handleSelectProduct = useCallback((product) => {
    openDrawer('product', product);
  }, [openDrawer]);

  // ── Filtered + sorted products ────────────────────────────────
  const sortedProducts = useMemo(() => {
    const filtered = products.filter(item => {
      const bucketMatch = activeBucket === 'All' || item.bucket === activeBucket;
      const subMatch = !activeSubCategory || item.subCategory === activeSubCategory;
      return bucketMatch && subMatch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'popular') return b.rating - a.rating;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'price-low') return a.price - b.price;
      return 0;
    });
  }, [products, activeBucket, activeSubCategory, sortBy]);

  return (
    <div id="product-grid" className="bg-white py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Section Header */}
        <div className="flex items-end justify-between mb-16">
          <motion.div 
            key={activeBucket}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-3">
              Curated Selection
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">
              {activeBucket !== 'All' ? activeBucket : 'Complete Catalog'}
            </h2>
            {sortedProducts.length > 0 && (
              <p className="text-sm text-gray-400 font-bold mt-2">
                {sortedProducts.length} {sortedProducts.length === 1 ? 'piece' : 'pieces'}
              </p>
            )}
          </motion.div>

          {/* Sort control */}
          <div className="flex items-center space-x-3">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent border-b-2 border-gray-200 focus:border-[#ba1f3d] text-[10px] font-black uppercase tracking-widest text-gray-600 outline-none cursor-pointer py-1 transition-colors duration-200 appearance-none pr-6"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {sortedProducts.length > 0 ? (
            <motion.div
              key={`${activeBucket}-${activeSubCategory}-${sortBy}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-14"
            >
              {sortedProducts.slice(0, visibleCount).map((product) => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  className="product-card-wrap"
                >
                  <ProductCard
                    product={product}
                    onSelectProduct={() => handleSelectProduct(product)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyGrid activeBucket={activeBucket} activeSubCategory={activeSubCategory} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More Button */}
        {sortedProducts.length > visibleCount && (
          <div className="flex justify-center mt-20">
            <button
              onClick={() => setVisibleCount(c => c + 20)}
              className="px-10 py-4 bg-gray-900 hover:bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-xl shadow-2xl transition-all active:scale-95 flex items-center space-x-4 group"
            >
              <span>Load More Pieces</span>
              <div className="h-[2px] w-4 bg-white/30 group-hover:w-8 transition-all duration-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyGrid = ({ activeBucket, activeSubCategory }) => (
  <div className="flex flex-col justify-center items-center h-[40vh] w-full border border-dashed border-gray-200 bg-gray-50/30 rounded-2xl animate-fade-in">
    <p className="text-gray-400 font-black tracking-[0.5em] uppercase text-xs mb-3">
      Collection Dropping Soon
    </p>
    <p className="text-gray-300 font-bold tracking-[0.2em] text-[10px] uppercase italic">
      {activeSubCategory ? `${activeSubCategory} · ` : ''}{activeBucket !== 'All' ? activeBucket : 'New Arrivals'}
    </p>
  </div>
);

export default memo(ProductGrid);
