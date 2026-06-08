'use client';

import React, { useState, useEffect } from 'react';
import FeaturedCarousel from './FeaturedCarousel.jsx';

export default function PiecesThatSpeak() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/featured?section=pieces')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setProducts(data || []);
      })
      .catch(err => console.error('[PiecesThatSpeak] fetch failed:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <FeaturedCarousel
      products={products}
      headline="Pieces That Speak for Themselves."
      subline="Best Sellers · Fan Favourites"
    />
  );
}
