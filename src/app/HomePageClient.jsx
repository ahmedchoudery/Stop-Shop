'use client';

import React, { useEffect, useMemo } from 'react';
import PowerOfChoiceHero from '../components/PowerOfChoiceHero.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import ReviewsSection from '../components/ReviewsSection.jsx';
import Newsletter from '../components/Newsletter.jsx';
import RecentlyViewedSection from '../components/RecentlyViewedSection.jsx';
import { useCart } from '../context/CartContext.tsx';

export default function HomePageClient({ products = [] }) {
  const { activeBucket, activeSubCategory, shouldScrollGrid } = useCart();

  // Scroll to grid when bucket changes from navbar
  useEffect(() => {
    if (shouldScrollGrid > 0) {
      const grid = document.getElementById('product-grid');
      if (grid) {
        setTimeout(() => {
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [shouldScrollGrid]);

  return (
    <div>
      {/* Hero */}
      <PowerOfChoiceHero />

      {/* Products Catalog - Pre-hydrated with Zero Loading Latency */}
      <ProductGrid
        products={products}
        activeBucket={activeBucket}
        activeSubCategory={activeSubCategory}
      />

      {/* Reviews */}
      <ReviewsSection />

      {/* Recently Viewed */}
      <RecentlyViewedSection />

      {/* Newsletter */}
      <Newsletter />
    </div>
  );
}
