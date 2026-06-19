'use client';

import React, { useState, useEffect } from 'react';
import FeaturedCarousel from './FeaturedCarousel.jsx';

export default function PiecesThatSpeak({ products: initialProducts = [], fallbackProducts = [] }) {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }
    fetch('/api/public/featured?section=pieces')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setProducts(data && data.length > 0 ? data : fallbackProducts);
      })
      .catch(err => {
        console.error('[PiecesThatSpeak] fetch failed:', err);
        setProducts(fallbackProducts);
      })
      .finally(() => setLoading(false));
  }, [initialProducts, fallbackProducts]);

  const displayProducts = products.length > 0 ? products : fallbackProducts;

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <FeaturedCarousel
      products={displayProducts}
      headline="Pieces That Speak for Themselves."
      subline="Best Sellers · Fan Favourites"
      theme="light"
    />
  );
}
