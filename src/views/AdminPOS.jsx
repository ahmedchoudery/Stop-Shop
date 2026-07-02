/**
 * @fileoverview AdminPOS — Built-in Point of Sale Interface
 * Route: /admin/pos
 * 
 * Touch-friendly, barcode-scanner-compatible POS terminal for physical store sales.
 * Highly dense, clean layout optimized to fit perfectly inside the admin dashboard wrapper.
 * Features: SKU/barcode search, category tabs, compact product cards, keyboard shortcuts,
 * custom variant selector, and pinned checkout panel.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, ShoppingCart, X, Plus, Minus, Trash2, CreditCard,
  Banknote, Smartphone, User, Receipt, Check, AlertTriangle,
  Package, ScanBarcode, ChevronDown, Printer, ArrowLeft
} from 'lucide-react';
import { authFetch, handleAuthError } from '../lib/auth.js';
import { apiUrl } from '../config/api.js';

/* ═══════════════════════════════════════════════════════════
   STYLES (Clean, Premium, High-Density Editorial Design)
   ═══════════════════════════════════════════════════════════ */

const S = {
  // Container that fits perfectly within the main admin panel content area
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 120px)', // dynamic offset to fit content below header without scrollbars
    background: '#0B0B0B',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#F5F5F5',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    overflow: 'hidden',
  },

  // Main columns
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    height: '100%',
  },

  // Left column: Search, Categories, Products
  leftColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },

  // Right column: Cart, customer, checkout
  rightColumn: {
    width: '380px',
    minWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    background: '#111111',
    overflow: 'hidden',
  },

  // Top control bar (Search + Scan status)
  controlBar: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#0F0F0F',
  },
  searchWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '4px',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '0 10px',
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#F5F5F5',
    fontSize: '13px',
    padding: '8px',
    fontFamily: "'JetBrains Mono', monospace",
  },
  scanIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#22C55E',
    background: 'rgba(34,197,94,0.1)',
    padding: '4px 8px',
    borderRadius: '3px',
    border: '1px solid rgba(34,197,94,0.2)',
  },

  // Horizontal category tabs
  categoryBar: {
    display: 'flex',
    gap: '8px',
    padding: '10px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    overflowX: 'auto',
    background: '#0D0D0D',
    whiteSpace: 'nowrap',
  },
  categoryTab: (active) => ({
    padding: '6px 12px',
    borderRadius: '3px',
    border: active ? '1px solid #22C55E' : '1px solid rgba(255,255,255,0.06)',
    background: active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
    color: active ? '#22C55E' : '#AAA',
    fontSize: '11px',
    fontWeight: active ? 700 : 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }),

  // Products grid (High Density layout)
  productsGrid: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '8px',
    alignContent: 'start',
  },

  // Horizontal compact product cards
  productCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '4px',
    padding: '8px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.15s ease-in-out',
  },
  productCardImage: {
    width: '48px',
    height: '48px',
    objectFit: 'cover',
    borderRadius: '3px',
    background: '#151515',
    flexShrink: 0,
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  productName: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#E5E5E5',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  productSku: {
    fontSize: '9px',
    color: '#666',
    fontFamily: "'JetBrains Mono', monospace",
  },
  productFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '2px',
  },
  productPrice: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#22C55E',
    fontFamily: "'JetBrains Mono', monospace",
  },
  productStock: {
    fontSize: '9px',
    fontWeight: 600,
    color: '#888',
  },

  // Right Cart Section
  cartHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#151515',
  },
  cartTitle: {
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: '#888',
  },
  cartBadge: {
    background: '#22C55E',
    color: '#000',
    fontSize: '10px',
    fontWeight: 800,
    padding: '1px 6px',
    borderRadius: '2px',
  },

  // Collapsible customer section
  customerHeader: {
    padding: '8px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#888',
    background: '#131313',
  },
  customerContent: {
    padding: '12px 16px',
    background: '#121212',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  customerInput: {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '3px',
    padding: '6px 10px',
    color: '#E5E5E5',
    fontSize: '11px',
    outline: 'none',
  },

  // Cart items list (Scrollable)
  cartItemsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 16px',
  },
  cartItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  },
  cartItemDetails: {
    flex: 1,
    minWidth: 0,
  },
  cartItemName: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#E5E5E5',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cartItemMeta: {
    fontSize: '9px',
    color: '#666',
    marginTop: '1px',
  },
  cartItemPrice: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#22C55E',
    fontFamily: "'JetBrains Mono', monospace",
  },

  // Pinned Footer panel
  footerPanel: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    background: '#141414',
    padding: '16px',
    marginTop: 'auto',
  },
  priceSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  priceValue: {
    fontSize: '22px',
    fontWeight: 900,
    color: '#F5F5F5',
    fontFamily: "'JetBrains Mono', monospace",
  },
  checkoutBtn: (disabled) => ({
    width: '100%',
    padding: '12px',
    background: disabled ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    color: disabled ? '#555' : '#000',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  }),

  // Modals / Overlay
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modalBox: {
    background: '#121212',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '6px',
    width: '100%',
    maxWidth: '440px',
    padding: '20px',
  },
  modalTitle: {
    fontSize: '12px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
  },

  // Color Swatch helper
  colorDot: (colorVal) => {
    let style = {
      display: 'inline-block',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      border: '1px solid rgba(255,255,255,0.2)',
      verticalAlign: 'middle',
      marginRight: '6px',
    };
    if (colorVal.includes('|')) {
      const parts = colorVal.split('|');
      const hex = parts[0].trim();
      style.background = hex;
    } else {
      style.background = colorVal;
    }
    return style;
  },

  // General badges
  badge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    padding: '2px 4px',
    fontSize: '8px',
    fontWeight: 800,
    borderRadius: '2px',
    textTransform: 'uppercase',
  },

  // Empty state
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '60px 20px',
    color: '#555',
    flex: 1,
  },

  // Spinner
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.1)',
    borderTopColor: '#22C55E',
    borderRadius: '50%',
    animation: 'pos-spin 0.6s linear infinite',
  },

  // Payment type buttons
  paymentBtn: (active) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 4px',
    borderRadius: '4px',
    border: active ? '1px solid #22C55E' : '1px solid rgba(255,255,255,0.06)',
    background: active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
    color: active ? '#22C55E' : '#AAA',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),

  // Receipt overlay + card
  receiptOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.9)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  receiptCard: {
    background: '#121212',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '6px',
    width: '100%',
    maxWidth: '380px',
    padding: '24px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    color: '#E5E5E5',
  },
  receiptHeader: {
    textAlign: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px dashed rgba(255,255,255,0.1)',
  },
  receiptStoreName: {
    fontSize: '14px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: '#F5F5F5',
  },
  receiptLabel: {
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: '#888',
    marginTop: '4px',
  },
  receiptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '3px 0',
    fontSize: '10px',
  },
  receiptDivider: {
    borderTop: '1px dashed rgba(255,255,255,0.1)',
    margin: '10px 0',
  },
  receiptTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    marginTop: '8px',
    borderTop: '1px dashed rgba(255,255,255,0.1)',
    fontSize: '14px',
    fontWeight: 900,
    color: '#22C55E',
  },
  receiptFooter: {
    textAlign: 'center',
    marginTop: '12px',
    paddingTop: '8px',
    borderTop: '1px dashed rgba(255,255,255,0.06)',
  },
  receiptActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  receiptBtn: (primary) => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '4px',
    border: primary ? 'none' : '1px solid rgba(255,255,255,0.08)',
    background: primary ? '#22C55E' : 'rgba(255,255,255,0.03)',
    color: primary ? '#000' : '#AAA',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    cursor: 'pointer',
  }),

  // Error toast
  errorToast: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#DC2626',
    color: '#FFF',
    padding: '10px 20px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 10000,
    boxShadow: '0 4px 24px rgba(220,38,38,0.4)',
  },
};

const getCleanColorName = (colorStr) => {
  if (!colorStr) return '';
  if (colorStr.includes('|')) {
    return colorStr.split('|')[1].trim();
  }
  return colorStr;
};

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

const AdminPOS = () => {
  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [paymentType, setPaymentType] = useState('Cash');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [showCustomer, setShowCustomer] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [variantModal, setVariantModal] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({ size: '', color: '' });
  const [flashItemKey, setFlashItemKey] = useState(null);

  const searchRef = useRef(null);
  const barcodeBuffer = useRef('');
  const barcodeTimer = useRef(null);

  // Fetch catalogue
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch(apiUrl('/api/public/products'));
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data.products || data || []);
    } catch (err) {
      handleAuthError(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Extract unique categories (buckets)
  const categories = ['All', ...new Set(products.map(p => p.bucket).filter(Boolean))];

  // Barcode scanner integration (keyboard simulation lookup)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore when focused in regular inputs (unless it's the search input)
      if (e.target.tagName === 'INPUT' && e.target !== searchRef.current) return;

      // Handle F2 shortcut to complete checkout
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0 && !processing) {
          handleCheckout();
        }
        return;
      }

      // Handle Escape to close variant modal or receipt
      if (e.key === 'Escape') {
        setVariantModal(null);
        setReceipt(null);
        return;
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length >= 3) {
          e.preventDefault();
          const scanned = barcodeBuffer.current.trim();
          barcodeBuffer.current = '';

          const found = products.find(p => p.id?.toLowerCase() === scanned.toLowerCase());
          if (found) {
            handleAddToCart(found);
          } else {
            setSearchQuery(scanned);
          }
        }
        return;
      }

      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        clearTimeout(barcodeTimer.current);
        barcodeTimer.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 120);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, cart, processing]);

  // Auto focus search box on page load
  useEffect(() => {
    if (searchRef.current) searchRef.current.focus();
  }, []);

  // Filter products by category + search query
  const filtered = products.filter(p => {
    const matchCategory = activeCategory === 'All' || p.bucket === activeCategory;
    if (!matchCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      p.subCategory?.toLowerCase().includes(q)
    );
  });

  const handleAddToCart = (product) => {
    const hasSizes = product.sizes && product.sizes.length > 0;
    const hasColors = product.colors && product.colors.length > 0;

    if (hasSizes || hasColors) {
      setVariantModal(product);
      setSelectedVariants({
        size: hasSizes ? product.sizes[0] : '',
        color: hasColors ? product.colors[0] : '',
      });
      return;
    }

    addItemToCart(product, '', '');
  };

  const addItemToCart = (product, size, color) => {
    const cartKey = `${product.id}-${size}-${color}`;
    const existing = cart.find(c => c.cartKey === cartKey);

    if (existing) {
      setCart(prev => prev.map(c =>
        c.cartKey === cartKey ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      const discount = product.discount ?? 0;
      const finalPrice = discount > 0 ? product.price * (1 - discount / 100) : product.price;

      setCart(prev => [...prev, {
        cartKey,
        id: product.id,
        name: product.name,
        price: finalPrice,
        originalPrice: product.price,
        discount,
        quantity: 1,
        selectedSize: size,
        selectedColor: color,
        image: product.image || '',
      }]);
    }

    // Trigger visual flash feedback
    setFlashItemKey(cartKey);
    setTimeout(() => setFlashItemKey(null), 800);

    setVariantModal(null);
  };

  const updateQty = (cartKey, delta) => {
    setCart(prev => prev.map(c => {
      if (c.cartKey !== cartKey) return c;
      const nq = c.quantity + delta;
      return nq <= 0 ? null : { ...c, quantity: nq };
    }).filter(Boolean));
  };

  const removeItem = (cartKey) => {
    setCart(prev => prev.filter(c => c.cartKey !== cartKey));
  };

  const clearCart = () => {
    setCart([]);
    setCustomer({ name: '', phone: '', email: '' });
    setShowCustomer(false);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || processing) return;
    setProcessing(true);
    setError('');

    try {
      const res = await authFetch(apiUrl('/api/pos/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(c => ({
            id: c.id,
            name: c.name,
            price: c.originalPrice,
            quantity: c.quantity,
            selectedSize: c.selectedSize,
            selectedColor: c.selectedColor,
          })),
          paymentType,
          customerName: customer.name || undefined,
          customerPhone: customer.phone || undefined,
          customerEmail: customer.email || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      setReceipt({
        orderID: data.orderID,
        receiptNumber: data.receiptNumber,
        items: cart,
        total: data.total,
        paymentType,
        cashier: data.cashier,
        customer: customer.name || 'Walk-in Customer',
        timestamp: data.timestamp,
      });

      setCart([]);
      setCustomer({ name: '', phone: '', email: '' });
      fetchProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const fmt = (n) => `Rs. ${Math.round(n).toLocaleString()}`;

  return (
    <div style={S.container}>
      <style>{`
        @keyframes pos-spin { to { transform: rotate(360deg) } }
        @keyframes add-flash {
          0% { border-color: rgba(34,197,94,1); box-shadow: 0 0 12px rgba(34,197,94,0.4); }
          100% { border-color: rgba(255,255,255,0.05); box-shadow: none; }
        }
      `}</style>

      {/* Control bar */}
      <div style={S.controlBar}>
        <div style={S.searchWrapper}>
          <Search size={14} color="#666" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Scan barcode or type name..."
            style={S.searchInput}
            autoComplete="off"
          />
          {searchQuery && (
            <X size={14} color="#666" style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
          )}
        </div>
        <div style={S.scanIndicator}>
          <ScanBarcode size={13} />
          <span>Scanner Ready</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={S.categoryBar}>
        {categories.map(cat => (
          <button
            key={cat}
            style={S.categoryTab(activeCategory === cat)}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={S.main}>
        {/* Left Column: Products Grid */}
        <div style={S.leftColumn}>
          {loading ? (
            <div style={S.emptyState}>
              <div style={S.spinner} />
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loading catalogue...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={S.emptyState}>
              <Package size={24} color="#444" />
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No products found</span>
            </div>
          ) : (
            <div style={S.productsGrid}>
              {filtered.map(product => {
                const stock = product.quantity ?? product.stock ?? 0;
                const outOfStock = stock <= 0;
                const lowStock = !outOfStock && stock <= 3;

                return (
                  <div
                    key={product.id}
                    style={{
                      ...S.productCard,
                      opacity: outOfStock ? 0.4 : 1,
                      cursor: outOfStock ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => !outOfStock && handleAddToCart(product)}
                  >
                    {product.image ? (
                      <img src={product.image} alt="" style={S.productCardImage} />
                    ) : (
                      <div style={{ ...S.productCardImage, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#444' }}>
                        {(product.name || '?')[0]}
                      </div>
                    )}

                    {outOfStock && <span style={{ ...S.badge, background: '#DC2626', color: '#FFF' }}>Out of stock</span>}
                    {lowStock && <span style={{ ...S.badge, background: '#F59E0B', color: '#000' }}>Low Stock</span>}

                    <div style={S.productInfo}>
                      <span style={S.productName}>{product.name}</span>
                      <span style={S.productSku}>{product.id}</span>
                      <div style={S.productFooter}>
                        <span style={S.productPrice}>{fmt(product.price)}</span>
                        <span style={S.productStock}>{stock} left</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Cart, Customer Form, Pinned Checkout */}
        <div style={S.rightColumn}>
          {/* Header */}
          <div style={S.cartHeader}>
            <span style={S.cartTitle}>Sale cart</span>
            {cart.length > 0 && <span style={S.cartBadge}>{cartItemCount} items</span>}
          </div>

          {/* Customer Selection Form */}
          <div style={S.customerHeader} onClick={() => setShowCustomer(!showCustomer)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={12} />
              <span>{customer.name || 'Walk-in Customer'}</span>
            </div>
            <ChevronDown size={12} style={{ transform: showCustomer ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </div>

          {showCustomer && (
            <div style={S.customerContent}>
              <input
                style={S.customerInput}
                placeholder="Name"
                value={customer.name}
                onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))}
              />
              <input
                style={S.customerInput}
                placeholder="Phone number"
                value={customer.phone}
                onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))}
              />
              <input
                style={S.customerInput}
                placeholder="Email (optional)"
                value={customer.email}
                onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))}
              />
            </div>
          )}

          {/* Cart list scroll area */}
          <div style={S.cartItemsList}>
            {cart.length === 0 ? (
              <div style={S.emptyState}>
                <ShoppingCart size={24} color="#444" />
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cart is empty</span>
              </div>
            ) : (
              cart.map(item => {
                const flash = flashItemKey === item.cartKey;
                return (
                  <div
                    key={item.cartKey}
                    style={{
                      ...S.cartItemRow,
                      animation: flash ? 'add-flash 0.8s ease' : 'none',
                    }}
                  >
                    <div style={S.cartItemDetails}>
                      <div style={S.cartItemName}>{item.name}</div>
                      {(item.selectedSize || item.selectedColor) && (
                        <div style={S.cartItemMeta}>
                          {item.selectedColor && (
                            <>
                              <span style={S.colorDot(item.selectedColor)} />
                              <span>{getCleanColorName(item.selectedColor)}</span>
                            </>
                          )}
                          {item.selectedColor && item.selectedSize && <span> · </span>}
                          {item.selectedSize && <span>Size {item.selectedSize}</span>}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span style={S.cartItemPrice}>{fmt(item.price)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px', background: 'rgba(255,255,255,0.02)' }}>
                          <button style={{ border: 'none', background: 'none', color: '#AAA', padding: '4px 6px', cursor: 'pointer' }} onClick={() => updateQty(item.cartKey, -1)}>
                            <Minus size={10} />
                          </button>
                          <span style={{ fontSize: '11px', fontWeight: 700, minWidth: '20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>{item.quantity}</span>
                          <button style={{ border: 'none', background: 'none', color: '#AAA', padding: '4px 6px', cursor: 'pointer' }} onClick={() => updateQty(item.cartKey, 1)}>
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button style={{ border: 'none', background: 'none', color: '#555', cursor: 'pointer', padding: '4px' }} onClick={() => removeItem(item.cartKey)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Pinned checkout panel */}
          <div style={S.footerPanel}>
            <div style={S.priceSummary}>
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>Total</span>
              <span style={S.priceValue}>{fmt(cartTotal)}</span>
            </div>

            {/* Payment buttons */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              {[
                { type: 'Cash', icon: Banknote },
                { type: 'Card', icon: CreditCard },
                { type: 'Mobile', icon: Smartphone },
              ].map(opt => {
                const Icon = opt.icon;
                const active = paymentType === opt.type;
                return (
                  <button
                    key={opt.type}
                    style={S.paymentBtn(active)}
                    onClick={() => setPaymentType(opt.type)}
                  >
                    <Icon size={14} />
                    <span>{opt.type}</span>
                  </button>
                );
              })}
            </div>

            <button
              style={S.checkoutBtn(cart.length === 0 || processing)}
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
            >
              {processing ? (
                <div style={S.spinner} />
              ) : (
                <>
                  <Check size={14} />
                  <span>Complete (F2)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Variant Selector Modal */}
      {variantModal && (
        <div style={S.modalOverlay} onClick={() => setVariantModal(null)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>
              <span>Select Variant</span>
              <X size={14} color="#666" style={{ cursor: 'pointer' }} onClick={() => setVariantModal(null)} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              {variantModal.image && <img src={variantModal.image} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '3px' }} />}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{variantModal.name}</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#22C55E', marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>{fmt(variantModal.price)}</div>
              </div>
            </div>

            {/* Color Swatches */}
            {variantModal.colors?.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>Color</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {variantModal.colors.map(col => (
                    <button
                      key={col}
                      style={{
                        padding: '6px 10px',
                        background: selectedVariants.color === col ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
                        border: selectedVariants.color === col ? '1px solid #22C55E' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '3px',
                        color: selectedVariants.color === col ? '#22C55E' : '#AAA',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedVariants(v => ({ ...v, color: col }))}
                    >
                      <span style={S.colorDot(col)} />
                      {getCleanColorName(col)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {variantModal.sizes?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>Size</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {variantModal.sizes.map(sz => (
                    <button
                      key={sz}
                      style={{
                        padding: '6px 10px',
                        background: selectedVariants.size === sz ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
                        border: selectedVariants.size === sz ? '1px solid #22C55E' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '3px',
                        color: selectedVariants.size === sz ? '#22C55E' : '#AAA',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedVariants(v => ({ ...v, size: sz }))}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              style={{ ...S.checkoutBtn(false), marginTop: '10px' }}
              onClick={() => addItemToCart(variantModal, selectedVariants.size, selectedVariants.color)}
            >
              Add to cart
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div style={S.receiptOverlay} onClick={() => setReceipt(null)}>
          <div style={S.receiptCard} onClick={e => e.stopPropagation()}>
            <div style={S.receiptHeader}>
              <div style={S.receiptStoreName}>Stop & Shop</div>
              <div style={S.receiptLabel}>Sales Receipt</div>
              <div style={{ fontSize: '9px', color: '#999', marginTop: '6px' }}>
                {new Date(receipt.timestamp).toLocaleString('en-PK')}
              </div>
            </div>

            <div style={S.receiptRow}>
              <span style={{ color: '#999', fontSize: '9px', fontWeight: 700 }}>Order ID</span>
              <span style={{ fontWeight: 700 }}>{receipt.orderID}</span>
            </div>
            <div style={S.receiptRow}>
              <span style={{ color: '#999', fontSize: '9px', fontWeight: 700 }}>Receipt #</span>
              <span style={{ fontWeight: 700 }}>{receipt.receiptNumber}</span>
            </div>
            <div style={S.receiptRow}>
              <span style={{ color: '#999', fontSize: '9px', fontWeight: 700 }}>Cashier</span>
              <span>{receipt.cashier}</span>
            </div>
            <div style={S.receiptRow}>
              <span style={{ color: '#999', fontSize: '9px', fontWeight: 700 }}>Customer</span>
              <span>{receipt.customer}</span>
            </div>

            <div style={S.receiptDivider} />

            {receipt.items.map((item, i) => (
              <div key={i} style={{ marginBottom: '6px' }}>
                <div style={{ ...S.receiptRow, fontWeight: 700 }}>
                  <span>{item.name}</span>
                  <span>{fmt(item.price * item.quantity)}</span>
                </div>
                <div style={{ ...S.receiptRow, fontSize: '9px', color: '#666', paddingLeft: '8px' }}>
                  <span>
                    {item.quantity} × {fmt(item.price)}
                    {item.selectedSize && ` · Sz ${item.selectedSize}`}
                    {item.selectedColor && ` · ${getCleanColorName(item.selectedColor)}`}
                  </span>
                </div>
              </div>
            ))}

            <div style={S.receiptTotal}>
              <span>TOTAL PAID</span>
              <span>{fmt(receipt.total)}</span>
            </div>

            <div style={S.receiptFooter}>
              <div style={{ fontSize: '9px', color: '#999' }}>Thank you for shopping with us!</div>
            </div>

            <div style={S.receiptActions}>
              <button style={S.receiptBtn(false)} onClick={() => window.print()}>
                <Printer size={12} />
                <span>Print</span>
              </button>
              <button style={S.receiptBtn(true)} onClick={() => setReceipt(null)}>
                <ArrowLeft size={12} />
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div style={S.errorToast}>
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default AdminPOS;
