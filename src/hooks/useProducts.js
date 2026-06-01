/**
 * @fileoverview useProducts — Product filtering & sorting hook.
 *
 * Decouples all data transformation logic from the ProductGrid display component,
 * following frontend-dev-guidelines feature-based organization doctrine:
 * data logic lives in hooks/, display components stay pure renderers.
 *
 * @param {Object[]} products    — Full product array from the API
 * @param {string}  activeBucket      — Active category bucket ('All' or category name)
 * @param {string|null} activeSubCategory — Active sub-category filter or null
 * @param {string}  sortBy        — Sort key: 'popular' | 'price-low' | 'price-high'
 * @returns {{ sortedProducts: Object[], total: number }}
 */

import { useMemo } from 'react';

/**
 * Filter + sort products based on active bucket, sub-category, and sort order.
 *
 * @example
 * const { sortedProducts, total } = useProducts(products, 'Men', 'Tops', 'price-low');
 */
export const useProducts = (
  products = [],
  activeBucket = 'All',
  activeSubCategory = null,
  sortBy = 'popular',
) => {
  const sortedProducts = useMemo(() => {
    // 1. Filter by bucket + sub-category
    const filtered = products.filter((item) => {
      const bucketMatch = activeBucket === 'All' || item.bucket === activeBucket;
      const subMatch = !activeSubCategory || item.subCategory === activeSubCategory;
      return bucketMatch && subMatch;
    });

    // 2. Sort
    return [...filtered].sort((a, b) => {
      if (sortBy === 'popular')    return b.rating - a.rating;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'price-low')  return a.price - b.price;
      return 0;
    });
  }, [products, activeBucket, activeSubCategory, sortBy]);

  return {
    sortedProducts,
    total: sortedProducts.length,
  };
};

export default useProducts;
