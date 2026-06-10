'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import PowerOfChoiceHero from '../components/PowerOfChoiceHero.jsx';
import BrandStrip from '../components/BrandStrip.jsx';
import CategoryTiles from '../components/CategoryTiles.jsx';
import FeaturedDrop from '../components/FeaturedDrop.jsx';
import PiecesThatSpeak from '../components/PiecesThatSpeak.jsx';
import LookbookStrip from '../components/LookbookStrip.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import ReviewsSection from '../components/ReviewsSection.jsx';
import RecentlyViewedSection from '../components/RecentlyViewedSection.jsx';
import Newsletter from '../components/Newsletter.jsx';
import { useCart } from '../context/CartContext.tsx';

export default function HomePageClient({ products = [] }) {
  const { activeBucket, setActiveBucket, activeSub: activeSubCategory, shouldScrollGrid } = useCart();

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

  // Handler for CategoryTiles and CarouselShop buttons
  const handleCategorySelect = useCallback((category) => {
    if (setActiveBucket) setActiveBucket(category);
  }, [setActiveBucket]);

  // ── Derived product slices for carousels ──────────────────────────
  // "Featured Drop" — newest 12 products
  const featuredProducts = useMemo(
    () => [...products].slice(0, 12),
    [products]
  );

  // "Best Sellers" — highest rated 12 products
  const bestSellers = useMemo(
    () =>
      [...products]
        .filter((p) => p.rating >= 4)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 12),
    [products]
  );

  return (
    <div>
      {/* 1 ─ Full-Screen Editorial Hero */}
      <PowerOfChoiceHero />

      {/* 2 ─ Brand USP Trust Strip */}
      <BrandStrip />

      {/* 3 ─ Category Navigator Tiles */}
      <CategoryTiles
        onSelect={handleCategorySelect}
        activeBucket={activeBucket}
      />

      {/* 4 ─ Featured Drop: "The Drop You've Been Waiting For" */}
      <FeaturedDrop fallbackProducts={featuredProducts} />

      {/* 5 ─ Lookbook Full-Bleed Strip */}
      <LookbookStrip onShopNow={handleCategorySelect} />

      {/* 6 ─ Pieces That Speak: "Pieces That Speak for Themselves" */}
      <PiecesThatSpeak fallbackProducts={bestSellers} />

      {/* 7 ─ Full Product Catalog Grid */}
      <ProductGrid
        products={products}
        activeBucket={activeBucket}
        activeSubCategory={activeSubCategory}
      />

      {/* 8 ─ Reviews */}
      <ReviewsSection />

      {/* 9 ─ Recently Viewed */}
      <RecentlyViewedSection />

      {/* 10 ─ Newsletter */}
      <Newsletter />
    </div>
  );
}
