'use client';

/**
 * CheckoutPage — Premium Minimalist Edition
 * Two-column layout: form left, order summary right.
 * Surgical inputs, zero rounded corners on CTAs, Cardinal Red accents.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from '../utils/router-compat.jsx';
import {
  ShoppingBag, ArrowLeft, Lock, ChevronRight,
  CreditCard, Banknote, Smartphone, CheckCircle, AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { apiUrl } from '../config/api.js';
import { useMutation } from '../hooks/useAsync.js';

// ── Field + Input components ─────────────────────────────────────

const Field = ({ label, error, required, children }) => (
  <div>
    <label className="block text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 mb-2">
      {label}{required && <span className="text-cardinal ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center space-x-1 text-[9px] font-bold text-cardinal mt-1.5">
        <AlertCircle size={9} />
        <span>{error}</span>
      </p>
    )}
  </div>
);

const inputBase = (hasError) =>
  `w-full bg-transparent border-b-2 py-3 text-sm font-bold text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-300 placeholder:font-normal ${
    hasError
      ? 'border-cardinal'
      : 'border-gray-200 focus:border-gray-900'
  }`;

// ── Payment methods ──────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Cash on Delivery', Icon: Banknote, desc: 'Pay when your order arrives' },
  { value: 'JazzCash', label: 'JazzCash', Icon: Smartphone, desc: 'Mobile wallet payment' },
  { value: 'Easypaisa', label: 'Easypaisa', Icon: Smartphone, desc: 'Mobile wallet payment' },
  { value: 'ATM Card', label: 'ATM / Debit Card', Icon: CreditCard, desc: 'Bank card payment' },
  { value: 'Bank Transfer', label: 'Bank Transfer', Icon: Banknote, desc: 'Direct bank transfer' },
];

// ── Order Summary item ───────────────────────────────────────────

const SummaryItem = ({ item, formatPrice }) => (
  <div className="flex items-start space-x-3 py-3 border-b border-gray-50 last:border-0">
    <div className="relative w-14 h-16 bg-[#F8F7F5] flex-shrink-0 overflow-hidden">
      {item.image && (
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
      )}
      <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-gray-900 text-black text-[8px] font-black rounded-full flex items-center justify-center">
        {item.quantity ?? 1}
      </span>
    </div>
    <div className="flex-grow min-w-0">
      <p className="text-[10px] font-black uppercase tracking-tight text-gray-900 line-clamp-2 leading-snug">
        {item.name}
      </p>
      {(item.selectedSize || item.selectedColor) && (
        <p className="text-[9px] text-gray-400 mt-0.5">
          {[item.selectedSize, item.selectedColor].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
    <p className="text-[11px] font-black text-gray-900 flex-shrink-0">
      {formatPrice(item.price * (item.quantity ?? 1))}
    </p>
  </div>
);

// ── Main Checkout Page ───────────────────────────────────────────

const CheckoutPage = () => {
  const { cartItems, total, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', address: '', city: '', zip: '',
    paymentMethod: 'COD',
  });
  const [errors, setErrors] = useState({});
  const [stockWarnings, setStockWarnings] = useState([]);

  const setField = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: '' }));
  };

  // ── Validate ──────────────────────────────────────────────────

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim())  e.lastName  = 'Required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone.trim())  e.phone   = 'Required';
    if (!form.address.trim() || form.address.trim().length < 5) e.address = 'Full address required';
    if (!form.city.trim())   e.city    = 'Required';
    return e;
  };

  // ── Checkout mutation ──────────────────────────────────────────

  const { mutate: placeOrder, loading: placing, error: checkoutError } = useMutation(
    async () => {
      const errs = validate();
      setErrors(errs);
      if (Object.keys(errs).length) throw new Error('Please fix the form errors above.');

      const customer = {
        name:    `${form.firstName} ${form.lastName}`.trim(),
        email:   form.email,
        address: form.address,
        city:    form.city,
        zip:     form.zip ?? '',
      };

      const items = cartItems.map(item => ({
        id:            item.id,
        name:          item.name,
        price:         item.price,
        quantity:      item.quantity ?? 1,
        selectedSize:  item.selectedSize  ?? '',
        selectedColor: item.selectedColor ?? '',
        category:      item.bucket        ?? '',
        subCategory:   item.subCategory   ?? '',
      }));

      const res = await fetch(apiUrl('/api/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, items, total, paymentMethod: form.paymentMethod }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Checkout failed. Please try again.');
      }
      return res.json();
    },
    {
      onSuccess: (data) => {
        clearCart();
        navigate(`/order-success?orderID=${data.orderID}`, { replace: true });
      },
      onError: (err) => {
        if (err.message?.includes('stock')) setStockWarnings([err.message]);
      },
    }
  );

  // ── Empty cart guard ──────────────────────────────────────────

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 border border-gray-100 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={24} strokeWidth={1} className="text-gray-300" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-2">Your bag is empty</h2>
          <p className="text-sm text-gray-400 mb-8">Add items before checking out.</p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-cardinal text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-gray-900 transition-colors duration-300"
          >
            <ArrowLeft size={13} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 sm:px-10 lg:px-16 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft size={13} />
          <span>Back to Shop</span>
        </Link>
        <span className="text-lg font-black italic uppercase tracking-tighter text-cardinal">
          Stop<span className="text-gray-900 not-italic">&</span>Shop
        </span>
        <div className="flex items-center space-x-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
          <Lock size={10} className="text-cardinal" />
          <span>Secure Checkout</span>
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-20">

          {/* ── LEFT: Form ───────────────────────────────────── */}
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-10">
              Shipping & Payment
            </h1>

            {/* Error banner */}
            {checkoutError && !checkoutError.includes('form') && (
              <div className="mb-6 flex items-start space-x-3 p-4 bg-red-50 border-l-2 border-cardinal">
                <AlertCircle size={14} className="text-cardinal flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-cardinal">{checkoutError}</p>
              </div>
            )}

            {stockWarnings.length > 0 && (
              <div className="mb-6 p-4 bg-orange-50 border-l-2 border-orange-400">
                <p className="text-xs font-bold text-orange-700">{stockWarnings[0]}</p>
              </div>
            )}

            {/* ── Contact Info ─────────────────────────────── */}
            <section className="mb-10">
              <h2 className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 mb-6 pb-3 border-b border-gray-100">
                Contact Information
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <Field label="First Name" required error={errors.firstName}>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={setField('firstName')}
                      placeholder="Ahmed"
                      className={inputBase(errors.firstName)}
                    />
                  </Field>
                  <Field label="Last Name" required error={errors.lastName}>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={setField('lastName')}
                      placeholder="Khan"
                      className={inputBase(errors.lastName)}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <Field label="Email" required error={errors.email}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={setField('email')}
                      placeholder="ahmed@email.com"
                      className={inputBase(errors.email)}
                    />
                  </Field>
                  <Field label="Phone" required error={errors.phone}>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={setField('phone')}
                      placeholder="0300-0000000"
                      className={inputBase(errors.phone)}
                    />
                  </Field>
                </div>
              </div>
            </section>

            {/* ── Delivery Address ─────────────────────────── */}
            <section className="mb-10">
              <h2 className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 mb-6 pb-3 border-b border-gray-100">
                Delivery Address
              </h2>
              <div className="space-y-6">
                <Field label="Street Address" required error={errors.address}>
                  <input
                    type="text"
                    value={form.address}
                    onChange={setField('address')}
                    placeholder="House #, Street, Area"
                    className={inputBase(errors.address)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-5">
                  <Field label="City" required error={errors.city}>
                    <input
                      type="text"
                      value={form.city}
                      onChange={setField('city')}
                      placeholder="Lahore"
                      className={inputBase(errors.city)}
                    />
                  </Field>
                  <Field label="Postal Code" error={errors.zip}>
                    <input
                      type="text"
                      value={form.zip}
                      onChange={setField('zip')}
                      placeholder="54000"
                      className={inputBase(errors.zip)}
                    />
                  </Field>
                </div>
              </div>
            </section>

            {/* ── Payment Method ───────────────────────────── */}
            <section className="mb-10">
              <h2 className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 mb-6 pb-3 border-b border-gray-100">
                Payment Method
              </h2>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(({ value, label, Icon, desc }) => (
                  <label
                    key={value}
                    className={`flex items-center space-x-4 p-4 border cursor-pointer transition-all duration-200 ${
                      form.paymentMethod === value
                        ? 'border-gray-900 bg-gray-900 text-black'
                        : 'border-gray-200 bg-white hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={value}
                      checked={form.paymentMethod === value}
                      onChange={() => setForm(f => ({ ...f, paymentMethod: value }))}
                      className="sr-only"
                    />
                    <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                      form.paymentMethod === value ? 'bg-cardinal' : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <Icon size={14} className={form.paymentMethod === value ? 'text-black' : 'text-gray-500'} />
                    </div>
                    <div className="flex-grow">
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                        form.paymentMethod === value ? 'text-black' : 'text-gray-900'
                      }`}>
                        {label}
                      </p>
                      <p className={`text-[9px] mt-0.5 ${
                        form.paymentMethod === value ? 'text-gray-400' : 'text-gray-400'
                      }`}>
                        {desc}
                      </p>
                    </div>
                    {form.paymentMethod === value && (
                      <CheckCircle size={14} className="text-cardinal flex-shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            </section>

            {/* ── Place Order CTA (mobile) ──────────────────── */}
            <div className="lg:hidden">
              <button
                onClick={placeOrder}
                disabled={placing}
                className="w-full flex items-center justify-center space-x-3 bg-cardinal text-white py-5 text-[11px] font-black uppercase tracking-[0.35em] hover:bg-gray-900 transition-colors duration-300 disabled:opacity-50"
              >
                {placing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock size={13} />
                    <span>Place Order · {formatPrice(total)}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Order Summary ──────────────────────────── */}
          <div>
            <div className="bg-white border border-gray-100 p-8 sticky top-24">
              <h2 className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 mb-6 pb-3 border-b border-gray-100">
                Order Summary ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})
              </h2>

              {/* Items */}
              <div className="max-h-[320px] overflow-y-auto mb-4">
                {cartItems.map(item => (
                  <SummaryItem
                    key={item.cartId ?? item.id}
                    item={item}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 py-4 border-t border-gray-100">
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Subtotal</span>
                  <span className="text-[11px] font-black text-gray-900">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Shipping</span>
                  <span className="text-[11px] font-bold text-gray-500">Calculated later</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900">Total</span>
                  <span className="text-xl font-black text-gray-900">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout CTA — desktop */}
              <button
                onClick={placeOrder}
                disabled={placing}
                className="hidden lg:flex w-full items-center justify-center space-x-3 bg-cardinal text-white py-5 mt-4 text-[11px] font-black uppercase tracking-[0.35em] hover:bg-gray-900 transition-colors duration-300 disabled:opacity-50"
              >
                {placing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock size={13} />
                    <span>Place Order</span>
                    <ChevronRight size={13} />
                  </>
                )}
              </button>

              {/* Trust badges */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-center text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Safe & Secure Checkout
                </p>
                <div className="flex items-center justify-center space-x-2 flex-wrap gap-y-2">
                  {['JazzCash', 'Easypaisa', 'ATM Card', 'COD'].map(m => (
                    <span key={m} className="text-[7px] font-black uppercase tracking-widest text-gray-400 border border-gray-100 px-2 py-1">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;