'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Heart, Share2,
  ChevronRight, Package,
  ArrowLeft, AlertTriangle, ChevronLeft,
  Minus, Plus, X, ZoomIn, ZoomOut, Bell,
  ChevronUp, ChevronDown, Ruler
} from 'lucide-react';
import { Link } from '../../../utils/router-compat.jsx';
import { useCart } from '../../../context/CartContext.tsx';
import { useWishlist } from '../../../context/WishlistContext.jsx';
import { useCurrency } from '../../../context/CurrencyContext.jsx';
import MediaRenderer from '../../../components/MediaRenderer.jsx';
import ProductReviews from '../../../components/ProductReviews.jsx';
import ProductCard from '../../../components/ProductCard.jsx';

const getBackgroundStyle = (color) => {
  if (!color) return {};
  if (color.includes('|')) {
    const parts = color.split('|');
    const part0 = parts[0].trim();
    const part1 = parts[1].trim();
    const isHex = (str) => /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(str);
    const cssColors = [
      'white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 
      'pink', 'brown', 'gray', 'grey', 'gold', 'silver', 'navy', 'teal', 
      'olive', 'lime', 'aqua', 'cyan', 'magenta', 'maroon', 'beige', 'cream', 
      'lavender', 'khaki', 'coral', 'indigo', 'violet', 'plum', 'ivory'
    ];
    const words = part1.toLowerCase().split(/[\s\-_/]+/);
    const matchedColorName = words.find(w => cssColors.includes(w));
    
    if (isHex(part0) && !isHex(part1) && !matchedColorName) {
      return { backgroundColor: part0 };
    } else {
      const secondColor = isHex(part1) ? part1 : (matchedColorName || part0);
      return { background: `linear-gradient(135deg, ${part0} 50%, ${secondColor} 50%)` };
    }
  }
  return { backgroundColor: color };
};

const getColorName = (color) => {
  if (!color) return '';
  if (color.includes('|')) {
    const parts = color.split('|');
    const part0 = parts[0].trim();
    const part1 = parts[1].trim();
    const isHex = (str) => /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(str);
    if (isHex(part0) && !isHex(part1)) {
      return part1;
    } else {
      return parts.join(' / ');
    }
  }
  return color;
};

const RelatedProducts = ({ currentId, category, subCategory, allProducts = [] }) => {
  // 1. Filter matching category and subCategory first
  let related = (allProducts || []).filter(p =>
    (p.id || p._id) !== currentId &&
    (p.quantity ?? 1) > 0 &&
    p.bucket === category &&
    (subCategory && subCategory !== 'General' ? p.subCategory === subCategory : true)
  );

  // 2. Fallback: match same category (bucket)
  if (related.length < 4) {
    const additional = (allProducts || []).filter(p =>
      (p.id || p._id) !== currentId &&
      (p.quantity ?? 1) > 0 &&
      p.bucket === category &&
      !related.some(r => (r.id || r._id) === (p.id || p._id))
    );
    related = [...related, ...additional];
  }

  // 3. Fallback: any available catalog items
  if (related.length < 4) {
    const globalFallback = (allProducts || []).filter(p =>
      (p.id || p._id) !== currentId &&
      (p.quantity ?? 1) > 0 &&
      !related.some(r => (r.id || r._id) === (p.id || p._id))
    );
    related = [...related, ...globalFallback];
  }

  const finalItems = related.slice(0, 4);
  if (!finalItems.length) return null;

  return (
    <section className="border-t border-gray-200 pt-16 pb-8 mt-16">
      <div className="flex items-end justify-between mb-10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 block mb-1">
            Curated Recommendations
          </span>
          <h2 className="text-xl sm:text-2xl font-medium uppercase tracking-[0.1em] text-gray-900 font-serif">
            You May Also Like
          </h2>
        </div>
        <Link
          to="/"
          className="text-[10px] font-black uppercase tracking-[0.25em] text-black border-b border-black pb-0.5 hover:opacity-70 transition-opacity hidden sm:inline-block"
        >
          View Full Catalog →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {finalItems.map(item => (
          <ProductCard key={item.id || item._id} product={item} />
        ))}
      </div>
    </section>
  );
};

const getVariantImage = (prod, col) => {
  if (!prod || !col) return null;
  
  // 1. Check explicit variantImages mapping
  const vImgs = prod.variantImages instanceof Map 
    ? prod.variantImages.get(col) 
    : (prod.variantImages?.[col] ?? null);
    
  if (Array.isArray(vImgs) && vImgs.length > 0) return vImgs[0];
  if (typeof vImgs === 'string' && vImgs.trim()) return vImgs;

  // 2. Index position fallback into gallery array
  if (Array.isArray(prod.colors) && prod.colors.length > 0) {
    const colorIndex = prod.colors.findIndex(c => c === col);
    if (colorIndex === 0) return prod.image;
    if (colorIndex > 0 && Array.isArray(prod.gallery) && prod.gallery.length >= colorIndex) {
      return prod.gallery[colorIndex - 1];
    }
  }

  return null;
};



/** Returns the full image array for a color (for detail-page gallery). */
const getVariantImages = (product, color) => {
  if (!color) return null;

  if (product.variantImages) {
    const imagesObj = product.variantImages instanceof Map
      ? Object.fromEntries(product.variantImages)
      : product.variantImages;

    if (typeof imagesObj === 'object') {
      const searchColor = color.trim().toLowerCase();
      const searchParts = searchColor.split('|').map(p => p.trim());
      const searchHex = searchParts[0];
      const searchName = searchParts[1] || '';

      let matchedVal = null;
      if (imagesObj[color]) matchedVal = imagesObj[color];

      if (!matchedVal) {
        for (const [key, val] of Object.entries(imagesObj)) {
          const keyLower = key.trim().toLowerCase();
          if (keyLower === searchColor) { matchedVal = val; break; }
          const keyParts = keyLower.split('|').map(p => p.trim());
          const keyHex = keyParts[0];
          const keyName = keyParts[1] || '';
          if (searchHex && keyHex === searchHex) { matchedVal = val; break; }
          if (searchName && keyName && keyName === searchName) { matchedVal = val; break; }
          if (keyLower === searchHex || keyLower === searchName) { matchedVal = val; break; }
        }
      }

      if (Array.isArray(matchedVal) && matchedVal.length > 0) {
        return matchedVal.filter(u => u && typeof u === 'string' && u.trim());
      }
      if (typeof matchedVal === 'string' && matchedVal.trim()) {
        return [matchedVal]; // legacy single string
      }
    }
  }

  // Fallback: single image derived from gallery index
  const thumb = getVariantImage(product, color);
  return thumb ? [thumb] : null;
};

export default function ProductPageClient({ product, allProducts = [], outfitProducts = [] }) {
  const isAttitudeProduct = product?.featuredSection === 'attitude' || product?.bucket === 'Outfit';
  const { addToCart, openDrawer } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { formatPrice } = useCurrency();

  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] ?? '');
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.length === 1 ? product.sizes[0] : '');
  const [qty, setQty] = useState(1);

  const availableTabs = [
    product?.description?.trim() && 'Description',
    product?.materials?.trim() && 'Materials',
    product?.careInstructions?.trim() && 'Care'
  ].filter(Boolean);

  const [activeTab, setActiveTab] = useState(availableTabs[0] || 'Description');

  useEffect(() => {
    const tabs = [
      product?.description?.trim() && 'Description',
      product?.materials?.trim() && 'Materials',
      product?.careInstructions?.trim() && 'Care'
    ].filter(Boolean);
    if (tabs.length > 0 && !tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [product?.description, product?.materials, product?.careInstructions, activeTab]);

  const [openAccordions, setOpenAccordions] = useState({
    description: true,
    care: false,
    materials: false,
    delivery: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [showSizeChart, setShowSizeChart] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    setGalleryIndex(0);
  }, [selectedColor]);
  
  const [copied, setCopied] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoomScale(prev => Math.min(3, prev + 0.25));
  const handleZoomOut = () => {
    setZoomScale(prev => {
      const next = Math.max(1, prev - 0.25);
      if (next === 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleMouseDown = (e) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoomScale <= 1) return;
    e.preventDefault();
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (zoomScale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || zoomScale <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPanOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  useEffect(() => {
    if (isLightboxOpen) {
      document.body.classList.add('lightbox-open');
    } else {
      document.body.classList.remove('lightbox-open');
    }

    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('lightbox-open');
    };
  }, [isLightboxOpen]);

  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyName, setNotifyName] = useState('');
  const [notifySize, setNotifySize] = useState('');
  const [notifyColor, setNotifyColor] = useState('');
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  const openNotifyModal = (preSize = '', preColor = '') => {
    const sizeStockObj = product.sizeStock
      ? (product.sizeStock instanceof Map ? Object.fromEntries(product.sizeStock) : product.sizeStock)
      : null;
    const colorStockObj = product.colorStock
      ? (product.colorStock instanceof Map ? Object.fromEntries(product.colorStock) : product.colorStock)
      : null;
    const variantMatrixObj = product.variantMatrix
      ? (product.variantMatrix instanceof Map ? Object.fromEntries(product.variantMatrix) : product.variantMatrix)
      : null;
    const hasMatrix = variantMatrixObj && Object.keys(variantMatrixObj).length > 0;

    // 1. Determine color
    let initialColor = preColor || selectedColor || '';
    const oosColors = (product.colors || []).filter(col => {
      if (hasMatrix) {
        const colKeys = Object.keys(variantMatrixObj).filter(k => k.startsWith(`${col}|`));
        return colKeys.length > 0 && colKeys.every(k => (variantMatrixObj[k] ?? 0) === 0);
      } else if (colorStockObj) {
        return (colorStockObj[col] ?? 0) === 0;
      }
      return false;
    });

    if (oosColors.length === 1) {
      initialColor = oosColors[0];
    } else if (oosColors.length > 1 && !oosColors.includes(initialColor)) {
      initialColor = ''; // Reset to force dropdown selection
    }

    // 2. Determine size
    let initialSize = preSize || selectedSize || '';
    const oosSizes = (product.sizes || []).filter(size => {
      const ss = (hasMatrix && initialColor)
        ? (variantMatrixObj[`${initialColor}|${size}`] ?? 0)
        : (sizeStockObj?.[size] ?? 0);
      return ss === 0;
    });

    if (oosSizes.length === 1) {
      initialSize = oosSizes[0];
    } else if (oosSizes.length > 1 && !oosSizes.includes(initialSize)) {
      initialSize = ''; // Reset to force dropdown selection
    }

    setNotifySize(initialSize);
    setNotifyColor(initialColor);
    setNotifyEmail('');
    setNotifyName('');
    setNotifyStatus(null);
    setShowNotifyModal(true);
  };

  const handleNotifySubmit = async (e) => {
    e.preventDefault();
    if (!notifyEmail?.trim()) return;
    setNotifyLoading(true);
    setNotifyStatus(null);
    try {
      const res = await fetch('/api/v1/public/notify-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notifyEmail,
          name: notifyName,
          productId: product.id,
          selectedSize: notifySize || '',
          selectedColor: notifyColor || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit notification request');
      setNotifyStatus({ type: 'success', message: "You're on the list! We'll email you the moment it restocks." });
      setNotifyEmail('');
      setNotifyName('');
      setTimeout(() => setShowNotifyModal(false), 3000);
    } catch (err) {
      setNotifyStatus({ type: 'error', message: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setNotifyLoading(false);
    }
  };

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

  const variantImgs = selectedColor ? getVariantImages(product, selectedColor) : null;
  const gallery = (variantImgs && variantImgs.length > 0)
    ? variantImgs
    : [product.image, ...(product.gallery ?? [])].filter(Boolean);

  const getStock = () => {
    let sizeStockVal = Infinity;
    let colorStockVal = Infinity;

    const sizeStockMap = product.sizeStock;
    const colorStockMap = product.colorStock;
    const variantMatrixMap = product.variantMatrix;

    const sizeStockObj = sizeStockMap
      ? (sizeStockMap instanceof Map ? Object.fromEntries(sizeStockMap) : sizeStockMap)
      : null;
    const colorStockObj = colorStockMap
      ? (colorStockMap instanceof Map ? Object.fromEntries(colorStockMap) : colorStockMap)
      : null;
    const variantMatrixObj = variantMatrixMap
      ? (variantMatrixMap instanceof Map ? Object.fromEntries(variantMatrixMap) : variantMatrixMap)
      : null;

    const hasSizeStock = sizeStockObj && Object.keys(sizeStockObj).length > 0;
    const hasColorStock = colorStockObj && Object.keys(colorStockObj).length > 0;
    const hasMatrix = variantMatrixObj && Object.keys(variantMatrixObj).length > 0;

    if (hasMatrix) {
      if (selectedColor && selectedSize) {
        return variantMatrixObj[`${selectedColor}|${selectedSize}`] ?? 0;
      } else if (selectedColor) {
        return colorStockObj?.[selectedColor] ?? 0;
      } else if (selectedSize) {
        return sizeStockObj?.[selectedSize] ?? 0;
      }
    }

    if (hasSizeStock && selectedSize) {
      sizeStockVal = sizeStockObj[selectedSize] ?? 0;
    }
    if (hasColorStock && selectedColor) {
      colorStockVal = colorStockObj[selectedColor] ?? 0;
    }

    if (hasSizeStock || hasColorStock) {
      return Math.min(
        hasSizeStock && selectedSize ? sizeStockVal : product.quantity,
        hasColorStock && selectedColor ? colorStockVal : product.quantity
      );
    }

    return product.quantity ?? 0;
  };

  const stockQty = getStock();
  const outOfStock = stockQty === 0;
  const isWished = isWishlisted(product.id);
  const category = product.subCategory && product.subCategory !== 'General' ? product.subCategory : product.bucket;

  const hasAnyOutOfStockVariant = (() => {
    if ((product.quantity ?? 0) === 0) return true;

    const sizeStockObj = product.sizeStock
      ? (product.sizeStock instanceof Map ? Object.fromEntries(product.sizeStock) : product.sizeStock)
      : null;
    const colorStockObj = product.colorStock
      ? (product.colorStock instanceof Map ? Object.fromEntries(product.colorStock) : product.colorStock)
      : null;
    const variantMatrixObj = product.variantMatrix
      ? (product.variantMatrix instanceof Map ? Object.fromEntries(product.variantMatrix) : product.variantMatrix)
      : null;

    const hasMatrix = variantMatrixObj && Object.keys(variantMatrixObj).length > 0;
    const hasSizes = sizeStockObj && Object.keys(sizeStockObj).length > 0;
    const hasColors = colorStockObj && Object.keys(colorStockObj).length > 0;

    if (hasMatrix) {
      const colors = product.colors || [];
      const sizes = product.sizes || [];
      for (const col of colors) {
        for (const sz of sizes) {
          const qty = variantMatrixObj[`${col}|${sz}`] ?? 0;
          if (qty === 0) return true;
        }
      }
    }
    if (hasSizes && product.sizes?.length > 0) {
      for (const sz of product.sizes) {
        if ((sizeStockObj?.[sz] ?? 0) === 0) return true;
      }
    }
    if (hasColors && product.colors?.length > 0) {
      for (const col of product.colors) {
        if ((colorStockObj?.[col] ?? 0) === 0) return true;
      }
    }
    return false;
  })();

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
          <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-4">
            
            {/* Left Vertical Thumbnail Strip (Desktop) */}
            {gallery.length > 1 && (
              <div className="hidden lg:flex flex-col items-center justify-between w-20 flex-shrink-0 relative max-h-[640px]">
                {/* Scroll Up Arrow */}
                {gallery.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setGalleryIndex(prev => Math.max(0, prev - 1))}
                    className="w-full py-1 text-gray-400 hover:text-black flex items-center justify-center transition-colors mb-1 cursor-pointer"
                    aria-label="Previous thumbnail"
                  >
                    <ChevronUp size={16} />
                  </button>
                )}

                {/* Thumbnail List */}
                <div className="flex-1 w-full overflow-y-auto scrollbar-hide space-y-2 py-1">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setGalleryIndex(i)}
                      className={`w-full aspect-[3/4] bg-[#F7F7F7] overflow-hidden transition-all duration-200 cursor-pointer ${
                        i === galleryIndex
                          ? 'border border-black ring-1 ring-black opacity-100'
                          : 'border border-gray-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>

                {/* Scroll Down Arrow */}
                {gallery.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setGalleryIndex(prev => Math.min(gallery.length - 1, prev + 1))}
                    className="w-full py-1 text-gray-400 hover:text-black flex items-center justify-center transition-colors mt-1 cursor-pointer"
                    aria-label="Next thumbnail"
                  >
                    <ChevronDown size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Main Image Container */}
            <div className="flex-1 space-y-4 min-w-0">
              <div
                className="relative aspect-[3/4] bg-[#F7F7F7] overflow-hidden group cursor-zoom-in border border-gray-100"
                onClick={() => gallery.length > 0 && setIsLightboxOpen(true)}
              >
                {gallery.length > 0 ? (
                  <MediaRenderer
                    src={product.mediaType === 'embed' ? null : gallery[galleryIndex]}
                    embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
                    mediaType={product.mediaType}
                    alt={product.name}
                    width={1000}
                    priority={true}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
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
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setGalleryIndex(i => (i - 1 + gallery.length) % gallery.length); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black hover:text-white border border-gray-200 shadow-sm rounded-[2px]"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setGalleryIndex(i => (i + 1) % gallery.length); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black hover:text-white border border-gray-200 shadow-sm rounded-[2px]"
                      aria-label="Next image"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Mobile Horizontal Thumbnails */}
              {gallery.length > 1 && (
                <div className="flex lg:hidden overflow-x-auto scrollbar-hide gap-2 py-1">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setGalleryIndex(i)}
                      className={`w-16 aspect-[3/4] bg-[#F7F7F7] overflow-hidden transition-all duration-200 flex-shrink-0 cursor-pointer ${
                        i === galleryIndex
                          ? 'border border-black ring-1 ring-black opacity-100'
                          : 'border border-gray-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && gallery.length > 0 && mounted && createPortal(
              <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm select-none">
                {/* Close button */}
                <button
                  type="button"
                  onClick={handleCloseLightbox}
                  className="absolute top-6 right-6 text-white/75 hover:text-white hover:scale-110 transition-all p-3 z-50 bg-white/10 hover:bg-white/20 rounded-[2px] cursor-pointer"
                  aria-label="Close Lightbox"
                >
                  <X size={20} />
                </button>

                {/* Zoom controls floating bar */}
                <div className="absolute bottom-8 z-50 flex items-center space-x-4 bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-[4px] border border-white/15">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoomScale <= 1}
                    className="text-white/75 hover:text-white disabled:opacity-40 transition-colors p-1"
                    aria-label="Zoom Out"
                  >
                    <ZoomOut size={18} />
                  </button>
                  <span className="text-[10px] font-mono text-white/90 font-bold uppercase tracking-widest min-w-[48px] text-center">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoomScale >= 3}
                    className="text-white/75 hover:text-white disabled:opacity-40 transition-colors p-1"
                    aria-label="Zoom In"
                  >
                    <ZoomIn size={18} />
                  </button>
                  {zoomScale > 1 && (
                    <>
                      <div className="w-[1px] h-4 bg-white/20" />
                      <button
                        type="button"
                        onClick={() => { setZoomScale(1); setPanOffset({ x: 0, y: 0 }); }}
                        className="text-[9px] font-black uppercase tracking-wider text-white/75 hover:text-white transition-colors"
                      >
                        Reset
                      </button>
                    </>
                  )}
                </div>

                {/* Centered Image Container */}
                <div
                  className="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center overflow-hidden px-4"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUpOrLeave}
                >
                  <div
                    className={`${isDragging ? 'transition-none' : 'transition-transform duration-200'} ease-out flex items-center justify-center`}
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                      cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    }}
                  >
                    <img
                      src={gallery[galleryIndex]}
                      alt={product.name}
                      className="max-w-full max-h-[80vh] object-contain shadow-2xl pointer-events-none"
                    />
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* Details Form Area - Right Column */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 self-start space-y-5">
            
            {/* Title & SKU */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium uppercase tracking-[0.1em] text-gray-900 leading-snug mb-1 font-serif">
                {product.name}
              </h1>
              <p className="text-[10px] font-mono tracking-[0.2em] text-gray-400 uppercase">
                {product.sku || product.id}
              </p>
            </div>

            {/* Price & Options (or Outfit info box if Defined by Attitude) */}
            {isAttitudeProduct ? (
              <div className="border border-gray-200 bg-[#F7F6F3] p-6 rounded-xl space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-gray-900 text-white px-3 py-1 rounded-full">
                    Defined by Attitude · Lookbook Outfit
                  </span>
                </div>
                <p className="text-xs text-gray-700 font-bold uppercase tracking-wider leading-relaxed">
                  This complete outfit features individual catalog items. Explore and shop the pieces used in this look below!
                </p>
                <button
                  onClick={() => {
                    const outfitEl = document.getElementById('outfit-items-section');
                    if (outfitEl) outfitEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="w-full py-3.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-lg hover:bg-cardinal transition-all"
                >
                  Shop Items in this Outfit ↓
                </button>
              </div>
            ) : (
              <>
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-xl font-semibold tracking-wider text-gray-900">
                    {formatPrice(product.price)}
                  </p>
                </div>

                {/* Colors */}
                {product.colors?.length > 0 && (() => {
                  const colorStockObj = product.colorStock
                    ? (product.colorStock instanceof Map ? Object.fromEntries(product.colorStock) : product.colorStock)
                    : null;
                  const variantMatrixObj = product.variantMatrix
                    ? (product.variantMatrix instanceof Map ? Object.fromEntries(product.variantMatrix) : product.variantMatrix)
                    : null;
                  const hasMatrix = variantMatrixObj && Object.keys(variantMatrixObj).length > 0;
                  return (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Color</span>
                        {selectedColor && (
                          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                            {getColorName(selectedColor)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-2.5">
                        {product.colors.map(col => {
                          let colorOos = false;
                          if (hasMatrix) {
                            const colKeys = Object.keys(variantMatrixObj).filter(k => k.startsWith(`${col}|`));
                            colorOos = colKeys.length > 0 && colKeys.every(k => (variantMatrixObj[k] ?? 0) === 0);
                          } else if (colorStockObj && col in colorStockObj) {
                            colorOos = (colorStockObj[col] ?? 0) === 0;
                          }
                          const isSelected = selectedColor === col;
                          return (
                            <button
                              key={col}
                              onClick={() => setSelectedColor(col)}
                              className={`relative w-8 h-8 rounded-[2px] border transition-all duration-200 focus:outline-none flex-shrink-0 cursor-pointer ${
                                isSelected
                                  ? 'border-black ring-1 ring-black'
                                  : 'border-gray-300 hover:border-gray-600'
                              }`}
                              style={getBackgroundStyle(col)}
                              title={colorOos ? `${getColorName(col)} — Out of Stock` : getColorName(col)}
                            >
                              {colorOos && (
                                <svg className="absolute inset-0 w-full h-full rounded-[1px]" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                  <line x1="2" y1="2" x2="26" y2="26" stroke="#ba1f3d" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Size Selection */}
                {product.sizes?.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Size</span>
                      {sizeError && (
                        <span className="text-[9px] font-black uppercase text-cardinal tracking-widest animate-pulse">
                          Please select a size first
                        </span>
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-2">
                      {product.sizes.map(size => {
                        const sizeStockObj = product.sizeStock
                          ? (product.sizeStock instanceof Map ? Object.fromEntries(product.sizeStock) : product.sizeStock)
                          : null;
                        const variantMatrixObj = product.variantMatrix
                          ? (product.variantMatrix instanceof Map ? Object.fromEntries(product.variantMatrix) : product.variantMatrix)
                          : null;
                        const hasMatrix = variantMatrixObj && Object.keys(variantMatrixObj).length > 0;
                        const ss = (hasMatrix && selectedColor)
                          ? (variantMatrixObj[`${selectedColor}|${size}`] ?? 0)
                          : (sizeStockObj?.[size] ?? 0);
                        const soldOut = ss === 0;
                        return (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            title={soldOut ? `${size} — Out of Stock` : size}
                            className={`relative min-w-[44px] h-10 px-3 border text-xs font-medium uppercase tracking-wider flex items-center justify-center transition-all duration-200 cursor-pointer ${
                              selectedSize === size
                                ? 'border-black bg-black text-white font-semibold'
                                : soldOut
                                  ? 'border-gray-200 bg-white text-gray-300 cursor-not-allowed'
                                  : 'border-gray-200 text-gray-800 hover:border-black bg-white'
                            }`}
                          >
                            <span className={soldOut && selectedSize !== size ? 'opacity-40 line-through' : ''}>{size}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">One Size</span>
                  </div>
                )}

                {/* Quantity & Size Chart Link */}
                <div className="flex items-end justify-between pt-2 pb-1">
                  {!outOfStock && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 block mb-2">Quantity</span>
                      <div className="inline-flex items-center border border-gray-300 bg-white">
                        <button
                          onClick={() => setQty(q => Math.max(1, q - 1))}
                          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-11 text-center text-xs font-bold text-gray-900 select-none">{qty}</span>
                        <button
                          onClick={() => setQty(q => Math.min(stockQty, q + 1))}
                          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowSizeChart(true)}
                    className="inline-flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 hover:text-cardinal transition-colors cursor-pointer group pb-2"
                  >
                    <Ruler size={14} className="text-gray-700 group-hover:text-cardinal" />
                    <span className="underline underline-offset-4">Size Chart</span>
                  </button>
                </div>

                {/* Action Buttons (Exact Match to Screenshot 2) */}
                <div className="space-y-2.5 pt-2">
                  {outOfStock ? (
                    <div className="border border-gray-200 p-5 bg-[#F7F6F3] text-center space-y-3">
                      <span className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-900 block">Sold Out</span>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                        This item is currently unavailable. Get notified the moment it restocks.
                      </p>
                      <button
                        type="button"
                        onClick={() => openNotifyModal()}
                        className="w-full flex items-center justify-center space-x-2 py-4 text-[10px] font-black uppercase tracking-[0.35em] bg-black text-white hover:bg-gray-800 transition-all cursor-pointer"
                      >
                        <Bell size={13} />
                        <span>Notify when Available</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Top Row: Add to Cart + Wishlist */}
                      <div className="flex items-center space-x-2.5">
                        <button
                          onClick={handleAddToCart}
                          className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-[0.25em] border border-black transition-all duration-300 cursor-pointer ${
                            cartAdded
                              ? 'bg-black text-white'
                              : 'bg-white text-black hover:bg-black hover:text-white'
                          }`}
                        >
                          {cartAdded ? '✓ Added to Cart' : 'ADD TO CART'}
                        </button>

                        <button
                          onClick={() => toggleWishlist(product)}
                          className={`w-12 h-[46px] border border-black flex items-center justify-center transition-all duration-300 cursor-pointer ${
                            isWished ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'
                          }`}
                          title={isWished ? 'Saved' : 'Save Item'}
                        >
                          <Heart size={16} className={isWished ? 'fill-white text-white' : 'text-black'} />
                        </button>
                      </div>

                      {/* Bottom Row: BUY IT NOW */}
                      <button
                        onClick={() => {
                          handleAddToCart();
                        }}
                        className="w-full py-4 text-xs font-semibold uppercase tracking-[0.25em] bg-black text-white hover:bg-gray-800 transition-all duration-300 shadow-sm cursor-pointer"
                      >
                        BUY IT NOW
                      </button>

                      {hasAnyOutOfStockVariant && (
                        <button
                          type="button"
                          onClick={() => openNotifyModal()}
                          className="w-full flex items-center justify-center space-x-2 py-3 text-[10px] font-black uppercase tracking-[0.3em] border border-gray-300 text-gray-700 hover:border-black hover:text-black transition-all mt-1 cursor-pointer"
                        >
                          <Bell size={12} />
                          <span>Notify when Available</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* Luxury Accordions (Description, Materials, Care) */}
            <div className="border-t border-gray-200 pt-2">
              {/* Description Accordion */}
              {product.description?.trim() && (
                <div className="border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('description')}
                    className="w-full py-4 flex items-center justify-between text-left text-xs font-bold uppercase tracking-[0.2em] text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <span>Description</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${openAccordions.description ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openAccordions.description && (
                    <div className="pb-5 text-xs text-gray-600 leading-relaxed font-normal whitespace-pre-line tracking-normal">
                      {product.description}
                    </div>
                  )}
                </div>
              )}

              {/* Materials Accordion */}
              {product.materials?.trim() && (
                <div className="border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('materials')}
                    className="w-full py-4 flex items-center justify-between text-left text-xs font-bold uppercase tracking-[0.2em] text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <span>Materials</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${openAccordions.materials ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openAccordions.materials && (
                    <div className="pb-5 text-xs text-gray-600 leading-relaxed font-normal whitespace-pre-line tracking-normal">
                      {product.materials}
                    </div>
                  )}
                </div>
              )}

              {/* Care Accordion */}
              {product.careInstructions?.trim() && (
                <div className="border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('care')}
                    className="w-full py-4 flex items-center justify-between text-left text-xs font-bold uppercase tracking-[0.2em] text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <span>Care</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${openAccordions.care ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openAccordions.care && (
                    <div className="pb-5 text-xs text-gray-600 leading-relaxed font-normal whitespace-pre-line tracking-normal">
                      {product.careInstructions}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Share & Copy Link */}
            <div className="pt-2">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 hover:text-black transition-colors cursor-pointer"
              >
                <Share2 size={12} />
                <span>{copied ? 'Link Copied!' : 'Share Product Link'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Items in this Outfit — for Defined by Attitude outfits */}
        {(isAttitudeProduct || (outfitProducts && outfitProducts.length > 0)) && (
          <div id="outfit-items-section" className="border-t border-gray-100 pt-16 mb-20 scroll-mt-20">
            <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
                Complete the Look
              </span>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900">
                Items in this Outfit
              </h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                Select and shop any piece from this Lookbook outfit directly.
              </p>
            </div>

            {outfitProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {outfitProducts.map(item => (
                  <ProductCard key={item.id || item._id} product={item} />
                ))}
              </div>
            ) : (
              <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest py-8">
                No outfit items linked to this look yet.
              </p>
            )}
          </div>
        )}

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

      {/* Size Chart Modal */}
      {showSizeChart && mounted && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSizeChart(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-[4px] w-full max-w-lg overflow-hidden border border-gray-150 shadow-2xl z-10 p-6 sm:p-8 animate-scale-in text-left">
            {/* Close Button */}
            <button
              onClick={() => setShowSizeChart(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black rounded-[4px] transition-colors focus:outline-none"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {/* Title */}
            <div className="mb-6">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-cardinal mb-2">Size Guide</p>
              <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">
                {product.bucket} Sizing Chart
              </h3>
            </div>

            {/* Table Content based on Category */}
            <div className="overflow-x-auto">
              {product.bucket === 'Tops' || product.bucket === 'Outfit' ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3">Size</th>
                      <th className="pb-3">Chest (in)</th>
                      <th className="pb-3">Length (in)</th>
                      <th className="pb-3">Sleeve (in)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    <tr>
                      <td className="py-3 font-bold text-gray-900">S</td>
                      <td className="py-3">36 - 38</td>
                      <td className="py-3">28.0</td>
                      <td className="py-3">33.5</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-gray-900">M</td>
                      <td className="py-3">38 - 40</td>
                      <td className="py-3">29.0</td>
                      <td className="py-3">34.5</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-gray-900">L</td>
                      <td className="py-3">40 - 42</td>
                      <td className="py-3">30.0</td>
                      <td className="py-3">35.5</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-gray-900">XL</td>
                      <td className="py-3">42 - 44</td>
                      <td className="py-3">31.0</td>
                      <td className="py-3">36.5</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-gray-900">XXL</td>
                      <td className="py-3">44 - 46</td>
                      <td className="py-3">32.0</td>
                      <td className="py-3">37.5</td>
                    </tr>
                  </tbody>
                </table>
              ) : product.bucket === 'Bottoms' ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3">Size</th>
                      <th className="pb-3">Waist (in)</th>
                      <th className="pb-3">Hips (in)</th>
                      <th className="pb-3">Inseam (in)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    <tr>
                      <td className="py-3 font-bold text-gray-900">30</td>
                      <td className="py-3">30.0</td>
                      <td className="py-3">37.0</td>
                      <td className="py-3">32.0</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-gray-900">32</td>
                      <td className="py-3">32.0</td>
                      <td className="py-3">39.0</td>
                      <td className="py-3">32.0</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-gray-900">34</td>
                      <td className="py-3">34.0</td>
                      <td className="py-3">41.0</td>
                      <td className="py-3">32.0</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-gray-900">36</td>
                      <td className="py-3">36.0</td>
                      <td className="py-3">43.0</td>
                      <td className="py-3">32.0</td>
                    </tr>
                  </tbody>
                </table>
              ) : product.bucket === 'Footwear' ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3">US Size</th>
                      <th className="pb-3">UK Size</th>
                      <th className="pb-3">EU Size</th>
                      <th className="pb-3">Foot Length (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    <tr>
                      <td className="py-3 font-bold text-gray-900">7</td>
                      <td className="py-3">6.0</td>
                      <td className="py-3">40</td>
                      <td className="py-3">25.0</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-gray-900">8</td>
                      <td className="py-3">7.0</td>
                      <td className="py-3">41</td>
                      <td className="py-3">26.0</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-gray-900">9</td>
                      <td className="py-3">8.0</td>
                      <td className="py-3">42</td>
                      <td className="py-3">27.0</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-gray-900">10</td>
                      <td className="py-3">9.0</td>
                      <td className="py-3">43</td>
                      <td className="py-3">28.0</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-gray-900">11</td>
                      <td className="py-3">10.0</td>
                      <td className="py-3">44</td>
                      <td className="py-3">29.0</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="py-4 text-center text-gray-500 font-bold text-xs uppercase tracking-wide">
                  Standard One Size Guide. Measurements are standard and fit most variations.
                </div>
              )}
            </div>

            {/* Note */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-[9px] text-gray-400 leading-relaxed font-bold uppercase tracking-wider">
                Note: Measurements are general guidelines. Fit may vary depending on material, construction, and subcategory.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Restock Notification Modal */}
      {showNotifyModal && mounted && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowNotifyModal(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-[4px] w-full max-w-md overflow-hidden border border-gray-150 shadow-2xl z-10 p-6 sm:p-8 animate-scale-in text-left">
            {/* Close Button */}
            <button
              onClick={() => setShowNotifyModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black rounded-[4px] transition-colors focus:outline-none"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {/* Title */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 text-cardinal mb-2">
                <Bell size={14} className="animate-bounce" />
                <p className="text-[8px] font-black uppercase tracking-[0.4em]">Restock Alert</p>
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">
                Notify when Available
              </h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1 truncate">
                {product.name}
              </p>
            </div>

            <form onSubmit={handleNotifySubmit} className="space-y-4">
              {/* Size Select (OOS sizes only) */}
              {product.sizes?.length > 0 && (() => {
                const sizeStockObj = product.sizeStock
                  ? (product.sizeStock instanceof Map ? Object.fromEntries(product.sizeStock) : product.sizeStock)
                  : null;
                const variantMatrixObj = product.variantMatrix
                  ? (product.variantMatrix instanceof Map ? Object.fromEntries(product.variantMatrix) : product.variantMatrix)
                  : null;
                const hasMatrix = variantMatrixObj && Object.keys(variantMatrixObj).length > 0;

                // Find out of stock sizes for the selected or default color
                const oosSizes = product.sizes.filter(size => {
                  const ss = (hasMatrix && notifyColor)
                    ? (variantMatrixObj[`${notifyColor}|${size}`] ?? 0)
                    : (sizeStockObj?.[size] ?? 0);
                  return ss === 0;
                });

                if (oosSizes.length === 0) return null;
                if (oosSizes.length === 1) {
                  return (
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 p-2.5 rounded border border-gray-150/70">
                      Selected Size: <span className="text-gray-900 font-black">{oosSizes[0]}</span>
                    </div>
                  );
                }

                return (
                  <div>
                    <label htmlFor="notify-size-select" className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Select Size</label>
                    <select
                      id="notify-size-select"
                      value={notifySize}
                      onChange={(e) => setNotifySize(e.target.value)}
                      required
                      className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-2.5 text-xs font-black uppercase tracking-wider focus:border-black outline-none"
                    >
                      <option value="">-- Choose Size --</option>
                      {oosSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              {/* Color Select (OOS colors only) */}
              {product.colors?.length > 0 && (() => {
                const colorStockObj = product.colorStock
                  ? (product.colorStock instanceof Map ? Object.fromEntries(product.colorStock) : product.colorStock)
                  : null;
                const variantMatrixObj = product.variantMatrix
                  ? (product.variantMatrix instanceof Map ? Object.fromEntries(product.variantMatrix) : product.variantMatrix)
                  : null;
                const hasMatrix = variantMatrixObj && Object.keys(variantMatrixObj).length > 0;

                // Find out of stock colors
                const oosColors = product.colors.filter(col => {
                  if (hasMatrix) {
                    const colKeys = Object.keys(variantMatrixObj).filter(k => k.startsWith(`${col}|`));
                    return colKeys.length > 0 && colKeys.every(k => (variantMatrixObj[k] ?? 0) === 0);
                  } else if (colorStockObj && col in colorStockObj) {
                    return (colorStockObj[col] ?? 0) === 0;
                  }
                  return false;
                });

                if (oosColors.length === 0) return null;
                if (oosColors.length === 1) {
                  return (
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 p-2.5 rounded border border-gray-150/70">
                      Selected Color: <span className="text-gray-900 font-black">{getColorName(oosColors[0])}</span>
                    </div>
                  );
                }

                return (
                  <div>
                    <label htmlFor="notify-color-select" className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Select Color</label>
                    <select
                      id="notify-color-select"
                      value={notifyColor}
                      onChange={(e) => setNotifyColor(e.target.value)}
                      required
                      className="w-full bg-white border border-gray-200 rounded-[4px] px-3 py-2.5 text-xs font-black uppercase tracking-wider focus:border-black outline-none"
                    >
                      <option value="">-- Choose Color --</option>
                      {oosColors.map(col => (
                        <option key={col} value={col}>{getColorName(col)}</option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              <div className="flex flex-col">
                <label htmlFor="notify-name" className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                  Name
                </label>
                <input
                  id="notify-name"
                  type="text"
                  required
                  value={notifyName}
                  onChange={(e) => setNotifyName(e.target.value)}
                  placeholder="YOUR NAME"
                  className="bg-transparent border border-gray-205 p-2.5 rounded-[4px] text-xs font-black uppercase tracking-widest text-gray-900 focus:outline-none focus:border-gray-950 transition-colors placeholder:text-gray-300"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="notify-email" className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                  Email Address
                </label>
                <input
                  id="notify-email"
                  type="email"
                  required
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="ENTER YOUR EMAIL"
                  className="bg-transparent border border-gray-205 p-2.5 rounded-[4px] text-xs font-black uppercase tracking-widest text-gray-900 focus:outline-none focus:border-gray-950 transition-colors placeholder:text-gray-300"
                />
              </div>

              <button
                type="submit"
                disabled={notifyLoading}
                className="w-full bg-gray-900 text-white hover:bg-cardinal py-4 text-[10px] font-black uppercase tracking-[0.35em] transition-all duration-300 rounded-[4px] disabled:opacity-50"
              >
                {notifyLoading ? 'Submitting...' : 'Notify Me'}
              </button>

              <p className="text-[7.5px] text-gray-400 font-bold uppercase tracking-wider text-center leading-relaxed">
                We will notify you when this product is in stock. We do not share your address with anybody else.
              </p>
            </form>

            {notifyStatus && (
              <div className={`p-3 mt-4 text-center border rounded-[4px] ${
                notifyStatus.type === 'success'
                  ? 'bg-[#EDF3EC] border-[#EDF3EC] text-[#346538]'
                  : 'bg-[#FDEBEC] border-[#FDEBEC] text-[#9F2F2D]'
              }`}>
                <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">
                  {notifyStatus.message}
                </p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
