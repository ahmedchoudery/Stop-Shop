'use client';

import React, { useState, useEffect } from 'react';
import FeaturedCarousel from './FeaturedCarousel.jsx';

export default function PiecesThatSpeak({ fallbackProducts = [] }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [fallbackProducts]);

  const displayProducts = products.length > 0 ? products : fallbackProducts;

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <FeaturedCarousel
      products={displayProducts}
      headline="Pieces That Speak for Themselves."
      subline="Best Sellers · Fan Favourites"
    />
  );
}
