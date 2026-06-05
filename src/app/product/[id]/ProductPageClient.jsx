'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Heart, ShoppingBag, Share2, MessageCircle, Check,
  ChevronRight, Star, Package, Truck, RotateCcw,
  Shield, ArrowLeft, AlertTriangle, ChevronLeft,
  Minus, Plus
} from 'lucide-react';
import { Link, useNavigate } from '../../../utils/router-compat.jsx';
import { useCart } from '../../../context/CartContext.tsx';
import { useWishlist } from '../../../context/WishlistContext.jsx';
import { useCurrency } from '../../../context/CurrencyContext.jsx';
import MediaRenderer from '../../../components/MediaRenderer.jsx';
import ProductReviews from '../../../components/ProductReviews.jsx';

const TRUST = [
  { Icon: Truck,     label: 'Delivery',  sub: 'Orders over Rs. 2,000' },
  { Icon: RotateCcw, label: 'Returns',   sub: '7-day easy returns' },
  { Icon: Shield,    label: 'Secure',    sub: 'SSL encrypted checkout' },
  { Icon: Package,   label: 'Authentic', sub: 'Original Stop & Shop' },
];

const RelatedProducts = ({ currentId, category, subCategory, allProducts = [] }) => {
  const { formatPrice } = useCurrency();
  const related = [
    ...allProducts.filter(p => p.bucket === category && p.subCategory === subCategory && (p.id !== currentId && p._id !== currentId) && p.quantity > 0),
    ...allProducts.filter(p => p.bucket === category && p.subCategory !== subCategory && (p.id !== currentId && p._id !== currentId) && p.quantity > 0),
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
            >
              <div className="aspect-[3/4] bg-[#F8F7F5] overflow-hidden mb-3">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={20} className="text-gray-200" />
                  </div>
                )}
              </div>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">{product.bucket}</p>
              <h3 className="text-[10px] font-black uppercase tracking-tight text-gray-900 group-hover:text-cardinal transition-colors truncate">{product.name}</h3>
              <p className="text-xs font-black text-gray-900 mt-1">{formatPrice(product.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function ProductPageClient({ product, allProducts = [] }) {
  const { addToCart, openDrawer } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] ?? '');
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.length === 1 ? product.sizes[0] : '');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  
  const [copied, setCopied] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    if (product?.colors?.length) setSelectedColor(product.colors[0]);
    if (product?.sizes?.length === 1) setSelectedSize(product.sizes[0]);
    setQty(1);
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center">
          <AlertTriangle size={32} className="text-cardinal mx-auto mb-4" />
          <h2 className="text-lg font-black uppercase tracking-tighter text-gray-900 mb-2">Product Not Found</h2>
          <Link to="/" className="inline-flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-cardinal border-b border-cardinal/30 pb-0.5 mt-2 hover:border-cardinal">
            <ArrowLeft size={10} />
            <span>Return to Shop</span>
          </Link>
        </div>
      </div>
    );
  }

  const gallery = [
    product.image,
    ...(product.gallery ?? []),
    ...(selectedColor && product.variantImages?.[selectedColor] ? [product.variantImages[selectedColor]] : []),
  ].filter(Boolean);

  const getStock = () => {
    if (selectedSize && product.sizeStock) {
      return product.sizeStock[selectedSize] ?? 0;
    }
    return product.quantity ?? 0;
  };

  const stockQty = getStock();
  const outOfStock = stockQty === 0;
  const isWished = isWishlisted(product.id);
  const category = product.subCategory && product.subCategory !== 'General' ? product.subCategory : product.bucket;

  const handleAddToCart = () => {
    if (outOfStock) return;
    if (product.sizes?.length > 1 && !selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2500);
      return;
    }
    addToCart({ ...product, selectedSize, selectedColor, quantity: qty });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
    setTimeout(() => openDrawer('cart'), 400);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="bg-white min-h-screen pt-4 pb-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 py-6 text-[9px] font-black uppercase tracking-widest text-gray-400 flex-wrap">
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <ChevronRight size={10} />
          <span className="hover:text-gray-900 transition-colors">{product.bucket}</span>
          {product.subCategory && product.subCategory !== 'General' && (
            <>
              <ChevronRight size={10} />
              <span className="hover:text-gray-900 transition-colors">{product.subCategory}</span>
            </>
          )}
          <ChevronRight size={10} />
          <span className="text-gray-900 truncate max-w-[150px]">{product.name}</span>
        </div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-12 mb-20">
          
          {/* Media/Gallery Area - Left Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gallery.slice(0, 4).map((img, i) => (
                <div key={i} className="aspect-[3/4] bg-[#F8F7F5] overflow-hidden group">
                  <MediaRenderer
                    src={img}
                    alt={`${product.name} view ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Details Form Area - Right Column */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 self-start">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-cardinal mb-3">{category}</p>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-gray-900 leading-tight mb-4">{product.name}</h1>
            
            {/* Price */}
            <p className="text-xl font-black text-gray-900 mb-6">{formatPrice(product.price)}</p>

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div className="mb-6">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-3">Select Color</span>
                <div className="flex items-center space-x-3">
                  {product.colors.map(col => {
                    const hex = col.includes('|') ? col.split('|')[0] : col;
                    return (
                      <button
                        key={col}
                        onClick={() => setSelectedColor(col)}
                        className={`w-7 h-7 rounded-full border transition-all duration-300 ${
                          selectedColor === col
                            ? 'border-cardinal ring-2 ring-cardinal ring-offset-2'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: hex }}
                        title={col}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Select Size</span>
                  {sizeError && (
                    <span className="text-[8px] font-black uppercase text-cardinal tracking-widest animate-pulse">
                      Please select a size first
                    </span>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-2.5">
                  {product.sizes.map(size => {
                    const ss = product.sizeStock?.[size] ?? 0;
                    const soldOut = ss === 0;
                    return (
                      <button
                        key={size}
                        disabled={soldOut}
                        onClick={() => setSelectedSize(size)}
                        className={`
                          min-w-[48px] h-11 border text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-all duration-300
                          ${soldOut
                            ? 'border-gray-100 text-gray-300 line-through cursor-not-allowed'
                            : selectedSize === size
                              ? 'border-gray-900 bg-gray-900 text-black'
                              : 'border-gray-200 text-gray-600 hover:border-gray-900'
                          }
                        `}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            {!outOfStock && (
              <div className="mb-8">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-3">Quantity</span>
                <div className="inline-flex items-center border border-gray-200">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-12 text-center text-xs font-black text-gray-900 select-none">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(stockQty, q + 1))}
                    className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col space-y-3 mb-10">
              {outOfStock ? (
                <button disabled className="w-full bg-gray-100 text-gray-400 py-4 text-[10px] font-black uppercase tracking-[0.35em] cursor-not-allowed">
                  Sold Out
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className={`w-full flex items-center justify-center space-x-3 py-4 text-[10px] font-black uppercase tracking-[0.35em] transition-all duration-300 ${
                    cartAdded ? 'bg-cardinal text-white' : 'bg-gray-900 text-white hover:bg-cardinal'
                  }`}
                >
                  <ShoppingBag size={13} />
                  <span>{cartAdded ? '✓ Added to bag' : 'Add to Bag'}</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`border py-3.5 text-[9px] font-black uppercase tracking-[0.25em] flex items-center justify-center space-x-2 transition-all duration-300 ${
                    isWished
                      ? 'border-cardinal bg-cardinal/5 text-cardinal'
                      : 'border-gray-200 text-gray-600 hover:border-gray-900'
                  }`}
                >
                  <Heart size={12} className={isWished ? 'fill-cardinal' : ''} />
                  <span>{isWished ? 'Saved' : 'Save Item'}</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="border border-gray-200 text-gray-600 py-3.5 text-[9px] font-black uppercase tracking-[0.25em] flex items-center justify-center space-x-2 hover:border-gray-900 transition-all duration-300"
                >
                  <Share2 size={12} />
                  <span>{copied ? 'Copied' : 'Share Link'}</span>
                </button>
              </div>
            </div>

            {/* Trust Features */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-gray-100 pt-8">
              {TRUST.map(({ Icon, label, sub }) => (
                <div key={label} className="flex items-start space-x-3">
                  <div className="w-8 h-8 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={12} className="text-cardinal" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wide text-gray-800">{label}</h4>
                    <p className="text-[8px] text-gray-400 font-bold tracking-wider mt-0.5 uppercase">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Dynamic Editorial Content Tabs */}
        <div className="border-t border-gray-100 pt-16 mb-20">
          <div className="flex items-center space-x-8 border-b border-gray-100 mb-8 overflow-x-auto scrollbar-hide">
            {['description', 'sizing'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] relative transition-colors duration-300 ${
                  activeTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>{tab}</span>
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cardinal" />
                )}
              </button>
            ))}
          </div>

          <div className="max-w-3xl">
            {activeTab === 'description' && (
              <div className="text-sm text-gray-600 leading-relaxed uppercase tracking-wider font-bold">
                {product.description || 'Premium, custom-crafted apparel engineered with the finest detailing, offering an exceptional luxury structure.'}
              </div>
            )}
            {activeTab === 'sizing' && (
              <div className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
                Standard fitting. Fits true to size. We recommend selecting your standard waist/chest sizing.
              </div>
            )}
          </div>
        </div>

        {/* Product Reviews */}
        <ProductReviews productId={product.id} />

        {/* Related products */}
        <RelatedProducts
          currentId={product.id}
          category={product.bucket}
          subCategory={product.subCategory}
          allProducts={allProducts}
        />

      </div>
    </div>
  );
}
