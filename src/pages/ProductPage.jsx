/**
 * @fileoverview ProductPage.jsx
 * Route: /product/:id
 *
 * NEW in this version:
 *  1. Dynamic SEO meta tags per product (title, description, og:image, og:url)
 *     → WhatsApp/Facebook/Google previews now show product info + image
 *  2. WhatsApp Share button — pre-fills message with product name, price, and URL
 *  3. ProductReviews section at the bottom per product
 *  4. Related products from same category
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight,
  Star, Package, Truck, Shield, RotateCcw, Check,
  ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, MessageCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { apiUrl } from '../config/api.js';
import MediaRenderer from '../components/MediaRenderer.jsx';
import ProductReviews from '../components/ProductReviews.jsx';

// ─────────────────────────────────────────────────────────────────
// SEO META HELPER
// Sets document.title + meta tags dynamically per product.
// WhatsApp reads og:title, og:description, og:image when link is pasted.
// ─────────────────────────────────────────────────────────────────

const setProductMeta = (product) => {
  const url         = window.location.href;
  const title       = `${product.name} — Stop & Shop`;
  const description = `${product.name} | Rs. ${Number(product.price).toLocaleString('en-PK')} | ${product.bucket}${product.subCategory && product.subCategory !== 'General' ? ' · ' + product.subCategory : ''} | Premium clothing by Stop & Shop, Gujrat.`;
  const image       = product.image || 'https://stop-shop-gamma.vercel.app/og-image.jpg';

  // Document title
  document.title = title;

  // Helper: upsert meta tag
  const upsert = (selector, attr, val) => {
    let el = document.querySelector(selector);
    if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  };

  // Standard
  upsert('meta[name="description"]', 'content', description);

  // Open Graph (WhatsApp, Facebook, LinkedIn)
  upsert('meta[property="og:title"]',       'content', title);
  upsert('meta[property="og:description"]', 'content', description);
  upsert('meta[property="og:image"]',       'content', image);
  upsert('meta[property="og:url"]',         'content', url);
  upsert('meta[property="og:type"]',        'content', 'product');

  // Set property attribute as well
  const setOgProp = (prop, val) => {
    let el = document.querySelector(`meta[property="${prop}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', prop);
      document.head.appendChild(el);
    }
    el.setAttribute('content', val);
  };

  setOgProp('og:title', title);
  setOgProp('og:description', description);
  setOgProp('og:image', image);
  setOgProp('og:url', url);

  // Twitter Card
  upsert('meta[name="twitter:card"]',        'content', 'summary_large_image');
  upsert('meta[name="twitter:title"]',       'content', title);
  upsert('meta[name="twitter:description"]', 'content', description);
  upsert('meta[name="twitter:image"]',       'content', image);

  // Canonical
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
  canonical.setAttribute('href', url);
};

const resetMeta = () => {
  document.title = 'Stop & Shop | Premium Clothing & Fashion';
  const reset = (selector, val) => { const el = document.querySelector(selector); if (el) el.setAttribute('content', val); };
  reset('meta[name="description"]', 'Discover premium clothing, shoes, and fashion accessories at Stop & Shop.');
  reset('meta[property="og:title"]', 'Stop & Shop | Premium Clothing & Fashion');
  reset('meta[property="og:description"]', 'Discover premium clothing at Stop & Shop.');
  reset('meta[property="og:image"]', 'https://stop-shop-gamma.vercel.app/og-image.jpg');
};

// ─────────────────────────────────────────────────────────────────
// WHATSAPP SHARE
// ─────────────────────────────────────────────────────────────────

const WhatsAppShareButton = ({ product }) => {
  const [copied, setCopied] = useState(false);

  const handleWhatsAppShare = () => {
    const url     = window.location.href;
    const price   = `Rs. ${Number(product.price).toLocaleString('en-PK')}`;
    const message = `Check out this product from Stop & Shop! 🛍️\n\n*${product.name}*\nPrice: ${price}\n${product.bucket}${product.subCategory && product.subCategory !== 'General' ? ' · ' + product.subCategory : ''}\n\n${url}\n\n_Shop now at Stop & Shop — Premium Fashion, Gujrat_`;

    // Mobile → open WhatsApp directly
    // Desktop → WhatsApp Web
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const waUrl    = isMobile
      ? `whatsapp://send?text=${encodeURIComponent(message)}`
      : `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex space-x-2">
      {/* WhatsApp share */}
      <button
        onClick={handleWhatsAppShare}
        className="flex items-center space-x-2 px-4 py-2.5 bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#1ebe5d] transition-all duration-200 rounded-sm shadow-lg shadow-green-200/50"
        title="Share on WhatsApp"
      >
        <MessageCircle size={14} />
        <span className="hidden sm:inline">Share on WhatsApp</span>
        <span className="sm:hidden">WhatsApp</span>
      </button>

      {/* Copy link */}
      <button
        onClick={handleCopyLink}
        className={`flex items-center space-x-2 px-4 py-2.5 border-2 text-[10px] font-black uppercase tracking-widest transition-all duration-200 rounded-sm ${
          copied
            ? 'border-green-400 text-green-600 bg-green-50'
            : 'border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900'
        }`}
        title="Copy product link"
      >
        {copied ? <Check size={14} /> : <Share2 size={14} />}
        <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// RELATED PRODUCTS
// ─────────────────────────────────────────────────────────────────

const RelatedProducts = ({ currentId, category, subCategory, allProducts }) => {
  const { formatPrice } = useCurrency();

  // Prefer same subCategory first, fall back to same category
  const related = [
    ...allProducts.filter(p => p.bucket === category && p.subCategory === subCategory && p.id !== currentId && p.quantity > 0),
    ...allProducts.filter(p => p.bucket === category && p.subCategory !== subCategory && p.id !== currentId && p.quantity > 0),
  ].slice(0, 4);

  if (!related.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 border-t border-gray-100">
      <div className="mb-8">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">You May Also Like</p>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">From {category}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {related.map(product => (
          <Link key={product.id} to={`/product/${product.id}`} className="group block" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="aspect-[4/5] bg-gray-100 overflow-hidden mb-3 relative">
              {product.image
                ? <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                : <div className="w-full h-full flex items-center justify-center"><Package size={28} className="text-gray-300" /></div>
              }
            </div>
            <p className="text-[9px] font-black text-[#ba1f3d] uppercase tracking-widest mb-1">
              {product.subCategory && product.subCategory !== 'General' ? product.subCategory : product.bucket}
            </p>
            <p className="text-xs font-black uppercase tracking-tight text-gray-900 truncate mb-1 group-hover:text-[#ba1f3d] transition-colors">{product.name}</p>
            <p className="text-sm font-black text-gray-900">{formatPrice(product.price)}</p>
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
  { icon: Truck,     label: 'Free Delivery',  sub: 'On orders over Rs. 2,000' },
  { icon: RotateCcw, label: 'Easy Returns',   sub: '7-day return policy' },
  { icon: Shield,    label: 'Secure Payment', sub: '256-bit SSL encrypted' },
  { icon: Package,   label: 'Authentic',      sub: 'Original Stop & Shop' },
];

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [specsOpen,     setSpecsOpen]     = useState(false);
  const [sizeError,     setSizeError]     = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [prodRes, allRes] = await Promise.all([
          fetch(apiUrl(`/api/public/products/${id}`)),
          fetch(apiUrl('/api/public/products')),
        ]);
        if (!prodRes.ok) { setError(prodRes.status === 404 ? 'Product not found' : 'Failed to load product'); return; }
        const [prod, all] = await Promise.all([prodRes.json(), allRes.json()]);
        setProduct(prod);
        setAllProducts(Array.isArray(all) ? all : []);
        if (prod.colors?.length) setSelectedColor(prod.colors[0]);
        if (prod.sizes?.length === 1) setSelectedSize(prod.sizes[0]);

        // ── Set SEO meta tags ──────────────────────────────────
        setProductMeta(prod);
      } catch {
        setError('Could not connect. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => resetMeta(); // Restore defaults when leaving product page
  }, [id]);

  // ── Gallery ────────────────────────────────────────────────────
  const gallery = product ? [
    product.image,
    ...(product.gallery ?? []),
    ...(selectedColor && product.variantImages?.[selectedColor] ? [product.variantImages[selectedColor]] : []),
  ].filter(Boolean) : [];

  // ── Stock ──────────────────────────────────────────────────────
  const getStock = () => {
    if (!product) return 0;
    if (selectedSize && product.sizeStock) {
      const ss = product.sizeStock instanceof Map ? product.sizeStock.get(selectedSize) : product.sizeStock[selectedSize];
      return ss ?? 0;
    }
    return product.quantity ?? 0;
  };
  const stockQty   = getStock();
  const outOfStock = stockQty === 0;
  const isWished   = product ? isWishlisted(product.id) : false;

  // ── Add to cart ────────────────────────────────────────────────
  const handleAddToCart = useCallback(() => {
    if (!product || outOfStock) return;
    if (product.sizes?.length > 1 && !selectedSize) { setSizeError(true); setTimeout(() => setSizeError(false), 2500); return; }
    addToCart({ ...product, selectedSize, selectedColor, quantity: 1 });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
    setTimeout(() => openDrawer('cart'), 400);
  }, [product, selectedSize, selectedColor, outOfStock, addToCart, openDrawer]);

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="aspect-square bg-gray-100 animate-pulse rounded-sm" />
          <div className="space-y-5 pt-4">
            {[24, 48, 20, 12, 12, 12].map((h, i) => (
              <div key={i} className="bg-gray-100 animate-pulse rounded" style={{ height: h, width: i < 2 ? '75%' : '100%' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <Package size={48} className="text-gray-200 mb-6" />
        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-2">{error}</h2>
        <button onClick={() => navigate(-1)} className="flex items-center space-x-2 px-8 py-4 bg-[#ba1f3d] text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all mt-6">
          <ArrowLeft size={14} /><span>Go Back</span>
        </button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="bg-white">

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5">
        <nav className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-gray-400">
          <Link to="/" className="hover:text-[#ba1f3d] transition-colors">Home</Link>
          <ChevronRight size={10} />
          <button onClick={() => navigate('/')} className="hover:text-[#ba1f3d] transition-colors">{product.bucket}</button>
          {product.subCategory && product.subCategory !== 'General' && (
            <><ChevronRight size={10} /><span className="hover:text-[#ba1f3d] transition-colors cursor-pointer">{product.subCategory}</span></>
          )}
          <ChevronRight size={10} />
          <span className="text-gray-900 truncate max-w-[180px]">{product.name}</span>
        </nav>
      </div>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

          {/* ── Gallery ── */}
          <div className="space-y-3">
            <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden group">
              {gallery.length > 0
                ? <MediaRenderer src={product.mediaType === 'embed' ? null : gallery[galleryIndex]} embedCode={product.mediaType === 'embed' ? product.embedCode : undefined} mediaType={product.mediaType} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                : <div className="w-full h-full flex items-center justify-center bg-gray-100"><Package size={64} className="text-gray-200" /></div>
              }
              {gallery.length > 1 && (
                <>
                  <button onClick={() => setGalleryIndex(i => (i - 1 + gallery.length) % gallery.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ba1f3d] hover:text-white"><ChevronLeft size={16} /></button>
                  <button onClick={() => setGalleryIndex(i => (i + 1) % gallery.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ba1f3d] hover:text-white"><ChevronRight size={16} /></button>
                </>
              )}
              {outOfStock && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="text-gray-900 font-black uppercase tracking-[0.5em] text-[10px] border-b-2 border-gray-900 pb-1">Sold Out</span>
                </div>
              )}
              {!outOfStock && stockQty < 5 && (
                <div className="absolute top-3 left-3 bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1">Only {stockQty} left</div>
              )}
              {gallery.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5">
                  {gallery.map((_, i) => (
                    <button key={i} onClick={() => setGalleryIndex(i)} className={`h-1.5 rounded-full transition-all ${i === galleryIndex ? 'bg-[#ba1f3d] w-4' : 'bg-white/60 w-1.5'}`} />
                  ))}
                </div>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-1">
                {gallery.map((img, i) => (
                  <button key={i} onClick={() => setGalleryIndex(i)} className={`w-16 h-20 flex-shrink-0 overflow-hidden border-2 transition-all ${i === galleryIndex ? 'border-[#ba1f3d]' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product details ── */}
          <div className="lg:pt-2 space-y-6">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d]">
              {product.subCategory && product.subCategory !== 'General' ? product.subCategory : product.bucket}
            </p>

            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-gray-900 leading-tight">{product.name}</h1>

            <div className="flex items-center space-x-2">
              <div className="flex space-x-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={13} className={i < (product.rating ?? 5) ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-gray-200'} />)}</div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{product.rating ?? 5}.0</span>
            </div>

            <p className="text-3xl font-black text-gray-900 tracking-tighter">{formatPrice(product.price)}</p>

            <div className="h-px bg-gray-100" />

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-3">
                  Color — <span className="text-gray-900">{selectedColor ? selectedColor.split('|').pop() : 'Select'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(color => {
                    const hex = color.includes('|') ? color.split('|')[0] : color;
                    return (
                      <button key={color} onClick={() => { setSelectedColor(color); const vi = product.variantImages?.[color]; if (vi) { const idx = gallery.indexOf(vi); if (idx > -1) setGalleryIndex(idx); } }} title={color.split('|').pop()}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${selectedColor === color ? 'border-[#ba1f3d] scale-110 ring-2 ring-offset-2 ring-[#ba1f3d]/30' : 'border-gray-200 hover:scale-110'}`}
                        style={{ backgroundColor: hex }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div>
                <p className={`text-[9px] font-black uppercase tracking-[0.4em] mb-3 transition-colors ${sizeError ? 'text-[#ba1f3d]' : 'text-gray-400'}`}>
                  Size — {sizeError ? '⚠ Please select a size' : (selectedSize || 'Select')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => {
                    const sizeQty = product.sizeStock instanceof Map ? (product.sizeStock.get(size) ?? 0) : (product.sizeStock?.[size] ?? 0);
                    const unavailable = sizeQty === 0;
                    return (
                      <button key={size} onClick={() => { if (!unavailable) { setSelectedSize(size); setSizeError(false); } }} disabled={unavailable}
                        className={`min-w-[44px] h-11 px-3 border-2 text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${unavailable ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through' : selectedSize === size ? 'border-[#ba1f3d] bg-[#ba1f3d] text-white' : 'border-gray-200 text-gray-900 hover:border-gray-900'}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cart + Wishlist */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className={`flex-1 flex items-center justify-center space-x-3 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 ${outOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : cartAdded ? 'bg-green-600 text-white' : 'bg-[#ba1f3d] text-white hover:bg-gray-900 shadow-xl shadow-red-100/50'}`}
              >
                {cartAdded ? <><Check size={15} /><span>Added to Bag</span></> : outOfStock ? <><AlertTriangle size={15} /><span>Sold Out</span></> : <><ShoppingCart size={15} /><span>Add to Bag</span></>}
              </button>

              <button onClick={() => toggleWishlist(product)} className={`w-14 h-14 flex items-center justify-center border-2 transition-all duration-200 ${isWished ? 'border-[#ba1f3d] bg-[#ba1f3d]/5 text-[#ba1f3d]' : 'border-gray-200 text-gray-400 hover:border-[#ba1f3d] hover:text-[#ba1f3d]'}`}>
                <Heart size={18} className={isWished ? 'fill-[#ba1f3d]' : ''} />
              </button>
            </div>

            {/* ── WhatsApp Share ─────────────────────────────── */}
            <WhatsAppShareButton product={product} />

            {/* Specs */}
            {product.specs?.filter(Boolean).length > 0 && (
              <div className="border-t border-gray-100 pt-5">
                <button onClick={() => setSpecsOpen(s => !s)} className="w-full flex items-center justify-between text-left">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-700">Product Details</span>
                  {specsOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </button>
                {specsOpen && (
                  <ul className="mt-4 space-y-2 animate-fade-up">
                    {product.specs.filter(Boolean).map((spec, i) => (
                      <li key={i} className="flex items-start space-x-2 text-xs font-bold text-gray-600">
                        <span className="w-1 h-1 rounded-full bg-[#ba1f3d] mt-1.5 flex-shrink-0" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest border-t border-gray-50 pt-4">SKU: {product.id}</p>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-start space-x-3">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                  <Icon size={15} className="text-[#ba1f3d]" />
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

      {/* Per-Product Reviews */}
      <ProductReviews productId={product.id} productName={product.name} />

      {/* Related Products */}
      <RelatedProducts
        currentId={product.id}
        category={product.bucket}
        subCategory={product.subCategory}
        allProducts={allProducts}
      />
    </div>
  );
};

export default ProductPage;