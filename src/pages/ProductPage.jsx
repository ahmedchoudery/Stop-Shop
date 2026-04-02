/**
 * @fileoverview ProductPage.jsx
 * Route: /product/:id
 *
 * Individual product page with:
 * - Full image gallery with thumbnail strip
 * - Size + color selector
 * - Add to cart / wishlist
 * - Product specs
 * - Related products (same category)
 * - SEO meta tags via document.title
 * - Share button (copies URL to clipboard)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight,
  Star, Package, Truck, Shield, RotateCcw, Check, Copy,
  ArrowLeft, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { apiUrl } from '../config/api.js';
import MediaRenderer from '../components/MediaRenderer.jsx';

// ─────────────────────────────────────────────────────────────────
// RELATED PRODUCTS
// ─────────────────────────────────────────────────────────────────

const RelatedProducts = ({ currentId, category, allProducts }) => {
  const related = allProducts
    .filter(p => p.bucket === category && p.id !== currentId && p.quantity > 0)
    .slice(0, 4);

  if (!related.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 border-t border-gray-100">
      <div className="mb-10">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">
          You May Also Like
        </p>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">
          From {category}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {related.map(product => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            className="group block"
          >
            <div className="aspect-[4/5] bg-gray-100 overflow-hidden mb-3 relative">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={28} className="text-gray-300" />
                </div>
              )}
              {product.quantity < 5 && product.quantity > 0 && (
                <div className="absolute top-2 left-2 bg-orange-500 text-white text-[7px] font-black uppercase tracking-widest px-2 py-0.5">
                  Low Stock
                </div>
              )}
            </div>
            <p className="text-[9px] font-black text-[#ba1f3d] uppercase tracking-widest mb-1">
              {product.subCategory || product.bucket}
            </p>
            <p className="text-xs font-black uppercase tracking-tight text-gray-900 truncate mb-1 group-hover:text-[#ba1f3d] transition-colors">
              {product.name}
            </p>
            <p className="text-sm font-black text-gray-900">
              Rs. {Number(product.price).toLocaleString('en-PK')}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────
// TRUST BADGES
// ─────────────────────────────────────────────────────────────────

const TRUST_BADGES = [
  { icon: Truck,      label: 'Free Delivery',    sub: 'On orders over Rs. 2,000' },
  { icon: RotateCcw,  label: 'Easy Returns',     sub: '7-day return policy' },
  { icon: Shield,     label: 'Secure Payment',   sub: '256-bit SSL encrypted' },
  { icon: Package,    label: 'Authentic',         sub: 'Original Stop & Shop' },
];

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────

const ProductPage = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { addToCart, openDrawer } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();

  const [product,      setProduct]      = useState(null);
  const [allProducts,  setAllProducts]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const [selectedSize,  setSelectedSize]  = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [galleryIndex,  setGalleryIndex]  = useState(0);
  const [cartAdded,     setCartAdded]     = useState(false);
  const [copied,        setCopied]        = useState(false);
  const [specsOpen,     setSpecsOpen]     = useState(false);
  const [sizeError,     setSizeError]     = useState(false);

  // ── Fetch product ───────────────────────────────────────────────
  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      setError('');
      try {
        const [prodRes, allRes] = await Promise.all([
          fetch(apiUrl(`/api/public/products/${id}`)),
          fetch(apiUrl('/api/public/products')),
        ]);

        if (!prodRes.ok) {
          if (prodRes.status === 404) {
            setError('Product not found');
          } else {
            setError('Failed to load product');
          }
          return;
        }

        const [prod, all] = await Promise.all([prodRes.json(), allRes.json()]);
        setProduct(prod);
        setAllProducts(Array.isArray(all) ? all : []);

        // Set defaults
        if (prod.colors?.length) setSelectedColor(prod.colors[0]);
        if (prod.sizes?.length === 1) setSelectedSize(prod.sizes[0]);

        // SEO
        document.title = `${prod.name} — Stop & Shop`;
      } catch {
        setError('Could not connect. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetch_();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => { document.title = 'Stop & Shop | Premium Clothing'; };
  }, [id]);

  // ── Build gallery from all available images ─────────────────────
  const gallery = product ? [
    product.image,
    ...(product.gallery ?? []),
    ...(selectedColor && product.variantImages?.[selectedColor]
      ? [product.variantImages[selectedColor]]
      : []),
  ].filter(Boolean) : [];

  // ── Stock availability ──────────────────────────────────────────
  const getStock = () => {
    if (!product) return 0;
    if (selectedSize && product.sizeStock) {
      const ss = product.sizeStock instanceof Map
        ? product.sizeStock.get(selectedSize)
        : product.sizeStock[selectedSize];
      return ss ?? 0;
    }
    return product.quantity ?? 0;
  };

  const stockQty    = getStock();
  const isWished    = product ? isWishlisted(product.id) : false;
  const outOfStock  = stockQty === 0;

  // ── Add to cart ─────────────────────────────────────────────────
  const handleAddToCart = useCallback(() => {
    if (!product) return;

    if (product.sizes?.length > 1 && !selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }
    if (outOfStock) return;

    addToCart({
      ...product,
      selectedSize,
      selectedColor,
      quantity: 1,
    });

    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
    setTimeout(() => openDrawer('cart'), 400);
  }, [product, selectedSize, selectedColor, outOfStock, addToCart, openDrawer]);

  // ── Share ───────────────────────────────────────────────────────
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Loading skeleton ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="aspect-square bg-gray-100 animate-pulse rounded-sm" />
          <div className="space-y-6 pt-4">
            <div className="h-3 w-24 bg-gray-100 animate-pulse rounded" />
            <div className="h-10 w-3/4 bg-gray-100 animate-pulse rounded" />
            <div className="h-8 w-1/3 bg-gray-100 animate-pulse rounded" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-3 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <Package size={48} className="text-gray-200 mb-6" />
        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-2">{error}</h2>
        <p className="text-gray-400 text-sm mb-8">The product you're looking for doesn't exist or was removed.</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 px-8 py-4 bg-[#ba1f3d] text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all"
        >
          <ArrowLeft size={14} />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="bg-white">

      {/* ── Breadcrumb ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
        <nav className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-gray-400">
          <Link to="/" className="hover:text-[#ba1f3d] transition-colors">Home</Link>
          <ChevronRight size={10} />
          <span className="hover:text-[#ba1f3d] transition-colors cursor-pointer"
            onClick={() => navigate('/')}>
            {product.bucket}
          </span>
          <ChevronRight size={10} />
          <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* ── Main Grid ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">

          {/* ── Left: Gallery ──────────────────────────────── */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden group">
              {gallery.length > 0 ? (
                <MediaRenderer
                  src={product.mediaType === 'embed' ? null : gallery[galleryIndex]}
                  embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
                  mediaType={product.mediaType}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={64} className="text-gray-200" />
                </div>
              )}

              {/* Arrows */}
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={() => setGalleryIndex(i => (i - 1 + gallery.length) % gallery.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setGalleryIndex(i => (i + 1) % gallery.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* Stock badge */}
              {outOfStock && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="text-gray-900 font-black uppercase tracking-[0.5em] text-[10px] border-b-2 border-gray-900 pb-1">
                    Sold Out
                  </span>
                </div>
              )}

              {/* Low stock warning */}
              {!outOfStock && stockQty < 5 && (
                <div className="absolute top-3 left-3 bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1">
                  Only {stockQty} left
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {gallery.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-1">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryIndex(i)}
                    className={`w-16 h-20 flex-shrink-0 overflow-hidden border-2 transition-all ${
                      i === galleryIndex ? 'border-[#ba1f3d]' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Details ─────────────────────────────── */}
          <div className="lg:pt-4 space-y-7">

            {/* Category label */}
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d]">
              {product.subCategory || product.bucket}
            </p>

            {/* Name */}
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < (product.rating ?? 5) ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-gray-200'}
                  />
                ))}
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {product.rating ?? 5}.0
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline space-x-3">
              <p className="text-3xl font-black text-gray-900 tracking-tighter">
                {formatPrice(product.price)}
              </p>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                incl. taxes
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* Color selector */}
            {product.colors?.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-3">
                  Color — <span className="text-gray-900">{selectedColor || 'Select'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(color => {
                    const hex = color.includes('|') ? color.split('|')[0] : color;
                    const label = color.split('|').pop();
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          // Show variant image if available
                          if (product.variantImages?.[color]) {
                            const idx = gallery.indexOf(product.variantImages[color]);
                            if (idx > -1) setGalleryIndex(idx);
                          }
                        }}
                        title={label}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                          selectedColor === color
                            ? 'border-[#ba1f3d] scale-110 ring-2 ring-offset-2 ring-[#ba1f3d]/30'
                            : 'border-gray-200 hover:scale-110'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size selector */}
            {product.sizes?.length > 0 && (
              <div>
                <p className={`text-[9px] font-black uppercase tracking-[0.4em] mb-3 ${
                  sizeError ? 'text-[#ba1f3d] animate-pulse' : 'text-gray-400'
                }`}>
                  Size — {sizeError ? 'Please select a size' : (selectedSize || 'Select')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => {
                    const sizeQty = product.sizeStock instanceof Map
                      ? (product.sizeStock.get(size) ?? 0)
                      : (product.sizeStock?.[size] ?? 0);
                    const unavailable = sizeQty === 0;

                    return (
                      <button
                        key={size}
                        onClick={() => { if (!unavailable) { setSelectedSize(size); setSizeError(false); } }}
                        disabled={unavailable}
                        className={`
                          min-w-[44px] h-11 px-3 border-2 text-[10px] font-black uppercase tracking-widest
                          transition-all duration-200
                          ${unavailable
                            ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                            : selectedSize === size
                              ? 'border-[#ba1f3d] bg-[#ba1f3d] text-white'
                              : 'border-gray-200 text-gray-900 hover:border-gray-900'
                          }
                        `}
                      >
                        {size}
                        {unavailable && <span className="block text-[7px] normal-case no-underline">sold</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className={`
                  flex-1 flex items-center justify-center space-x-3 py-4
                  text-[10px] font-black uppercase tracking-[0.3em]
                  transition-all duration-300
                  ${outOfStock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : cartAdded
                      ? 'bg-green-600 text-white'
                      : 'bg-[#ba1f3d] text-white hover:bg-gray-900 shadow-xl shadow-red-100/50'
                  }
                `}
              >
                {cartAdded ? (
                  <><Check size={15} /><span>Added to Bag</span></>
                ) : outOfStock ? (
                  <><AlertTriangle size={15} /><span>Sold Out</span></>
                ) : (
                  <><ShoppingCart size={15} /><span>Add to Bag</span></>
                )}
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`
                  w-14 h-14 flex items-center justify-center border-2
                  transition-all duration-200
                  ${isWished
                    ? 'border-[#ba1f3d] bg-[#ba1f3d]/5 text-[#ba1f3d]'
                    : 'border-gray-200 text-gray-400 hover:border-[#ba1f3d] hover:text-[#ba1f3d]'
                  }
                `}
              >
                <Heart size={18} className={isWished ? 'fill-[#ba1f3d]' : ''} />
              </button>

              <button
                onClick={handleShare}
                className="w-14 h-14 flex items-center justify-center border-2 border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900 transition-all duration-200"
                title="Copy product link"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />}
              </button>
            </div>

            {/* Product specs */}
            {product.specs?.length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <button
                  onClick={() => setSpecsOpen(s => !s)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-700">
                    Product Details
                  </span>
                  {specsOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </button>

                {specsOpen && (
                  <ul className="mt-4 space-y-2 animate-fade-up">
                    {product.specs.map((spec, i) => (
                      <li key={i} className="flex items-start space-x-2 text-xs font-bold text-gray-600">
                        <span className="w-1 h-1 rounded-full bg-[#ba1f3d] mt-1.5 flex-shrink-0" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* SKU */}
            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest border-t border-gray-50 pt-4">
              SKU: {product.id}
            </p>
          </div>
        </div>
      </div>

      {/* ── Trust Badges ───────────────────────────────────── */}
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-start space-x-3">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                  <Icon size={16} className="text-[#ba1f3d]" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-gray-900">{label}</p>
                  <p className="text-[9px] font-bold text-gray-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Related Products ───────────────────────────────── */}
      <RelatedProducts
        currentId={product.id}
        category={product.bucket}
        allProducts={allProducts}
      />
    </div>
  );
};

export default ProductPage;