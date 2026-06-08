'use client';

import React, { useState, useEffect } from 'react';
import FeaturedCarousel from './FeaturedCarousel.jsx';

export default function FeaturedDrop({ fallbackProducts = [] }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/featured?section=drop')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setProducts(data || []);
      })
      .catch(err => console.error('[FeaturedDrop] fetch failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const displayProducts = products.length > 0 ? products : fallbackProducts;

  if (loading && products.length === 0 && fallbackProducts.length === 0) {
    return null;
  }

  return (
    <FeaturedCarousel
      products={displayProducts}
      headline="The Drop You've Been Waiting For."
      subline="New Arrivals · Limited Stock"
    />
  );
}
