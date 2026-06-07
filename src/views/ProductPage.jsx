/**
 * ProductPage — Premium Minimalist Edition
 * Full-bleed gallery, surgical typography, zero clutter.
 * All business logic (SEO, cart, stock) preserved exactly.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart, ShoppingBag, Share2, MessageCircle, Check,
  ChevronRight, Star, Package, Truck, RotateCcw,
  Shield, ArrowLeft, AlertTriangle, ChevronLeft,
  Minus, Plus
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { apiUrl } from '../config/api.js';
import MediaRenderer from '../components/MediaRenderer.jsx';
import ProductReviews from '../components/ProductReviews.jsx';
import MagneticElement from '../components/MagneticElement.jsx';

// ── SEO helpers (preserved exactly) ─────────────────────────────

const setProductMeta = (product) => {
  const url = window.location.href;
  const title = `${product.name} — Stop & Shop`;
  const description = `${product.name} | Rs. ${Number(product.price).toLocaleString('en-PK')} | ${product.bucket}${product.subCategory && product.subCategory !== 'General' ? ' · ' + product.subCategory : ''} | Premium clothing by Stop & Shop, Gujrat.`;
  const image = product.image || 'https://stop-shop-gamma.vercel.app/og-image.jpg';
  document.title = title;
  const upsert = (sel, attr, val) => {
    let el = document.querySelector(sel);
    if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  };
  upsert('meta[name="description"]', 'content', description);
  ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'].forEach((p, i) => {
    const vals = [title, description, image, url, 'product'];
    const el = document.querySelector(`meta[property="${p}"]`) || (() => {
      const m = document.createElement('meta');
      m.setAttribute('property', p);
      document.head.appendChild(m);
      return m;
    })();
    el.setAttribute('content', vals[i]);
  });
  upsert('meta[name="twitter:card"]', 'content', 'summary_large_image');
  upsert('meta[name="twitter:title"]', 'content', title);
  upsert('meta[name="twitter:description"]', 'content', description);
  upsert('meta[name="twitter:image"]', 'content', image);
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
  canonical.setAttribute('href', url);
};

const resetMeta = () => {
  document.title = 'Stop & Shop | Premium Clothing & Fashion';
  const reset = (sel, val) => { const el = document.querySelector(sel); if (el) el.setAttribute('content', val); };
  reset('meta[name="description"]', 'Discover premium clothing, shoes, and fashion accessories at Stop & Shop.');
  reset('meta[property="og:title"]', 'Stop & Shop | Premium Clothing & Fashion');
  reset('meta[property="og:image"]', 'https://stop-shop-gamma.vercel.app/og-image.jpg');
};

// ── Trust Badges ─────────────────────────────────────────────────

const TRUST = [
  { Icon: Truck,     label: 'Delivery',  sub: 'Orders over Rs. 2,000' },
  { Icon: RotateCcw, label: 'Returns',   sub: '7-day easy returns' },
  { Icon: Shield,    label: 'Secure',    sub: 'SSL encrypted checkout' },
  { Icon: Package,   label: 'Authentic', sub: 'Original Stop & Shop' },
];

// ── Related Products ─────────────────────────────────────────────

const RelatedProducts = ({ currentId, category, subCategory, allProducts }) => {
  const { formatPrice } = useCurrency();
  const related = [
    ...allProducts.filter(p => p.bucket === category && p.subCategory === subCategory && p.id !== currentId && p.quantity > 0),
    ...allProducts.filter(p => p.bucket === category && p.subCategory !== subCategory && p.id !== currentId && p.quantity > 0),
  ].slice(0, 4);
  if (!related.length) return null;

  return (
    <section className="border-t border-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-cardinal mb-2">You May Also Like</p>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">From {category}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {related.map(product => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="group block"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="aspect-[3/4] bg-[#F8F7F5] overflow-hidden mb-3">
                {product.image
                  ? <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-600" />
                  : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-gray-300" /></div>
                }
              </div>
              <p className="text-[8px] font-bold uppercase tracking-[0.35em] text-gray-400 mb-1">
                {product.subCategory && product.subCategory !== 'General' ? product.subCategory : product.bucket}
              </p>
              <p className="text-[11px] font-black uppercase tracking-tight text-gray-900 mb-1 group-hover:text-cardinal transition-colors line-clamp-1">
                {product.name}
              </p>
              <p className="text-sm font-black text-gray-900">{formatPrice(product.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Main ProductPage ─────────────────────────────────────────────

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, openDrawer } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [cartAdded, setCartAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qty, setQty] = useState(1);

  // Fetch product
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [prodRes, allRes] = await Promise.all([
          fetch(apiUrl(`/api/public/products/${id}?_t=${Date.now()}`)),
          fetch(apiUrl(`/api/public/products?_t=${Date.now()}`)),
        ]);
        if (!prodRes.ok) { setError(prodRes.status === 404 ? 'Product not found' : 'Failed to load'); return; }
        const [prod, all] = await Promise.all([prodRes.json(), allRes.json()]);
        setProduct(prod);
        setAllProducts(Array.isArray(all) ? all : []);
        if (prod.colors?.length) setSelectedColor(prod.colors[0]);
        if (prod.sizes?.length === 1) setSelectedSize(prod.sizes[0]);
        setProductMeta(prod);
        setQty(1);
      } catch {
        setError('Could not connect. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => resetMeta();
  }, [id]);

  const gallery = product ? [
    product.image,
    ...(product.gallery ?? []),
    ...(selectedColor && product.variantImages?.[selectedColor] ? [product.variantImages[selectedColor]] : []),
  ].filter(Boolean) : [];

  const getStock = () => {
    if (!product) return 0;
    if (selectedSize && product.sizeStock) {
      const ss = product.sizeStock instanceof Map ? product.sizeStock.get(selectedSize) : product.sizeStock[selectedSize];
      return ss ?? 0;
    }
    return product.quantity ?? 0;
  };

  const stockQty = getStock();
  const outOfStock = stockQty === 0;
  const isWished = product ? isWishlisted(product.id) : false;
  const category = product?.subCategory && product.subCategory !== 'General' ? product.subCategory : product?.bucket;

  const handleAddToCart = useCallback(() => {
    if (!product || outOfStock) return;
    if (product.sizes?.length > 1 && !selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2500);
      return;
    }
    addToCart({ ...product, selectedSize, selectedColor, quantity: qty });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
    setTimeout(() => openDrawer('cart'), 400);
  }, [product, selectedSize, selectedColor, qty, outOfStock, addToCart, openDrawer]);

  const handleWhatsAppShare = () => {
    if (!product) return;
    const url = window.location.href;
    const price = `Rs. ${Number(product.price).toLocaleString('en-PK')}`;
    const msg = `Check out this product from Stop & Shop! 🛍️\n\n*${product.name}*\nPrice: ${price}\n${product.bucket}\n\n${url}`;
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    window.open(
      isMobile ? `whatsapp://send?text=${encodeURIComponent(msg)}` : `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`,
      '_blank', 'noopener,noreferrer'
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Loading skeleton ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-3">
            <div className="aspect-[3/4] bg-[#F8F7F5] animate-pulse" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-[#F8F7F5] animate-pulse" />
              ))}
            </div>
          </div>
          <div className="space-y-6 pt-4">
            {[16, 40, 28, 20, 20, 48].map((h, i) => (
              <div key={i} className="bg-[#F8F7F5] animate-pulse" style={{ height: h, width: i < 2 ? '70%' : '100%' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 border border-gray-100 flex items-center justify-center mb-6">
          <Package size={24} strokeWidth={1} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-2">{error}</h2>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 mt-6 px-8 py-4 bg-cardinal text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-gray-900 transition-colors duration-300"
        >
          <ArrowLeft size={13} />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="bg-white">

      {/* ── Breadcrumb ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-5">
        <nav className="flex items-center space-x-2 text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400">
          <Link to="/" className="hover:text-cardinal transition-colors">Home</Link>
          <ChevronRight size={9} />
          <button onClick={() => navigate('/')} className="hover:text-cardinal transition-colors">
            {product.bucket}
          </button>
          {product.subCategory && product.subCategory !== 'General' && (
            <>
              <ChevronRight size={9} />
              <span>{product.subCategory}</span>
            </>
          )}
          <ChevronRight size={9} />
          <span className="text-gray-600 truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* ── Main Product Area ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-12 xl:gap-20">

          {/* ── Gallery ───────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative aspect-[4/5] bg-[#F8F7F5] overflow-hidden group">
              {gallery.length > 0 ? (
                <MediaRenderer
                  src={product.mediaType === 'embed' ? null : gallery[galleryIndex]}
                  embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
                  mediaType={product.mediaType}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={48} className="text-gray-200" />
                </div>
              )}

              {/* Gallery nav arrows */}
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={() => setGalleryIndex(i => (i - 1 + gallery.length) % gallery.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-cardinal hover:text-white"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => setGalleryIndex(i => (i + 1) % gallery.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-cardinal hover:text-white"
                  >
                    <ChevronRight size={15} />
                  </button>
                </>
              )}

              {/* Status badges */}
              {outOfStock && (
                <div className="absolute top-4 left-4 bg-white px-2.5 py-1.5">
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-500">Sold Out</span>
                </div>
              )}
              {!outOfStock && stockQty < 5 && (
                <div className="absolute top-4 left-4 bg-orange-500 px-2.5 py-1.5">
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-black">Only {stockQty} left</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {gallery.slice(0, 8).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryIndex(i)}
                    className={`aspect-square bg-[#F8F7F5] overflow-hidden border-2 transition-all duration-200 ${
                      i === galleryIndex ? 'border-gray-900' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Details ────────────────────────────────── */}
          <div className="lg:py-2">
            {/* Category + Rating */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black uppercase tracking-[0.45em] text-cardinal">
                {category}
              </p>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={11} className={i < (product.rating ?? 5) ? 'fill-amber-gold text-amber-gold' : 'text-gray-200'} />
                ))}
                <span className="text-[9px] font-bold text-gray-400 ml-1">{product.rating ?? 5}.0</span>
              </div>
            </div>

            {/* Name */}
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-gray-900 leading-[1.05] mb-5">
              {product.name}
            </h1>

            {/* Price */}
            <p className="text-2xl font-black text-gray-900 mb-7">
              {formatPrice(product.price)}
              {stockQty > 0 && stockQty < 5 && (
                <span className="ml-3 text-[10px] font-black text-orange-500 uppercase tracking-widest">
                  {stockQty} in stock
                </span>
              )}
            </p>

            <div className="h-px bg-gray-100 mb-7" />

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div className="mb-6">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 mb-3">
                  Color
                  {selectedColor && (
                    <span className="ml-2 text-gray-900 normal-case tracking-normal text-[10px] font-bold">
                      — {selectedColor.split('|').pop()}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(color => {
                    const hex = color.includes('|') ? color.split('|')[0] : color;
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          const vi = product.variantImages?.[color];
                          if (vi) {
                            const idx = gallery.indexOf(vi);
                            if (idx > -1) setGalleryIndex(idx);
                          }
                        }}
                        title={color.split('|').pop()}
                        className={`w-8 h-8 border-2 transition-all duration-200 ${
                          selectedColor === color
                            ? 'border-gray-900 ring-1 ring-gray-900 ring-offset-2'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="mb-7">
                <p className={`text-[9px] font-black uppercase tracking-[0.4em] mb-3 transition-colors ${
                  sizeError ? 'text-cardinal' : 'text-gray-500'
                }`}>
                  {sizeError ? '⚠ Select a size to continue' : 'Size'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => {
                    const sizeQty = product.sizeStock instanceof Map
                      ? (product.sizeStock.get(size) ?? 0)
                      : (product.sizeStock?.[size] ?? 0);
                    const unavail = sizeQty === 0;
                    return (
                      <button
                        key={size}
                        onClick={() => { if (!unavail) { setSelectedSize(size); setSizeError(false); } }}
                        disabled={unavail}
                        className={`min-w-[44px] h-11 px-3 border text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                          unavail
                            ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                            : selectedSize === size
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 text-gray-900 hover:border-gray-500'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-7">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 mb-3">Quantity</p>
              <div className="inline-flex items-center border border-gray-200">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <Minus size={13} />
                </button>
                <span className="w-12 text-center text-sm font-black text-gray-900">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(stockQty || 99, q + 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  disabled={outOfStock}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex space-x-3 mb-6 items-center">
              {/* Add to Bag */}
              <MagneticElement className="flex-1">
                <button
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  className={`btn-primary w-full rounded-[4px] ${
                    outOfStock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : cartAdded
                        ? 'bg-black text-white'
                        : ''
                  }`}
                >
                  {cartAdded ? (
                    <><Check size={14} /><span>Added to Bag</span></>
                  ) : outOfStock ? (
                    <><AlertTriangle size={14} /><span>Sold Out</span></>
                  ) : (
                    <><ShoppingBag size={14} /><span>Add to Bag</span></>
                  )}
                </button>
              </MagneticElement>

              {/* Wishlist */}
              <MagneticElement>
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`btn-secondary w-14 h-[52px] rounded-[4px] flex items-center justify-center transition-all duration-300 ${
                    isWished
                      ? 'border-cardinal bg-red-50 text-cardinal'
                      : 'border-gray-200 text-gray-400 hover:border-cardinal hover:text-cardinal'
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart size={17} className={isWished ? 'fill-cardinal' : ''} />
                </button>
              </MagneticElement>
            </div>

            {/* Share buttons */}
            <div className="flex space-x-2 mb-8">
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center space-x-2 px-4 py-2.5 bg-[#25D366] text-black text-[9px] font-black uppercase tracking-[0.25em] hover:bg-[#1ebe5d] transition-colors"
              >
                <MessageCircle size={12} />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={handleCopyLink}
                className={`flex items-center space-x-2 px-4 py-2.5 border text-[9px] font-black uppercase tracking-[0.25em] transition-all duration-200 ${
                  copied
                    ? 'border-gray-900 bg-gray-900 text-black'
                    : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                {copied ? <Check size={12} /> : <Share2 size={12} />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="h-px bg-gray-100 mb-7" />

            {/* Specs / Product Details */}
            {product.specs?.filter(Boolean).length > 0 && (
              <div className="mb-7">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 mb-4">
                  Product Details
                </p>
                <ul className="space-y-2">
                  {product.specs.filter(Boolean).map((spec, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <div className="w-1 h-1 bg-cardinal rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600 font-medium leading-relaxed">{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3">
              {TRUST.map(({ Icon, label, sub }) => (
                <div key={label} className="flex items-start space-x-2.5 p-3 bg-[#FAFAF9] border border-gray-100">
                  <Icon size={13} className="text-cardinal flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-900">{label}</p>
                    <p className="text-[8px] text-gray-400 mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* SKU */}
            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-6">
              SKU: {product.id}
            </p>
          </div>
        </div>
      </div>

      {/* ── Reviews ───────────────────────────────────────────── */}
      <ProductReviews productId={product.id} productName={product.name} />

      {/* ── Related Products ──────────────────────────────────── */}
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