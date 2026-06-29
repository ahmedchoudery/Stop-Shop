/**
 * @fileoverview AdminPOS — Built-in Point of Sale Interface
 * Route: /admin/pos
 * 
 * Touch-friendly, barcode-scanner-compatible POS terminal for physical store sales.
 * Features: SKU/barcode search, variant selection, cart management, payment processing,
 * receipt generation, and real-time inventory sync.
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
   STYLES
   ═══════════════════════════════════════════════════════════ */

const S = {
  // Container
  page: {
    minHeight: '100vh',
    background: '#0A0A0A',
    color: '#F5F5F5',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(10,10,10,0.95)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 20,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerBadge: {
    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    color: '#000',
    fontSize: '9px',
    fontWeight: 800,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    padding: '3px 10px',
    borderRadius: '2px',
  },

  // Main layout
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },

  // Products panel (left)
  productsPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },

  // Cart panel (right)
  cartPanel: {
    width: '420px',
    minWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    background: '#111111',
  },

  // Search bar
  searchContainer: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '0 14px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#F5F5F5',
    fontSize: '14px',
    fontWeight: 500,
    padding: '12px 10px',
    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    letterSpacing: '0.02em',
  },

  // Products grid
  productsGrid: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px',
    alignContent: 'start',
  },

  // Product card
  productCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '6px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  productImage: {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover',
    borderRadius: '4px',
    background: '#1A1A1A',
  },
  productName: {
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    lineHeight: 1.3,
    color: '#E5E5E5',
  },
  productPrice: {
    fontSize: '14px',
    fontWeight: 800,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#22C55E',
  },
  productStock: {
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#888',
  },

  // Cart header
  cartHeader: {
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartTitle: {
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: '#999',
  },
  cartCount: {
    background: '#22C55E',
    color: '#000',
    fontSize: '11px',
    fontWeight: 800,
    padding: '2px 8px',
    borderRadius: '2px',
  },

  // Cart items
  cartItems: {
    flex: 1,
    overflow: 'auto',
    padding: '12px 20px',
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  cartItemImage: {
    width: '48px',
    height: '48px',
    objectFit: 'cover',
    borderRadius: '4px',
    background: '#1A1A1A',
    flexShrink: 0,
  },
  cartItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  cartItemName: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: '#E5E5E5',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cartItemVariant: {
    fontSize: '10px',
    color: '#666',
    marginTop: '2px',
  },
  cartItemPrice: {
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    color: '#22C55E',
    marginTop: '4px',
  },
  qtyControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0px',
    borderRadius: '3px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  qtyBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    color: '#CCC',
    padding: '6px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background 0.15s',
  },
  qtyValue: {
    padding: '4px 10px',
    fontSize: '13px',
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#F5F5F5',
    background: 'transparent',
    minWidth: '32px',
    textAlign: 'center',
  },

  // Cart footer / payment
  cartFooter: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    padding: '20px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  totalLabel: {
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: '#999',
  },
  totalValue: {
    fontSize: '24px',
    fontWeight: 900,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#F5F5F5',
  },

  // Payment buttons
  paymentRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  paymentBtn: (selected) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '12px 8px',
    borderRadius: '4px',
    border: selected ? '2px solid #22C55E' : '1px solid rgba(255,255,255,0.08)',
    background: selected ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
    color: selected ? '#22C55E' : '#999',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  }),

  // Checkout button
  checkoutBtn: (disabled) => ({
    width: '100%',
    padding: '14px',
    borderRadius: '4px',
    border: 'none',
    background: disabled
      ? 'rgba(255,255,255,0.05)'
      : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    color: disabled ? '#555' : '#000',
    fontSize: '12px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  }),

  // Variant modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px',
  },
  modalContent: {
    background: '#141414',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '80vh',
    overflow: 'auto',
    padding: '24px',
  },
  modalTitle: {
    fontSize: '13px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#E5E5E5',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Variant chips
  variantLabel: {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#888',
    marginBottom: '8px',
    marginTop: '16px',
  },
  variantChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  variantChip: (selected) => ({
    padding: '8px 16px',
    borderRadius: '3px',
    border: selected ? '2px solid #22C55E' : '1px solid rgba(255,255,255,0.1)',
    background: selected ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
    color: selected ? '#22C55E' : '#CCC',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }),

  // Customer section
  customerSection: {
    padding: '12px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  customerToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#888',
    cursor: 'pointer',
    padding: '8px 0',
  },
  customerInput: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '3px',
    padding: '8px 12px',
    color: '#E5E5E5',
    fontSize: '12px',
    outline: 'none',
    fontFamily: "'Inter', system-ui, sans-serif",
    marginBottom: '6px',
  },

  // Receipt
  receiptOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px',
  },
  receiptCard: {
    background: '#FAFAFA',
    color: '#111',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '360px',
    padding: '32px 28px',
    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
  },
  receiptHeader: {
    textAlign: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px dashed #DDD',
  },
  receiptStoreName: {
    fontSize: '18px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: '#111',
  },
  receiptLabel: {
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: '#999',
    marginTop: '4px',
  },
  receiptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '11px',
    color: '#333',
  },
  receiptDivider: {
    borderTop: '1px dashed #DDD',
    margin: '12px 0',
  },
  receiptTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    fontWeight: 900,
    color: '#111',
    padding: '8px 0',
    borderTop: '2px solid #111',
    marginTop: '8px',
  },
  receiptFooter: {
    textAlign: 'center',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '2px dashed #DDD',
  },
  receiptActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  receiptBtn: (primary) => ({
    flex: 1,
    padding: '12px',
    borderRadius: '4px',
    border: primary ? 'none' : '1px solid #DDD',
    background: primary ? '#111' : '#FFF',
    color: primary ? '#FFF' : '#333',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  }),

  // Empty state
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#444',
    gap: '12px',
    padding: '40px',
  },

  // Error toast
  errorToast: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#DC2626',
    color: '#FFF',
    padding: '12px 24px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 700,
    zIndex: 300,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 8px 32px rgba(220,38,38,0.3)',
  },

  // Success overlay
  successOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 150,
  },
  successCard: {
    background: '#111',
    border: '2px solid #22C55E',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center',
  },
  successIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(34,197,94,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },

  // Loading
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.1)',
    borderTopColor: '#22C55E',
    borderRadius: '50%',
    animation: 'pos-spin 0.6s linear infinite',
  },

  // Out of stock badge
  outOfStockBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(220,38,38,0.9)',
    color: '#FFF',
    fontSize: '8px',
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  lowStockBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(245,158,11,0.9)',
    color: '#000',
    fontSize: '8px',
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
};

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

const AdminPOS = () => {
  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentType, setPaymentType] = useState('Cash');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [showCustomer, setShowCustomer] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [variantModal, setVariantModal] = useState(null); // product requiring variant selection
  const [selectedVariants, setSelectedVariants] = useState({ size: '', color: '' });

  const searchRef = useRef(null);
  const barcodeBuffer = useRef('');
  const barcodeTimer = useRef(null);

  // ── Fetch products ─────────────────────────────────────────
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

  // ── Barcode scanner support ────────────────────────────────
  // Barcode scanners emulate keyboard input ending with Enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in a regular input
      if (e.target.tagName === 'INPUT' && e.target !== searchRef.current) return;

      if (e.key === 'Enter' && barcodeBuffer.current.length >= 3) {
        e.preventDefault();
        const scannedCode = barcodeBuffer.current.trim();
        barcodeBuffer.current = '';

        // Look up product by ID/SKU
        const found = products.find(p =>
          p.id === scannedCode ||
          p.id?.toLowerCase() === scannedCode.toLowerCase()
        );

        if (found) {
          handleAddToCart(found);
        } else {
          setSearchQuery(scannedCode);
          if (searchRef.current) searchRef.current.focus();
        }
        return;
      }

      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        clearTimeout(barcodeTimer.current);
        barcodeTimer.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 100); // scanners type faster than 100ms per char
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, cart]);

  // ── Auto-focus search on mount ─────────────────────────────
  useEffect(() => {
    if (searchRef.current) searchRef.current.focus();
  }, []);

  // ── Clear error after 4s ───────────────────────────────────
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  // ── Product filtering ─────────────────────────────────────
  const filtered = products.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.id || '').toLowerCase().includes(q) ||
      (p.bucket || '').toLowerCase().includes(q) ||
      (p.subCategory || '').toLowerCase().includes(q)
    );
  });

  // ── Cart helpers ───────────────────────────────────────────
  const handleAddToCart = (product) => {
    const hasSizes = product.sizes && product.sizes.length > 0;
    const hasColors = product.colors && product.colors.length > 0;

    // If product has variants, show selector
    if (hasSizes || hasColors) {
      setVariantModal(product);
      setSelectedVariants({
        size: hasSizes ? product.sizes[0] : '',
        color: hasColors ? product.colors[0] : '',
      });
      return;
    }

    // Simple product — add directly
    addItemToCart(product, '', '');
  };

  const addItemToCart = (product, size, color) => {
    const cartKey = `${product.id}-${size}-${color}`;
    const existing = cart.find(c => c.cartKey === cartKey);

    if (existing) {
      setCart(prev => prev.map(c =>
        c.cartKey === cartKey
          ? { ...c, quantity: c.quantity + 1 }
          : c
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

    setVariantModal(null);
  };

  const updateQty = (cartKey, delta) => {
    setCart(prev => prev.map(c => {
      if (c.cartKey !== cartKey) return c;
      const newQty = c.quantity + delta;
      return newQty <= 0 ? null : { ...c, quantity: newQty };
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

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ── Checkout ───────────────────────────────────────────────
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

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Show receipt
      setReceipt({
        orderID: data.orderID,
        receiptNumber: data.receiptNumber,
        items: cart,
        total: data.total,
        paymentType,
        cashier: data.cashier,
        customer: customer.name || 'Walk-in',
        timestamp: data.timestamp,
      });

      // Clear cart
      setCart([]);
      setCustomer({ name: '', phone: '', email: '' });

      // Refresh products (stock updated)
      fetchProducts();

    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // ── Format currency ────────────────────────────────────────
  const fmt = (n) => `Rs. ${Math.round(n).toLocaleString()}`;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* CSS animation */}
      <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <header style={S.header}>
        <div style={S.headerTitle}>
          <ScanBarcode size={20} color="#22C55E" />
          <span style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Point of Sale
          </span>
          <span style={S.headerBadge}>Live</span>
        </div>
        <div style={{ fontSize: '11px', color: '#666', fontFamily: "'JetBrains Mono', monospace" }}>
          {new Date().toLocaleDateString('en-PK', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      </header>

      {/* Main layout */}
      <div style={S.main}>
        {/* ── Left: Products ────────────────────────────── */}
        <div style={S.productsPanel}>
          {/* Search */}
          <div style={S.searchContainer}>
            <div style={S.searchWrapper}>
              <Search size={16} color="#666" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Scan barcode or search by name, SKU..."
                style={S.searchInput}
                autoComplete="off"
                id="pos-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div style={S.emptyState}>
              <div style={S.spinner} />
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Loading catalogue...
              </span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={S.emptyState}>
              <Package size={32} />
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {searchQuery ? 'No products match your search' : 'No products available'}
              </span>
            </div>
          ) : (
            <div style={S.productsGrid}>
              {filtered.map(product => {
                const outOfStock = (product.quantity ?? product.stock ?? 0) <= 0;
                const lowStock = !outOfStock && (product.quantity ?? product.stock ?? 0) <= 3;

                return (
                  <div
                    key={product.id}
                    style={{
                      ...S.productCard,
                      opacity: outOfStock ? 0.4 : 1,
                      cursor: outOfStock ? 'not-allowed' : 'pointer',
                      position: 'relative',
                    }}
                    onClick={() => !outOfStock && handleAddToCart(product)}
                    title={outOfStock ? 'Out of stock' : `Add ${product.name} to cart`}
                  >
                    {product.image ? (
                      <img src={product.image} alt={product.name} style={S.productImage} loading="lazy" />
                    ) : (
                      <div style={{ ...S.productImage, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#333' }}>
                        {(product.name || '?')[0]}
                      </div>
                    )}
                    {outOfStock && <span style={S.outOfStockBadge}>Sold Out</span>}
                    {lowStock && <span style={S.lowStockBadge}>Low</span>}
                    <div style={S.productName}>{product.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={S.productPrice}>{fmt(product.price)}</span>
                      <span style={S.productStock}>
                        {product.quantity ?? product.stock ?? 0} pcs
                      </span>
                    </div>
                    {product.discount > 0 && (
                      <span style={{ fontSize: '9px', color: '#F59E0B', fontWeight: 700 }}>
                        -{product.discount}% OFF
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Cart ───────────────────────────────── */}
        <div style={S.cartPanel}>
          {/* Cart header */}
          <div style={S.cartHeader}>
            <span style={S.cartTitle}>Current Sale</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {cart.length > 0 && (
                <>
                  <span style={S.cartCount}>{cartItemCount}</span>
                  <button
                    onClick={clearCart}
                    style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '4px' }}
                    title="Clear cart"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Customer info (collapsible) */}
          <div style={S.customerSection}>
            <div style={S.customerToggle} onClick={() => setShowCustomer(!showCustomer)}>
              <User size={12} />
              <span>{customer.name || 'Walk-in Customer'}</span>
              <ChevronDown size={12} style={{ transform: showCustomer ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            {showCustomer && (
              <div style={{ marginTop: '8px' }}>
                <input
                  style={S.customerInput}
                  placeholder="Customer name"
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
          </div>

          {/* Cart items */}
          <div style={S.cartItems}>
            {cart.length === 0 ? (
              <div style={{ ...S.emptyState, padding: '60px 20px' }}>
                <ShoppingCart size={28} />
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Cart is empty
                </span>
                <span style={{ fontSize: '10px', color: '#555' }}>
                  Scan a barcode or click a product
                </span>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.cartKey} style={S.cartItem}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={S.cartItemImage} />
                  ) : (
                    <div style={{ ...S.cartItemImage, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '16px' }}>
                      {(item.name || '?')[0]}
                    </div>
                  )}
                  <div style={S.cartItemInfo}>
                    <div style={S.cartItemName}>{item.name}</div>
                    {(item.selectedSize || item.selectedColor) && (
                      <div style={S.cartItemVariant}>
                        {item.selectedColor && <span>{item.selectedColor}</span>}
                        {item.selectedColor && item.selectedSize && <span> · </span>}
                        {item.selectedSize && <span>{item.selectedSize}</span>}
                      </div>
                    )}
                    <div style={S.cartItemPrice}>{fmt(item.price * item.quantity)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={S.qtyControl}>
                      <button style={S.qtyBtn} onClick={() => updateQty(item.cartKey, -1)}>
                        <Minus size={12} />
                      </button>
                      <span style={S.qtyValue}>{item.quantity}</span>
                      <button style={S.qtyBtn} onClick={() => updateQty(item.cartKey, 1)}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.cartKey)}
                      style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '4px' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer: Payment + Checkout */}
          <div style={S.cartFooter}>
            <div style={S.totalRow}>
              <span style={S.totalLabel}>Total</span>
              <span style={S.totalValue}>{fmt(cartTotal)}</span>
            </div>

            {/* Payment type */}
            <div style={S.paymentRow}>
              {[
                { type: 'Cash', icon: Banknote },
                { type: 'Card', icon: CreditCard },
                { type: 'Mobile', icon: Smartphone },
              ].map(({ type, icon: Icon }) => (
                <button
                  key={type}
                  style={S.paymentBtn(paymentType === type)}
                  onClick={() => setPaymentType(type)}
                >
                  <Icon size={18} />
                  {type}
                </button>
              ))}
            </div>

            {/* Checkout */}
            <button
              style={S.checkoutBtn(cart.length === 0 || processing)}
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
              id="pos-checkout-btn"
            >
              {processing ? (
                <>
                  <div style={S.spinner} />
                  Processing...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Complete Sale — {fmt(cartTotal)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Variant Selector Modal ──────────────────── */}
      {variantModal && (
        <div style={S.modalOverlay} onClick={() => setVariantModal(null)}>
          <div style={S.modalContent} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>
              <span>Select Variant</span>
              <button
                onClick={() => setVariantModal(null)}
                style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Product preview */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              {variantModal.image && (
                <img src={variantModal.image} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '4px' }} />
              )}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#E5E5E5' }}>{variantModal.name}</div>
                <div style={{ fontSize: '14px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#22C55E', marginTop: '4px' }}>
                  {fmt(variantModal.price)}
                </div>
              </div>
            </div>

            {/* Colors */}
            {variantModal.colors?.length > 0 && (
              <>
                <div style={S.variantLabel}>Color</div>
                <div style={S.variantChips}>
                  {variantModal.colors.map(c => {
                    const name = c.includes('|') ? c.split('|').pop().trim() : c;
                    return (
                      <button
                        key={c}
                        style={S.variantChip(selectedVariants.color === c)}
                        onClick={() => setSelectedVariants(v => ({ ...v, color: c }))}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Sizes */}
            {variantModal.sizes?.length > 0 && (
              <>
                <div style={S.variantLabel}>Size</div>
                <div style={S.variantChips}>
                  {variantModal.sizes.map(s => (
                    <button
                      key={s}
                      style={S.variantChip(selectedVariants.size === s)}
                      onClick={() => setSelectedVariants(v => ({ ...v, size: s }))}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Add button */}
            <button
              style={{
                ...S.checkoutBtn(false),
                marginTop: '24px',
              }}
              onClick={() => addItemToCart(variantModal, selectedVariants.size, selectedVariants.color)}
            >
              <Plus size={16} />
              Add to Cart
            </button>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ───────────────────────────── */}
      {receipt && (
        <div style={S.receiptOverlay}>
          <div style={S.receiptCard}>
            <div style={S.receiptHeader}>
              <div style={S.receiptStoreName}>Stop & Shop</div>
              <div style={S.receiptLabel}>Sales Receipt</div>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '8px' }}>
                {new Date(receipt.timestamp).toLocaleString('en-PK')}
              </div>
            </div>

            <div style={S.receiptRow}>
              <span style={{ color: '#999', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>Order ID</span>
              <span style={{ fontWeight: 700 }}>{receipt.orderID}</span>
            </div>
            <div style={S.receiptRow}>
              <span style={{ color: '#999', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>Receipt #</span>
              <span style={{ fontWeight: 700 }}>{receipt.receiptNumber}</span>
            </div>
            <div style={S.receiptRow}>
              <span style={{ color: '#999', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>Cashier</span>
              <span>{receipt.cashier}</span>
            </div>
            <div style={S.receiptRow}>
              <span style={{ color: '#999', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>Customer</span>
              <span>{receipt.customer}</span>
            </div>
            <div style={S.receiptRow}>
              <span style={{ color: '#999', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>Payment</span>
              <span>{receipt.paymentType}</span>
            </div>

            <div style={S.receiptDivider} />

            {/* Items */}
            {receipt.items.map((item, i) => (
              <div key={i}>
                <div style={{ ...S.receiptRow, fontWeight: 700 }}>
                  <span>{item.name}</span>
                </div>
                <div style={{ ...S.receiptRow, paddingLeft: '12px', fontSize: '10px', color: '#666' }}>
                  <span>
                    {item.quantity} × {fmt(item.price)}
                    {item.selectedSize && ` · ${item.selectedSize}`}
                    {item.selectedColor && ` · ${item.selectedColor.includes('|') ? item.selectedColor.split('|').pop().trim() : item.selectedColor}`}
                  </span>
                  <span>{fmt(item.price * item.quantity)}</span>
                </div>
              </div>
            ))}

            <div style={S.receiptTotal}>
              <span>TOTAL</span>
              <span>{fmt(receipt.total)}</span>
            </div>

            <div style={S.receiptFooter}>
              <div style={{ fontSize: '10px', color: '#999' }}>Thank you for shopping with us!</div>
              <div style={{ fontSize: '9px', color: '#BBB', marginTop: '4px' }}>
                Returns accepted within 7 days with receipt
              </div>
            </div>

            <div style={S.receiptActions}>
              <button style={S.receiptBtn(false)} onClick={() => window.print()}>
                <Printer size={12} />
                Print
              </button>
              <button style={S.receiptBtn(true)} onClick={() => setReceipt(null)}>
                <ArrowLeft size={12} />
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Error Toast ─────────────────────────────── */}
      {error && (
        <div style={S.errorToast}>
          <AlertTriangle size={14} />
          {error}
        </div>
      )}
    </div>
  );
};

export default AdminPOS;
