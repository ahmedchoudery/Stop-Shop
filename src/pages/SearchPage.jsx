/**
 * @fileoverview SearchPage.jsx
 * Route: /search?q=blue+shirt
 *
 * Proper search page with:
 * - URL-based search (shareable, bookmarkable, Google-indexable)
 * - Search input auto-focused
 * - Filters by category, stock, price
 * - Results grid with product cards
 * - No results state
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, X, Filter, Package, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { apiUrl } from '../config/api.js';

// ─────────────────────────────────────────────────────────────────
// PRODUCT CARD (Simplified for search results)
// ─────────────────────────────────────────────────────────────────

const SearchProductCard = ({ product }) => {
  const { formatPrice } = useCurrency();
  const { addToCart, openDrawer } = useCart();
  const outOfStock = (product.quantity ?? 0) === 0;

  const handleAdd = (e) => {
    e.preventDefault();
    if (outOfStock) return;
    addToCart({ ...product, quantity: 1 });
    setTimeout(() => openDrawer('cart'), 300);
  };

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden mb-3">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={32} className="text-gray-200" />
          </div>
        )}

        {outOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600 border-b border-gray-600 pb-0.5">
              Sold Out
            </span>
          </div>
        )}

        {!outOfStock && (
          <button
            onClick={handleAdd}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] font-black uppercase tracking-widest px-4 py-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#ba1f3d] whitespace-nowrap"
          >
            Add to Bag
          </button>
        )}
      </div>

      <p className="text-[8px] font-black text-[#ba1f3d] uppercase tracking-widest mb-1">
        {product.subCategory || product.bucket}
      </p>
      <p className="text-xs font-black uppercase tracking-tight text-gray-900 truncate group-hover:text-[#ba1f3d] transition-colors">
        {product.name}
      </p>
      <p className="text-sm font-black text-gray-900 mt-1">
        {formatPrice(product.price)}
      </p>
    </Link>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN SEARCH PAGE
// ─────────────────────────────────────────────────────────────────

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlQuery  = searchParams.get('q') ?? '';
  const [input,   setInput]   = useState(urlQuery);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter,    setStockFilter]    = useState('all');
  const [sortBy,         setSortBy]         = useState('relevance');
  const [filtersOpen,    setFiltersOpen]    = useState(false);

  // Fetch all products once
  useEffect(() => {
    fetch(apiUrl('/api/public/products'))
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // Update URL when user submits search
  const handleSearch = (e) => {
    e.preventDefault();
    const q = input.trim();
    if (q) setSearchParams({ q }, { replace: false });
    else   setSearchParams({}, { replace: true });
  };

  const handleClear = () => {
    setInput('');
    setSearchParams({}, { replace: true });
  };

  // Derived: categories from loaded products
  const categories = useMemo(() => (
    ['all', ...new Set(products.map(p => p.bucket).filter(Boolean))]
  ), [products]);

  // Derived: filtered + sorted results
  const results = useMemo(() => {
    const q = urlQuery.toLowerCase().trim();
    if (!q && categoryFilter === 'all' && stockFilter === 'all') return [];

    let filtered = products.filter(p => {
      const matchesQuery = !q
        || p.name?.toLowerCase().includes(q)
        || p.bucket?.toLowerCase().includes(q)
        || p.subCategory?.toLowerCase().includes(q)
        || p.specs?.some(s => s.toLowerCase().includes(q))
        || p.colors?.some(c => c.toLowerCase().includes(q));

      const matchesCategory = categoryFilter === 'all' || p.bucket === categoryFilter;

      const matchesStock =
        stockFilter === 'all'      ? true :
        stockFilter === 'in-stock' ? p.quantity > 0 :
        stockFilter === 'out'      ? p.quantity === 0 : true;

      return matchesQuery && matchesCategory && matchesStock;
    });

    switch (sortBy) {
      case 'price-asc':  return filtered.sort((a, b) => a.price - b.price);
      case 'price-desc': return filtered.sort((a, b) => b.price - a.price);
      case 'rating':     return filtered.sort((a, b) => (b.rating ?? 5) - (a.rating ?? 5));
      default:           return filtered; // relevance = natural order
    }
  }, [products, urlQuery, categoryFilter, stockFilter, sortBy]);

  const showResults = urlQuery || categoryFilter !== 'all' || stockFilter !== 'all';

  return (
    <div className="min-h-screen bg-white">

      {/* ── Search Header ──────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5">
          <form onSubmit={handleSearch} className="flex items-center space-x-3">
            {/* Back */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 text-gray-400 hover:text-gray-900 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} />
            </button>

            {/* Input */}
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Search products, categories, colors..."
                autoFocus
                className="w-full pl-11 pr-10 py-3.5 border-2 border-gray-200 focus:border-[#ba1f3d] outline-none text-sm font-bold transition-all placeholder:text-gray-300 placeholder:font-normal"
              />
              {input && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Search button */}
            <button
              type="submit"
              className="px-6 py-3.5 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex-shrink-0"
            >
              Search
            </button>

            {/* Filter toggle (mobile) */}
            <button
              type="button"
              onClick={() => setFiltersOpen(f => !f)}
              className={`p-3.5 border-2 transition-all flex-shrink-0 ${
                filtersOpen ? 'border-[#ba1f3d] text-[#ba1f3d]' : 'border-gray-200 text-gray-400'
              }`}
            >
              <SlidersHorizontal size={16} />
            </button>
          </form>

          {/* Filters row */}
          {filtersOpen && (
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100 animate-fade-up">
              {/* Category */}
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#ba1f3d] transition-all bg-white"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
                ))}
              </select>

              {/* Stock */}
              <select
                value={stockFilter}
                onChange={e => setStockFilter(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#ba1f3d] transition-all bg-white"
              >
                <option value="all">All Stock</option>
                <option value="in-stock">In Stock Only</option>
                <option value="out">Out of Stock</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#ba1f3d] transition-all bg-white"
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>

              {/* Reset filters */}
              {(categoryFilter !== 'all' || stockFilter !== 'all' || sortBy !== 'relevance') && (
                <button
                  onClick={() => { setCategoryFilter('all'); setStockFilter('all'); setSortBy('relevance'); }}
                  className="text-[9px] font-black uppercase tracking-widest text-[#ba1f3d] border-b border-[#ba1f3d]/30 hover:border-[#ba1f3d] pb-0.5 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Results Area ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">

        {/* No query yet */}
        {!showResults && !loading && (
          <div className="text-center py-24">
            <Search size={48} className="mx-auto text-gray-100 mb-6" />
            <p className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-2">
              What are you looking for?
            </p>
            <p className="text-gray-400 font-bold text-sm">
              Search by product name, category, color, or style
            </p>

            {/* Popular categories */}
            <div className="flex flex-wrap justify-center gap-3 mt-10">
              {['Tops', 'Bottoms', 'Footwear', 'Accessories'].map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategoryFilter(cat); setFiltersOpen(true); }}
                  className="px-6 py-3 border-2 border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-[#ba1f3d] hover:text-[#ba1f3d] transition-all"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[4/5] bg-gray-100 animate-pulse" />
                <div className="h-3 w-3/4 bg-gray-100 animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && showResults && (
          <>
            {/* Result count */}
            <div className="flex items-center justify-between mb-8">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">
                {results.length === 0
                  ? 'No results'
                  : `${results.length} result${results.length !== 1 ? 's' : ''}`}
                {urlQuery && (
                  <span className="text-gray-900 ml-1">for "{urlQuery}"</span>
                )}
              </p>
            </div>

            {/* No results */}
            {results.length === 0 && (
              <div className="text-center py-20">
                <Package size={48} className="mx-auto text-gray-200 mb-6" />
                <p className="text-xl font-black uppercase tracking-tighter text-gray-900 mb-2">
                  Nothing found
                </p>
                <p className="text-gray-400 font-bold text-sm mb-8">
                  Try different keywords or browse our categories
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center space-x-2 px-8 py-4 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                >
                  <span>Browse All Products</span>
                </Link>
              </div>
            )}

            {/* Grid */}
            {results.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
                {results.map(product => (
                  <SearchProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;