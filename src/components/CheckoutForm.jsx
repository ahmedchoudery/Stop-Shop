/**
 * @fileoverview CheckoutForm.jsx
 * Updated: Captures customer phone number and dynamic payment details based on selection.
 * Supports direct mobile wallet push or manual OTC transfer verification.
 * Supports debit/credit card Luhn verification with premium styled input fields.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, CreditCard, Tag,
  AlertTriangle, Lock, CheckCircle, Loader,
  UserCheck, X
} from 'lucide-react';
import { Link } from '../utils/router-compat.jsx';
import { useCart } from '../context/CartContext.tsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { useCustomer } from '../context/CustomerContext.jsx';
import CouponInput from './CouponInput.jsx';
import { calculateDiscount } from '../utils/pricing.js';
import { API_BASE } from '../config/api.js';

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

// Simple Luhn Algorithm for card number validation
function isValidLuhn(cardNumber) {
  const cleanNum = cardNumber.replace(/\D/g, '');
  if (!cleanNum || cleanNum.length < 13 || cleanNum.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = cleanNum.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNum.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// ─────────────────────────────────────────────────────────────────
// FIELD COMPONENT
// ─────────────────────────────────────────────────────────────────

const Field = ({ label, error, children }) => (
  <div>
    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 block mb-2">{label}</label>
    {children}
    {error && (
      <p className="text-[9px] font-bold text-cardinal mt-1.5 flex items-center space-x-1">
        <AlertTriangle size={9} /><span>{error}</span>
      </p>
    )}
  </div>
);

const inputCls = (err) =>
  `w-full border-b-2 py-3 text-sm font-bold bg-transparent outline-none transition-all placeholder:text-gray-200 placeholder:font-normal ${
    err ? 'border-cardinal' : 'border-gray-200 focus:border-gray-900'
  }`;

// ─────────────────────────────────────────────────────────────────
// ORDER SUMMARY
// ─────────────────────────────────────────────────────────────────

const OrderSummary = ({ cartItems, total, coupon, formatPrice }) => {
  const { discount, finalTotal } = calculateDiscount(total, coupon);
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-none p-6">
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
            <div className="text-right flex-shrink-0">
              {item.discount > 0 ? (
                <>
                  <p className="text-[11px] font-black text-cardinal">
                    {formatPrice(item.price * (1 - item.discount / 100) * (item.quantity ?? 1))}
                  </p>
                  <p className="text-[9px] text-gray-450 line-through font-mono">
                    {formatPrice(item.price * (item.quantity ?? 1))}
                  </p>
                </>
              ) : (
                <p className="text-[11px] font-black text-gray-900">
                  {formatPrice((item.price ?? 0) * (item.quantity ?? 1))}
                </p>
              )}
            </div>
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
        {coupon && discount > 0 && (
          <div className="flex justify-between text-xs font-black text-green-700 bg-green-50 -mx-2 px-2 py-1.5 rounded-none">
            <span>Discount ({coupon.code})</span>
            <span>- {formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-1">
          <span className="text-sm font-black uppercase tracking-tight text-gray-900">Total</span>
          <span className="text-xl font-black text-cardinal tracking-tighter">
            {formatPrice(finalTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN FORM
// ─────────────────────────────────────────────────────────────────

const CheckoutForm = ({ onComplete, stockWarnings = [], isSubmitting = false }) => {
  const { cartItems, total, appliedCoupon: coupon, setAppliedCoupon: setCoupon } = useCart();
  const { formatPrice }      = useCurrency();
  const { customer, isLoggedIn } = useCustomer();

  const [usingSavedAddress, setUsingSavedAddress] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/public/coupons/active`)
      .then(res => res.json())
      .then(data => {
        if (data && data.code) {
          setActiveCoupon(data);
        }
      })
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    firstName:     '',
    lastName:      '',
    email:         '',
    phone:         '',
    address:       '',
    city:          '',
    zip:           '',
    paymentMethod: 'COD',
  });

  const [paymentDetails, setPaymentDetails] = useState({
    easypaisaMode:   'direct',
    easypaisaNumber: '',
    easypaisaTid:    '',
    cardholderName:  '',
    cardNumber:      '',
    cardExpiry:      '',
    cardCvv:         '',
  });

  const [errors, setErrors] = useState({});

  // ── Auto-fill from saved customer profile ─────────────────────
  useEffect(() => {
    if (!isLoggedIn || !customer) return;

    const nameParts = (customer.name ?? '').trim().split(' ');
    const firstName = nameParts[0] ?? '';
    const lastName  = nameParts.slice(1).join(' ') ?? '';

    setForm(f => ({
      ...f,
      firstName: firstName || f.firstName,
      lastName:  lastName  || f.lastName,
      email:     customer.email || f.email,
      phone:     customer.phone || f.phone || '',
    }));

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

  // ── Field updaters ─────────────────────────────────────────────
  const set = useCallback((field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(err => ({ ...err, [field]: '' }));
    if (['address', 'city', 'zip'].includes(field)) setUsingSavedAddress(false);
  }, []);

  const setPayDetail = useCallback((field) => (e) => {
    let val = e.target.value;

    // Custom formatting for Card Number
    if (field === 'cardNumber') {
      val = val.replace(/\D/g, '').substring(0, 16);
      val = val.match(/.{1,4}/g)?.join(' ') || val;
    }
    // Custom formatting for Expiry Date
    if (field === 'cardExpiry') {
      val = val.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 2) {
        val = `${val.substring(0, 2)}/${val.substring(2)}`;
      }
    }
    // Limit CVV to 4 digits
    if (field === 'cardCvv') {
      val = val.replace(/\D/g, '').substring(0, 4);
    }
    // Limit TID to 11 alphanumeric characters
    if (field === 'easypaisaTid') {
      val = val.replace(/[^A-Za-z0-9]/g, '').substring(0, 11).toUpperCase();
    }

    setPaymentDetails(pd => ({ ...pd, [field]: val }));
    setErrors(err => ({ ...err, [`pay_${field}`]: '' }));
  }, []);

  // ── Validate ──────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required';
    if (!form.email.trim())     e.email     = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^\d{10,15}$/.test(form.phone.replace(/\D/g, ''))) e.phone = 'Enter a valid phone number (10-15 digits)';

    if (!form.address.trim())   e.address   = 'Address is required';
    if (!form.city.trim())      e.city      = 'City is required';
    if (!form.paymentMethod)    e.paymentMethod = 'Select a payment method';

    // Payment method specific validations
    if (form.paymentMethod === 'Easypaisa' || form.paymentMethod === 'JazzCash') {
      if (paymentDetails.easypaisaMode === 'direct') {
        const cleanNo = paymentDetails.easypaisaNumber.replace(/\D/g, '');
        if (!paymentDetails.easypaisaNumber.trim()) {
          e.pay_easypaisaNumber = 'Mobile account number is required';
        } else if (cleanNo.length < 10 || cleanNo.length > 12) {
          e.pay_easypaisaNumber = 'Enter a valid mobile wallet number (e.g. 03001234567)';
        }
      } else {
        if (!paymentDetails.easypaisaTid.trim()) {
          e.pay_easypaisaTid = 'Transaction ID is required';
        } else if (paymentDetails.easypaisaTid.length !== 11) {
          e.pay_easypaisaTid = 'Transaction ID must be exactly 11 characters';
        }
      }
    } else if (form.paymentMethod === 'Bank Transfer') {
      if (!paymentDetails.easypaisaTid.trim()) {
        e.pay_easypaisaTid = 'Payment Reference / Transaction ID is required';
      } else if (paymentDetails.easypaisaTid.length !== 11) {
        e.pay_easypaisaTid = 'Reference ID must be exactly 11 characters';
      }
    } else if (form.paymentMethod === 'ATM Card') {
      if (!paymentDetails.cardholderName.trim()) {
        e.pay_cardholderName = 'Cardholder name is required';
      }
      
      const cleanCard = paymentDetails.cardNumber.replace(/\s/g, '');
      if (!cleanCard) {
        e.pay_cardNumber = 'Card number is required';
      } else if (!isValidLuhn(cleanCard)) {
        e.pay_cardNumber = 'Invalid debit/credit card number';
      }

      if (!paymentDetails.cardExpiry) {
        e.pay_cardExpiry = 'Expiry is required';
      } else if (!/^\d{2}\/\d{2}$/.test(paymentDetails.cardExpiry)) {
        e.pay_cardExpiry = 'Invalid format (MM/YY)';
      }

      if (!paymentDetails.cardCvv) {
        e.pay_cardCvv = 'CVV is required';
      } else if (paymentDetails.cardCvv.length < 3) {
        e.pay_cardCvv = 'CVV must be 3 or 4 digits';
      }
    }

    return e;
  };

  const { discount, finalTotal } = calculateDiscount(total, coupon);

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    onComplete({
      ...form,
      finalTotal,
      couponCode: coupon?.code       ?? '',
      paymentDetails: form.paymentMethod === 'COD' ? undefined : paymentDetails,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

        {/* ── Form Fields ── */}
        <div className="lg:col-span-3 space-y-10">

          {/* Stock warnings */}
          {stockWarnings.length > 0 && (
            <div className="p-4 bg-[#FAF9F5] border-l-2 border-cardinal">
              {stockWarnings.map((w, i) => (
                <p key={i} className="text-[10px] font-black uppercase tracking-wider text-cardinal flex items-start space-x-2.5">
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" /><span>{w}</span>
                </p>
              ))}
            </div>
          )}

          {/* Logged-in banner */}
          {isLoggedIn && (
            <div className="flex items-center space-x-3.5 p-4 bg-[#FBFBFA] border border-gray-200/60">
              <UserCheck size={14} className="text-gray-900 flex-shrink-0" />
              <div className="flex-grow">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-900">
                  Customer Profile: {customer?.name}
                </p>
                <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
                  {usingSavedAddress ? 'Delivery details loaded' : 'Profile information loaded'}
                </p>
              </div>
              <Link to="/account" className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-900 hover:underline whitespace-nowrap">
                Edit Account
              </Link>
            </div>
          )}

          {/* Not logged in nudge */}
          {!isLoggedIn && (
            <div className="flex items-center space-x-3.5 p-4 bg-[#FBFBFA] border border-gray-200/60">
              <User size={13} className="text-gray-800 flex-shrink-0" />
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                Have an account? <Link to="/account/login" className="text-gray-900 font-black hover:underline underline-offset-4 decoration-1">Sign In</Link> to load saved shipping details.
              </p>
            </div>
          )}

          {/* Contact */}
          <section>
            <div className="flex items-center space-x-2 mb-6">
              <User size={15} className="text-gray-900" />
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
              <Field label="Phone Number *" error={errors.phone}>
                <div className="relative">
                  <Phone size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="tel" value={form.phone} onChange={set('phone')} placeholder="03001234567" autoComplete="tel" className={`${inputCls(errors.phone)} pl-6`} />
                </div>
              </Field>
            </div>
          </section>

          {/* Delivery */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <MapPin size={15} className="text-gray-900" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900">Delivery Address</h2>
              </div>
              {usingSavedAddress && (
                <button type="button" onClick={clearSavedAddress} className="flex items-center space-x-1 text-[9px] font-black text-gray-400 hover:text-cardinal transition-colors uppercase tracking-widest">
                  <X size={10} /><span>Clear</span>
                </button>
              )}
            </div>

            {usingSavedAddress && (
              <div className="mb-6 p-4 bg-[#FBFBFA] border-l-2 border-gray-900">
                <p className="text-[9px] font-bold text-gray-800 uppercase tracking-[0.15em] leading-relaxed">
                  Using saved delivery address. <button type="button" onClick={clearSavedAddress} className="font-black underline underline-offset-4 hover:no-underline">Enter new address</button>
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
              <CreditCard size={15} className="text-gray-900" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900">Payment Method</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PAYMENT_METHODS.map(({ value, label, sub }) => (
                <label 
                  key={value} 
                  className={`flex flex-col justify-between p-5 border cursor-pointer transition-all duration-300 rounded-none relative ${
                    form.paymentMethod === value 
                      ? 'border-gray-900 bg-[#FBFBFA] shadow-[0_4px_16px_rgba(0,0,0,0.03)]' 
                      : 'border-gray-200/80 bg-white hover:border-gray-400'
                  }`}
                >
                  <input type="radio" name="paymentMethod" value={value} checked={form.paymentMethod === value} onChange={set('paymentMethod')} className="sr-only" />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">{label}</p>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                        form.paymentMethod === value ? 'border-gray-900' : 'border-gray-300'
                      }`}>
                        {form.paymentMethod === value && <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />}
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">{sub}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.paymentMethod && <p className="text-[9px] font-bold text-cardinal mt-2.5 flex items-center space-x-1"><AlertTriangle size={9} /><span>{errors.paymentMethod}</span></p>}

            {/* Dynamic payment fields */}
            {form.paymentMethod !== 'COD' && (
              <div className="mt-8 p-6 bg-[#FBFBFA] border border-gray-200/60 animate-fade-in">
                
                {/* ── Mobile Wallet Integration (Easypaisa / JazzCash) ── */}
                {(form.paymentMethod === 'Easypaisa' || form.paymentMethod === 'JazzCash') && (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 block mb-3">Wallet Payment Mode</span>
                      <div className="flex space-x-4">
                        <button
                          type="button"
                          onClick={() => setPaymentDetails(pd => ({ ...pd, easypaisaMode: 'direct' }))}
                          className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest border transition-all ${
                            paymentDetails.easypaisaMode === 'direct' ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          Direct Wallet Push
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentDetails(pd => ({ ...pd, easypaisaMode: 'manual' }))}
                          className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest border transition-all ${
                            paymentDetails.easypaisaMode === 'manual' ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          Manual OTC Transfer
                        </button>
                      </div>
                    </div>

                    {paymentDetails.easypaisaMode === 'direct' ? (
                      <div className="space-y-4">
                        <Field label={`${form.paymentMethod} Mobile Number *`} error={errors.pay_easypaisaNumber}>
                          <input
                            type="text"
                            value={paymentDetails.easypaisaNumber}
                            onChange={setPayDetail('easypaisaNumber')}
                            placeholder="03001234567"
                            className={inputCls(errors.pay_easypaisaNumber)}
                          />
                        </Field>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide leading-relaxed">
                          A payment authorization request will be sent to your phone. Please confirm the request and enter your MPIN to authorize.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 border border-gray-200/80 leading-relaxed uppercase tracking-wider text-[9px] font-bold text-gray-500 space-y-1">
                          <p className="font-black text-black">Payment Details:</p>
                          <p>Account Name: Stop & Shop E-Commerce</p>
                          <p>{form.paymentMethod} No: {form.paymentMethod === 'Easypaisa' ? '0300-1234567' : '0303-7654321'}</p>
                          <p className="text-cardinal font-black mt-2">Please transfer PKR {finalTotal.toLocaleString()} first, then paste the 11-digit Transaction ID below.</p>
                        </div>
                        <Field label="Transaction ID *" error={errors.pay_easypaisaTid}>
                          <input
                            type="text"
                            value={paymentDetails.easypaisaTid}
                            onChange={setPayDetail('easypaisaTid')}
                            placeholder="EP123456789"
                            className={inputCls(errors.pay_easypaisaTid)}
                          />
                        </Field>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Direct Bank Transfer ── */}
                {form.paymentMethod === 'Bank Transfer' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 border border-gray-200/80 leading-relaxed uppercase tracking-wider text-[9px] font-bold text-gray-500 space-y-1">
                      <p className="font-black text-black">Bank Transfer Details:</p>
                      <p>Bank: Meezan Bank Ltd (DHA Phase 6)</p>
                      <p>Account Title: Stop & Shop E-Commerce</p>
                      <p>Account Number: 0293-84729183749</p>
                      <p>IBAN: PK12MEZN000102938472918</p>
                      <p className="text-cardinal font-black mt-2">Please transfer PKR {finalTotal.toLocaleString()} and enter the 11-digit Transaction ID/Reference Code below.</p>
                    </div>
                    <Field label="Payment Reference / Transaction ID *" error={errors.pay_easypaisaTid}>
                      <input
                        type="text"
                        value={paymentDetails.easypaisaTid}
                        onChange={setPayDetail('easypaisaTid')}
                        placeholder="REF12345678"
                        className={inputCls(errors.pay_easypaisaTid)}
                      />
                    </Field>
                  </div>
                )}

                {/* ── Card Payment (Visa / Mastercard) ── */}
                {form.paymentMethod === 'ATM Card' && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-3 mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Secure ATM/Debit Card Details</span>
                      <span className="text-[9px] font-black text-cardinal tracking-wide uppercase">Visa & Mastercard</span>
                    </div>

                    <Field label="Cardholder Name *" error={errors.pay_cardholderName}>
                      <input
                        type="text"
                        value={paymentDetails.cardholderName}
                        onChange={setPayDetail('cardholderName')}
                        placeholder="Ahmed Khan"
                        className={inputCls(errors.pay_cardholderName)}
                      />
                    </Field>

                    <Field label="Card Number *" error={errors.pay_cardNumber}>
                      <input
                        type="text"
                        value={paymentDetails.cardNumber}
                        onChange={setPayDetail('cardNumber')}
                        placeholder="4000 1234 5678 9010"
                        className={inputCls(errors.pay_cardNumber)}
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-6">
                      <Field label="Expiration Date (MM/YY) *" error={errors.pay_cardExpiry}>
                        <input
                          type="text"
                          value={paymentDetails.cardExpiry}
                          onChange={setPayDetail('cardExpiry')}
                          placeholder="12/28"
                          className={inputCls(errors.pay_cardExpiry)}
                        />
                      </Field>
                      <Field label="Security Code (CVV) *" error={errors.pay_cardCvv}>
                        <input
                          type="password"
                          value={paymentDetails.cardCvv}
                          onChange={setPayDetail('cardCvv')}
                          placeholder="•••"
                          className={inputCls(errors.pay_cardCvv)}
                        />
                      </Field>
                    </div>
                  </div>
                )}

              </div>
            )}
          </section>

          {/* Coupon */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Tag size={15} className="text-cardinal" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900">Coupon Code</h2>
            </div>
            <CouponInput cartTotal={total} appliedCoupon={coupon} onApply={setCoupon} onRemove={() => setCoupon(null)} />
            {!coupon && activeCoupon && (
              <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-2">
                Try {activeCoupon.code.toUpperCase()} for {activeCoupon.type === 'percentage' ? `${activeCoupon.value}%` : `Rs. ${activeCoupon.value}`} off
              </p>
            )}
          </section>
        </div>

        {/* ── Order Summary ── */}
        <div className="lg:col-span-2 space-y-6">
          <OrderSummary cartItems={cartItems} total={total} coupon={coupon} formatPrice={formatPrice} />

          <div className="flex items-center space-x-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            <Lock size={11} className="text-cardinal" />
            <span>256-bit SSL encrypted · Safe &amp; Secure</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 rounded-none"
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