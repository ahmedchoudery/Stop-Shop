'use client';

/**
 * @fileoverview OrderTrackingPage.jsx
 * Public page — no login required.
 * Route: /track?orderID=ORD-XXXXXXXX
 *
 * Features:
 *  - Order ID input if not in URL params
 *  - Visual step-by-step status tracker
 *  - Full order summary (items, sizes, colors, categories)
 *  - Payment method display
 *  - Estimated delivery notice
 *  - Matches Stop & Shop design system (Cardinal Red, Obsidian, Amber Gold)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from '../utils/router-compat.jsx';
import {
  Search, Package, Truck, CheckCircle, Clock,
  MapPin, CreditCard, ShoppingBag, ArrowRight,
  ChevronRight, AlertCircle, RefreshCw, X,
  Home
} from 'lucide-react';
import { apiUrl } from '../config/api.js';

// ─────────────────────────────────────────────────────────────────
// ORDER STATUS CONFIG
// ─────────────────────────────────────────────────────────────────

const STATUS_STEPS = [
  {
    key:      'Pending',
    label:    'Order Placed',
    sub:      'We received your order',
    icon:     Clock,
    color:    'text-amber-500',
    bg:       'bg-amber-50',
    border:   'border-amber-200',
    barColor: 'bg-amber-400',
  },
  {
    key:      'Processing',
    label:    'Processing',
    sub:      'Preparing your items',
    icon:     Package,
    color:    'text-blue-500',
    bg:       'bg-blue-50',
    border:   'border-blue-200',
    barColor: 'bg-blue-400',
  },
  {
    key:      'Shipped',
    label:    'Shipped',
    sub:      'On the way to you',
    icon:     Truck,
    color:    'text-cardinal',
    bg:       'bg-red-50',
    border:   'border-red-200',
    barColor: 'bg-cardinal',
  },
  {
    key:      'Delivered',
    label:    'Delivered',
    sub:      'Enjoy your order!',
    icon:     CheckCircle,
    color:    'text-green-600',
    bg:       'bg-green-50',
    border:   'border-green-200',
    barColor: 'bg-green-500',
  },
];

const CANCELLED_CONFIG = {
  key:    'Cancelled',
  label:  'Cancelled',
  sub:    'This order was cancelled',
  icon:   X,
  color:  'text-gray-400',
  bg:     'bg-gray-50',
  border: 'border-gray-200',
};

const PAYMENT_LABELS = {
  'COD':           'Cash on Delivery',
  'ATM Card':      'ATM / Debit Card',
  'Bank Transfer': 'Bank Transfer',
  'Easypaisa':     'Easypaisa',
  'JazzCash':      'JazzCash',
};

// ─────────────────────────────────────────────────────────────────
// STATUS TRACKER
// ─────────────────────────────────────────────────────────────────

const StatusTracker = ({ status }) => {
  if (status === 'Cancelled') {
    const cfg = CANCELLED_CONFIG;
    const Icon = cfg.icon;
    return (
      <div className={`flex items-center space-x-4 p-6 rounded-[4px] border ${cfg.border} ${cfg.bg}`}>
        <div className={`w-12 h-12 rounded-[4px] ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className={cfg.color} />
        </div>
        <div>
          <p className="font-black uppercase tracking-tight text-gray-900">{cfg.label}</p>
          <p className="text-xs text-gray-400 font-bold mt-0.5">{cfg.sub}</p>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.findIndex(s => s.key === status);

  return (
    <div className="relative">
      {/* Steps */}
      <div className="flex items-start justify-between relative">

        {/* Progress bar behind steps */}
        <div className="absolute top-6 left-0 right-0 h-[2px] bg-gray-100 z-0">
          <div
            className="h-full bg-cardinal transition-all duration-700 ease-out"
            style={{
              width: currentIndex === -1 ? '0%'
                : `${(currentIndex / (STATUS_STEPS.length - 1)) * 100}%`
            }}
          />
        </div>

        {STATUS_STEPS.map((step, i) => {
          const Icon       = step.icon;
          const isComplete = currentIndex >= i;
          const isCurrent  = currentIndex === i;

          return (
            <div key={step.key} className="flex flex-col items-center z-10 flex-1">
              {/* Circle */}
              <div className={`
                w-12 h-12 rounded-[4px] border-2 flex items-center justify-center
                transition-all duration-500
                ${isComplete
                  ? `${step.bg} ${step.border} shadow-lg`
                  : 'bg-white border-gray-200'
                }
                ${isCurrent ? 'ring-4 ring-offset-2 ring-cardinal/20 scale-110' : ''}
              `}>
                <Icon
                  size={18}
                  className={isComplete ? step.color : 'text-gray-300'}
                />
              </div>

              {/* Label */}
              <div className="mt-3 text-center px-1">
                <p className={`text-[10px] font-black uppercase tracking-widest ${
                  isComplete ? 'text-gray-900' : 'text-gray-300'
                }`}>
                  {step.label}
                </p>
                <p className={`text-[9px] font-bold mt-0.5 hidden sm:block ${
                  isCurrent ? 'text-cardinal' : 'text-gray-400'
                }`}>
                  {isCurrent ? '← Current' : step.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// ORDER SEARCH FORM
// ─────────────────────────────────────────────────────────────────

const OrderSearchForm = ({ onSearch, loading, initialOrderId = '' }) => {
  const [orderID, setOrderID] = useState(initialOrderId);
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = orderID.trim().toUpperCase();
    const mail = email.trim().toLowerCase();
    if (id && mail) onSearch(id, mail);
  };

  return (
    <div className="max-w-lg mx-auto bg-white border-2 border-gray-900 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_70px_rgba(0,0,0,0.12)] transition-shadow duration-500 text-left">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 mb-2">Order ID</label>
          <div className="relative border-b-2 border-gray-200 focus-within:border-gray-900 transition-colors">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={orderID}
              onChange={e => setOrderID(e.target.value.toUpperCase())}
              placeholder="ORD-XXXXXXXX"
              className="w-full bg-transparent pl-7 py-3.5 text-gray-900 font-black text-sm outline-none placeholder:text-gray-300 placeholder:font-normal tracking-widest uppercase"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 mb-2">Email Address</label>
          <div className="relative border-b-2 border-gray-200 focus-within:border-gray-900 transition-colors">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              className="w-full bg-transparent py-3.5 text-gray-900 font-bold text-sm outline-none placeholder:text-gray-300 placeholder:font-normal"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!orderID.trim() || !email.trim() || loading}
          className="w-full bg-cardinal hover:bg-gray-900 text-white py-4.5 font-black uppercase tracking-[0.3em] text-[10px] transition-all duration-300 disabled:opacity-40 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Track Order</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>
      <p className="text-center text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 mt-5">
        Enter the order ID & email address from your confirmation
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// ORDER RESULT CARD
// ─────────────────────────────────────────────────────────────────

const OrderResult = ({ order, onReset }) => {
  const currentStep = STATUS_STEPS.find(s => s.key === order.status);

  // Estimated delivery messaging
  const deliveryMessage = {
    Pending:    '3–5 business days estimated',
    Processing: '2–4 business days estimated',
    Shipped:    '1–2 business days estimated',
    Delivered:  'Delivered successfully',
    Cancelled:  'Order was cancelled',
  }[order.status] ?? '';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">

      {/* Order Header */}
      <div className="bg-white border border-gray-200 rounded-[4px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Top accent */}
        <div className="h-1 bg-cardinal" />

        <div className="p-6 sm:p-8">
          {/* Order ID + Reset */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-cardinal mb-1">
                Order Reference
              </p>
              <p className="text-2xl font-black text-gray-900 tracking-tighter font-mono">
                {order.orderID}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Placed {new Date(order.createdAt).toLocaleDateString('en-PK', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </p>
            </div>

            <button
              onClick={onReset}
              className="flex items-center space-x-1.5 px-3 py-2 border border-gray-200 rounded-[4px] text-[9px] font-black uppercase tracking-widest text-gray-400 hover:border-gray-900 hover:text-gray-900 transition-all"
            >
              <RefreshCw size={11} />
              <span>New Search</span>
            </button>
          </div>

          {/* Delivery estimate */}
          {deliveryMessage && (
            <div className={`flex items-center space-x-3 p-3 rounded-[4px] mb-8 ${
              order.status === 'Delivered'
                ? 'bg-green-50 border border-green-100'
                : order.status === 'Cancelled'
                  ? 'bg-gray-50 border border-gray-100'
                  : 'bg-cardinal/5 border border-cardinal/10'
            }`}>
              <Truck size={14} className={
                order.status === 'Delivered' ? 'text-green-500' :
                order.status === 'Cancelled' ? 'text-gray-400' :
                'text-cardinal'
              } />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-700">
                {deliveryMessage}
              </p>
            </div>
          )}

          {/* Status Tracker */}
          <StatusTracker status={order.status} />

          {/* Courier Shipment Details Card */}
          {order.status === 'Shipped' && order.courier && order.trackingNumber && (
            <div className="mt-8 p-4 bg-gray-50 border border-gray-150 rounded-[4px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Shipment Courier</p>
                <p className="text-xs font-black text-gray-900 uppercase tracking-tight mt-0.5">{order.courier}</p>
                <p className="text-[10px] font-bold text-gray-500 mt-1">Tracking ID: <span className="font-mono text-black font-black">{order.trackingNumber}</span></p>
              </div>
              <a
                href={
                  order.courier.toLowerCase().includes('tcs')
                    ? `https://www.tcsexpress.com/tracking?tracking-number=${encodeURIComponent(order.trackingNumber)}`
                    : order.courier.toLowerCase().includes('leopard')
                    ? `https://www.leopardscourier.com/tracking?track-number=${encodeURIComponent(order.trackingNumber)}`
                    : `https://www.google.com/search?q=${encodeURIComponent(order.courier + ' tracking ' + order.trackingNumber)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black text-white px-4 py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-black/90 transition-all flex items-center space-x-1.5"
              >
                <span>Track on Courier Site &rarr;</span>
              </a>
            </div>
          )}

          {/* Review Prompt Details Card for Delivered orders */}
          {order.status === 'Delivered' && order.items && order.items.length > 0 && (
            <div className="mt-8 p-6 bg-[#FAFAF9] border border-gray-250 rounded-[4px] text-center space-y-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-cardinal">
                Loved your style upgrade?
              </p>
              <p className="text-xs text-gray-500 font-bold max-w-md mx-auto uppercase tracking-wider">
                Share your thoughts and help others make the perfect choice. Write a review for your items:
              </p>
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                {order.items.map((item, i) => (
                  <Link
                    key={`${item.id}-${i}`}
                    to={`/product/${item.id}?write-review=true`}
                    className="bg-gray-900 hover:bg-black text-white text-[9px] font-black uppercase tracking-widest py-3 px-4 transition-all rounded-none flex items-center justify-center space-x-2"
                  >
                    <span>Review {item.name}</span>
                    <ArrowRight size={10} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer + Payment Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Delivery To */}
        <div className="bg-white border border-gray-200 rounded-[4px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin size={14} className="text-cardinal" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">
              Delivering To
            </p>
          </div>
          <p className="font-black uppercase tracking-tight text-gray-900 mb-1">
            {order.customer?.name}
          </p>
          <p className="text-xs font-bold text-gray-500 leading-relaxed uppercase tracking-wide">
            {order.customer?.address && <span>{order.customer.address}<br /></span>}
            {order.customer?.city && <span>{order.customer.city}</span>}
            {order.customer?.zip && <span>, {order.customer.zip}</span>}
          </p>
        </div>

        {/* Payment */}
        <div className="bg-white border border-gray-200 rounded-[4px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
          <div className="flex items-center space-x-2 mb-4">
            <CreditCard size={14} className="text-cardinal" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">
              Payment
            </p>
          </div>
          <p className="font-black uppercase tracking-tight text-gray-900 mb-1">
            {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
          </p>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-1">
              Order Total
            </p>
            <p className="text-xl font-black text-cardinal tracking-tighter">
              PKR {(order.total ?? 0).toLocaleString('en-PK')}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-[4px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center space-x-2">
          <ShoppingBag size={14} className="text-cardinal" />
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">
            Items Ordered ({order.items?.length ?? 0})
          </p>
        </div>

        <div className="divide-y divide-gray-50">
          {(order.items ?? []).map((item, i) => (
            <div key={`${item.id}-${i}`} className="flex items-center space-x-4 px-6 py-5">

              {/* Item number */}
              <div className="w-6 h-6 rounded-[4px] bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] font-black text-gray-400">{i + 1}</span>
              </div>

              {/* Details */}
              <div className="flex-grow min-w-0">
                <p className="text-sm font-black uppercase tracking-tight text-gray-900 truncate">
                  {item.name}
                </p>

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {/* SKU */}
                  <span className="font-mono text-[8px] font-bold text-gray-300">
                    #{item.id}
                  </span>

                  {/* Category */}
                  {item.category && (
                    <span className="text-[8px] font-black uppercase tracking-widest text-cardinal bg-red-50 px-2 py-0.5 rounded-[4px]">
                      {item.category}
                      {item.subCategory && item.subCategory !== 'General'
                        ? ` · ${item.subCategory}`
                        : ''}
                    </span>
                  )}

                  {/* Size */}
                  {item.selectedSize && (
                    <span className="text-[8px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 px-2 py-0.5 rounded-[4px]">
                      Size: {item.selectedSize}
                    </span>
                  )}

                  {/* Color */}
                  {item.selectedColor && (
                    <span className="flex items-center space-x-1 text-[8px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 px-2 py-0.5 rounded-[4px]">
                      <span
                        className="w-2 h-2 rounded-[4px] border border-white shadow-sm"
                        style={{
                          backgroundColor: item.selectedColor.includes('|')
                            ? item.selectedColor.split('|')[0]
                            : item.selectedColor
                        }}
                      />
                      <span>{item.selectedColor.split('|').pop()}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Qty + Price */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-black text-gray-900">
                  PKR {((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString('en-PK')}
                </p>
                <p className="text-[9px] font-bold text-gray-400 mt-0.5">
                  {item.quantity ?? 1} × PKR {(item.price ?? 0).toLocaleString('en-PK')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Total footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">
            Total Paid
          </p>
          <p className="text-lg font-black text-gray-900 tracking-tighter">
            PKR {(order.total ?? 0).toLocaleString('en-PK')}
          </p>
        </div>
      </div>

      {/* Help footer */}
      <div className="text-center py-4">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">
          Questions about your order?
        </p>
        <a
          href="mailto:concierge@stop-shop.pk"
          className="text-[9px] font-black uppercase tracking-widest text-cardinal border-b border-cardinal/30 hover:border-cardinal transition-colors pb-0.5 mt-1 inline-block"
        >
          concierge@stop-shop.pk
        </a>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────

const OrderTrackingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderID') || searchParams.get('orderId') || '';
  const urlEmail = searchParams.get('email') || '';

  const [orderID, setOrderID]   = useState(urlOrderId.toUpperCase());
  const [email, setEmail]       = useState(urlEmail.toLowerCase());
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const hasFetchedRef           = useRef(false);

  // Auto-fetch if both orderID and email are in the URL
  useEffect(() => {
    if (urlOrderId && urlEmail && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchOrder(urlOrderId.toUpperCase(), urlEmail.toLowerCase());
    }
  }, [urlOrderId, urlEmail]);

  const fetchOrder = async (id, mail) => {
    if (!id || !mail) return;
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch(apiUrl(`/api/public/track/${encodeURIComponent(id)}?email=${encodeURIComponent(mail)}`));
      const data = await res.json().catch(() => ({}));

      if (res.status === 404) {
        setError(`No order found matching those details. Please check and try again.`);
        return;
      }
      if (res.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
        return;
      }
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setOrder(data);
      // Sync URL params
      setSearchParams({ orderID: id, email: mail }, { replace: true });

    } catch {
      setError('Could not connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (id, mail) => {
    setOrderID(id);
    setEmail(mail);
    fetchOrder(id, mail);
  };

  const handleReset = () => {
    setOrder(null);
    setError('');
    setOrderID('');
    setEmail('');
    setSearchParams({}, { replace: true });
    hasFetchedRef.current = false;
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center space-x-3 group"
          >
            <div className="w-7 h-7 bg-cardinal flex items-center justify-center">
              <span className="text-black text-[9px] font-black">S&S</span>
            </div>
            <span className="text-sm font-black uppercase tracking-tighter text-gray-900 group-hover:text-cardinal transition-colors">
              Stop & Shop
            </span>
          </Link>

          <Link
            to="/"
            className="flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
          >
            <Home size={12} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      {/* ── Page Content ───────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Hero text */}
        {!order && (
          <div className="text-center mb-14">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-cardinal mb-4">
              Order Status
            </p>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-gray-900 mb-4">
              Track Your Order
            </h1>
            <p className="text-gray-400 font-bold text-sm max-w-sm mx-auto">
              Enter your order ID to see live status, delivery info, and what you ordered.
            </p>
          </div>
        )}

        {/* Search form — show when no result yet */}
        {!order && (
          <div className="mb-10">
            <OrderSearchForm onSearch={handleSearch} loading={loading} initialOrderId={orderID} />
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-2 border-gray-100 border-t-cardinal rounded-[4px] animate-spin" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">
              Looking up your order...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="max-w-lg mx-auto animate-fade-up">
            <div className="bg-white border border-red-100 rounded-[4px] p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <div className="w-14 h-14 bg-red-50 rounded-[4px] flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={22} className="text-cardinal" />
              </div>
              <p className="font-black uppercase tracking-tight text-gray-900 mb-2">
                Order Not Found
              </p>
              <p className="text-sm text-gray-500 font-bold mb-6">
                {error}
              </p>
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 mx-auto px-6 py-3 bg-cardinal text-white text-[10px] font-black uppercase tracking-widest rounded-[4px] hover:brightness-110 transition-all"
              >
                <RefreshCw size={12} />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}

        {/* Order result */}
        {order && !loading && (
          <OrderResult order={order} onReset={handleReset} />
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="border-t border-gray-100 py-8 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-300">
          Stop & Shop · Premium Clothing · Pakistan
        </p>
      </div>
    </div>
  );
};

export default OrderTrackingPage;