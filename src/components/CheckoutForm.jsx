/**
 * @fileoverview CheckoutForm.jsx
 * Updated: Auto-fills delivery address from saved customer profile.
 * If customer is logged in and has a saved address, pre-populates
 * address, city, zip fields and shows a "Using saved address" banner.
 * Customer can clear it and type manually anytime.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  User, Mail, MapPin, CreditCard, Tag,
  AlertTriangle, Lock, CheckCircle, Loader,
  UserCheck, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { useCustomer } from '../context/CustomerContext.jsx';
import CouponInput from './CouponInput.jsx';

// ─────────────────────────────────────────────────────────────────
// PAYMENT METHODS
// ─────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: 'COD',           label: 'Cash on Delivery',  sub: 'Pay when your order arrives' },
  { value: 'Easypaisa',     label: 'Easypaisa',          sub: 'Mobile wallet payment' },
  { value: 'JazzCash',      label: 'JazzCash',           sub: 'Mobile wallet payment' },
  { value: 'ATM Card',      label: 'ATM / Debit Card',   sub: 'Bank card payment' },
  { value: 'Bank Transfer', label: 'Bank Transfer',      sub: 'Direct bank transfer' },
];

// ─────────────────────────────────────────────────────────────────
// FIELD COMPONENT
// ─────────────────────────────────────────────────────────────────

const Field = ({ label, error, children }) => (
  <div>
    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 block mb-2">{label}</label>
    {children}
    {error && (
      <p className="text-[9px] font-bold text-[#ba1f3d] mt-1.5 flex items-center space-x-1">
        <AlertTriangle size={9} /><span>{error}</span>
      </p>
    )}
  </div>
);

const inputCls = (err) =>
  `w-full border-b-2 py-3 text-sm font-bold bg-transparent outline-none transition-all placeholder:text-gray-200 placeholder:font-normal ${
    err ? 'border-[#ba1f3d]' : 'border-gray-200 focus:border-[#ba1f3d]'
  }`;

// ─────────────────────────────────────────────────────────────────
// ORDER SUMMARY
// ─────────────────────────────────────────────────────────────────

const OrderSummary = ({ cartItems, total, coupon, formatPrice }) => (
  <div className="bg-gray-50 border border-gray-100 rounded-sm p-6">
    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-5">
      Order Summary ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})
    </p>
    <div className="space-y-3 mb-5">
      {cartItems.map((item, i) => (
        <div key={`${item.cartId ?? item.id}-${i}`} className="flex items-start space-x-3">
          <div className="w-12 h-14 bg-gray-200 flex-shrink-0 overflow-hidden">
            {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />}
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-[10px] font-black uppercase tracking-tight text-gray-900 truncate">{item.name}</p>
            {(item.selectedSize || item.selectedColor) && (
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                {item.selectedSize && `Size: ${item.selectedSize}`}
                {item.selectedSize && item.selectedColor && ' · '}
                {item.selectedColor && item.selectedColor.split('|').pop()}
              </p>
            )}
            <p className="text-[10px] font-black text-gray-500 mt-0.5">Qty: {item.quantity ?? 1}</p>
          </div>
          <p className="text-[11px] font-black text-gray-900 flex-shrink-0">
            {formatPrice((item.price ?? 0) * (item.quantity ?? 1))}
          </p>
        </div>
      ))}
    </div>
    <div className="border-t border-gray-200 pt-4 space-y-2">
      <div className="flex justify-between text-xs font-bold text-gray-500">
        <span>Subtotal</span><span>{formatPrice(total)}</span>
      </div>
      <div className="flex justify-between text-xs font-bold text-gray-500">
        <span>Shipping</span><span className="text-green-600 font-black">Free</span>
      </div>
      {coupon && (
        <div className="flex justify-between text-xs font-black text-green-700 bg-green-50 -mx-2 px-2 py-1.5 rounded">
          <span>Discount ({coupon.code})</span>
          <span>- {formatPrice(coupon.discount)}</span>
        </div>
      )}
      <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-1">
        <span className="text-sm font-black uppercase tracking-tight text-gray-900">Total</span>
        <span className="text-xl font-black text-[#ba1f3d] tracking-tighter">
          {formatPrice(coupon ? coupon.finalTotal : total)}
        </span>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// MAIN FORM
// ─────────────────────────────────────────────────────────────────

const CheckoutForm = ({ onComplete, stockWarnings = [], isSubmitting = false }) => {
  const { cartItems, total } = useCart();
  const { formatPrice }      = useCurrency();
  const { customer, isLoggedIn } = useCustomer();

  const [coupon, setCoupon] = useState(null);
  const [usingSavedAddress, setUsingSavedAddress] = useState(false);

  const [form, setForm] = useState({
    firstName:     '',
    lastName:      '',
    email:         '',
    address:       '',
    city:          '',
    zip:           '',
    paymentMethod: 'COD',
  });
  const [errors, setErrors] = useState({});

  // ── Auto-fill from saved customer profile ─────────────────────
  useEffect(() => {
    if (!isLoggedIn || !customer) return;

    // Split full name into first + last
    const nameParts = (customer.name ?? '').trim().split(' ');
    const firstName = nameParts[0] ?? '';
    const lastName  = nameParts.slice(1).join(' ') ?? '';

    setForm(f => ({
      ...f,
      firstName: firstName || f.firstName,
      lastName:  lastName  || f.lastName,
      email:     customer.email || f.email,
    }));

    // Auto-fill address only if customer has one saved
    if (customer.address || customer.city) {
      setForm(f => ({
        ...f,
        address: customer.address || f.address,
        city:    customer.city    || f.city,
        zip:     customer.zip     || f.zip,
      }));
      setUsingSavedAddress(true);
    }
  }, [isLoggedIn, customer]);

  const clearSavedAddress = () => {
    setForm(f => ({ ...f, address: '', city: '', zip: '' }));
    setUsingSavedAddress(false);
  };

  // ── Field updater ─────────────────────────────────────────────
  const set = useCallback((field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(err => ({ ...err, [field]: '' }));
    if (['address', 'city', 'zip'].includes(field)) setUsingSavedAddress(false);
  }, []);

  // ── Validate ──────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required';
    if (!form.email.trim())     e.email     = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.address.trim())   e.address   = 'Address is required';
    if (!form.city.trim())      e.city      = 'City is required';
    if (!form.paymentMethod)    e.paymentMethod = 'Select a payment method';
    return e;
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    onComplete({
      ...form,
      finalTotal: coupon?.finalTotal ?? total,
      couponCode: coupon?.code       ?? '',
    });
  };

  const finalTotal = coupon?.finalTotal ?? total;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

        {/* ── Form Fields ── */}
        <div className="lg:col-span-3 space-y-10">

          {/* Stock warnings */}
          {stockWarnings.length > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-sm">
              {stockWarnings.map((w, i) => (
                <p key={i} className="text-xs font-bold text-orange-700 flex items-start space-x-2">
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" /><span>{w}</span>
                </p>
              ))}
            </div>
          )}

          {/* Logged-in banner */}
          {isLoggedIn && (
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-100 rounded-sm">
              <UserCheck size={15} className="text-green-600 flex-shrink-0" />
              <div className="flex-grow">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-800">
                  Signed in as {customer?.name}
                </p>
                <p className="text-[9px] font-bold text-green-600 mt-0.5">
                  {usingSavedAddress ? 'Using your saved delivery address' : 'Profile info auto-filled'}
                </p>
              </div>
              <Link to="/account" className="text-[8px] font-black uppercase tracking-widest text-green-600 hover:underline whitespace-nowrap">
                My Account
              </Link>
            </div>
          )}

          {/* Not logged in nudge */}
          {!isLoggedIn && (
            <div className="flex items-center space-x-3 p-4 bg-gray-50 border border-gray-100 rounded-sm">
              <User size={14} className="text-gray-400 flex-shrink-0" />
              <p className="text-[9px] font-bold text-gray-500">
                <Link to="/account/login" className="text-[#ba1f3d] font-black hover:underline">Sign in</Link>
                {' '}to auto-fill your address and track this order in your account.
              </p>
            </div>
          )}

          {/* Contact */}
          <section>
            <div className="flex items-center space-x-2 mb-6">
              <User size={15} className="text-[#ba1f3d]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900">Contact Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="First Name *" error={errors.firstName}>
                <input type="text" value={form.firstName} onChange={set('firstName')} placeholder="Ahmed" autoComplete="given-name" className={inputCls(errors.firstName)} />
              </Field>
              <Field label="Last Name *" error={errors.lastName}>
                <input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Khan" autoComplete="family-name" className={inputCls(errors.lastName)} />
              </Field>
              <Field label="Email *" error={errors.email}>
                <div className="relative">
                  <Mail size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="email" value={form.email} onChange={set('email')} placeholder="ahmed@email.com" autoComplete="email" className={`${inputCls(errors.email)} pl-6`} />
                </div>
              </Field>
            </div>
          </section>

          {/* Delivery */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <MapPin size={15} className="text-[#ba1f3d]" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900">Delivery Address</h2>
              </div>
              {usingSavedAddress && (
                <button type="button" onClick={clearSavedAddress} className="flex items-center space-x-1 text-[9px] font-black text-gray-400 hover:text-[#ba1f3d] transition-colors uppercase tracking-widest">
                  <X size={10} /><span>Clear</span>
                </button>
              )}
            </div>

            {usingSavedAddress && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-sm">
                <p className="text-[9px] font-bold text-blue-700 uppercase tracking-widest">
                  📍 Using your saved address from profile. <button type="button" onClick={clearSavedAddress} className="underline hover:no-underline">Enter a different address</button>
                </p>
              </div>
            )}

            <div className="space-y-6">
              <Field label="Full Address *" error={errors.address}>
                <input type="text" value={form.address} onChange={set('address')} placeholder="House #, Street, Area" autoComplete="street-address" className={inputCls(errors.address)} />
              </Field>
              <div className="grid grid-cols-2 gap-6">
                <Field label="City *" error={errors.city}>
                  <input type="text" value={form.city} onChange={set('city')} placeholder="Gujrat" autoComplete="address-level2" className={inputCls(errors.city)} />
                </Field>
                <Field label="ZIP Code" error={errors.zip}>
                  <input type="text" value={form.zip} onChange={set('zip')} placeholder="50700" autoComplete="postal-code" className={inputCls(errors.zip)} />
                </Field>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section>
            <div className="flex items-center space-x-2 mb-6">
              <CreditCard size={15} className="text-[#ba1f3d]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900">Payment Method</h2>
            </div>
            <div className="space-y-2">
              {PAYMENT_METHODS.map(({ value, label, sub }) => (
                <label key={value} className={`flex items-center space-x-4 p-4 border-2 cursor-pointer transition-all duration-200 ${form.paymentMethod === value ? 'border-[#ba1f3d] bg-[#ba1f3d]/3' : 'border-gray-100 hover:border-gray-300'}`}>
                  <input type="radio" name="paymentMethod" value={value} checked={form.paymentMethod === value} onChange={set('paymentMethod')} className="sr-only" />
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${form.paymentMethod === value ? 'border-[#ba1f3d]' : 'border-gray-300'}`}>
                    {form.paymentMethod === value && <div className="w-2 h-2 rounded-full bg-[#ba1f3d]" />}
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs font-black uppercase tracking-tight text-gray-900">{label}</p>
                    <p className="text-[9px] font-bold text-gray-400 mt-0.5">{sub}</p>
                  </div>
                  {form.paymentMethod === value && <CheckCircle size={14} className="text-[#ba1f3d] flex-shrink-0" />}
                </label>
              ))}
              {errors.paymentMethod && <p className="text-[9px] font-bold text-[#ba1f3d] mt-1 flex items-center space-x-1"><AlertTriangle size={9} /><span>{errors.paymentMethod}</span></p>}
            </div>
          </section>

          {/* Coupon */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Tag size={15} className="text-[#ba1f3d]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900">Coupon Code</h2>
            </div>
            <CouponInput cartTotal={total} appliedCoupon={coupon} onApply={setCoupon} onRemove={() => setCoupon(null)} />
            {!coupon && <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-2">Try CARDINAL20 for 20% off</p>}
          </section>
        </div>

        {/* ── Order Summary ── */}
        <div className="lg:col-span-2 space-y-6">
          <OrderSummary cartItems={cartItems} total={total} coupon={coupon} formatPrice={formatPrice} />

          <div className="flex items-center space-x-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            <Lock size={11} className="text-[#ba1f3d]" />
            <span>256-bit SSL encrypted · Safe &amp; Secure</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-[0.3em] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-xl shadow-red-100/60"
          >
            {isSubmitting
              ? <><Loader size={14} className="animate-spin" /><span>Placing Order...</span></>
              : <><Lock size={14} /><span>Place Order · {formatPrice(finalTotal)}</span></>
            }
          </button>

          <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest text-center">
            By placing your order you agree to our terms of service
          </p>
        </div>
      </div>
    </form>
  );
};

export default CheckoutForm;