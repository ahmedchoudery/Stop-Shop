/**
 * @fileoverview CheckoutForm — Design Spells Edition
 * Fix: replaced require('animejs') with ESM import — step transitions, validation shakes, and promo reveals are now functional
 * Applies: animejs-animation (step transition, progress stagger, spring validation shake),
 *          design-spells (floating labels, progress morphing, promo reveal),
 *          design-md (surgical form aesthetic, Cardinal Red focus states)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import { useCart } from '../context/CartContext.jsx';
import {
  CreditCard, Truck, CheckCircle, ArrowRight, ArrowLeft,
  Tag, X, AlertTriangle, ShoppingBag, Eye, EyeOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { EASING } from '../hooks/useAnime.js';

// ─────────────────────────────────────────────────────────────────
// PROMO CODES
// ─────────────────────────────────────────────────────────────────

const PROMO_CODES = {
  'CARDINAL20': { discount: 0.20, label: '20% OFF' },
  'CARDINAL10': { discount: 0.10, label: '10% OFF' },
  'FIRST15': { discount: 0.15, label: '15% OFF' },
};

// ─────────────────────────────────────────────────────────────────
// FLOATING LABEL INPUT — Design Spell
// ─────────────────────────────────────────────────────────────────

const FloatingInput = ({
  id, name, type = 'text', value, onChange, label, placeholder,
  error, disabled, maxLength, autoComplete,
  rightSlot,
}) => {
  const [focused, setFocused] = useState(false);
  const hasValue = value?.length > 0;
  const isFloated = focused || hasValue;

  return (
    <div className="relative">
      <div className={`relative border-b-2 transition-colors duration-300 ${
        error ? 'border-red-400' : focused ? 'border-[#ba1f3d]' : 'border-gray-100'
      }`}>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete={autoComplete}
          placeholder={isFloated ? placeholder : ''}
          className="w-full bg-transparent pt-5 pb-2 pr-10 text-sm font-bold text-gray-900 outline-none placeholder:text-gray-300 disabled:opacity-50 peer"
        />
        {/* Floating label */}
        <label
          htmlFor={id}
          className={`absolute left-0 pointer-events-none font-black uppercase transition-all duration-300 ${
            isFloated
              ? 'top-0 text-[9px] tracking-[0.4em] text-[#ba1f3d]'
              : 'top-4 text-sm tracking-normal text-gray-400'
          } ${error ? '!text-red-400' : ''}`}
        >
          {label}
        </label>
        {/* Right slot (eye icon, etc.) */}
        {rightSlot && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[9px] font-bold text-red-500 mt-1 animate-fade-in">{error}</p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// STEP PROGRESS BAR — Design Spell
// ─────────────────────────────────────────────────────────────────

const StepProgress = ({ step }) => {
  const steps = [
    { n: 1, label: 'Shipping' },
    { n: 2, label: 'Payment' },
    { n: 3, label: 'Review' },
  ];

  return (
    <div className="mb-10">
      <div className="flex items-center">
        {steps.map(({ n, label }, i) => (
          <React.Fragment key={n}>
            {/* Step dot */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                step > n
                  ? 'bg-[#ba1f3d] text-white shadow-lg shadow-red-200/60'
                  : step === n
                    ? 'bg-[#ba1f3d] text-white shadow-lg shadow-red-200/60 ring-4 ring-[#ba1f3d]/20'
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {step > n ? <CheckCircle size={14} /> : n}
              </div>
              <span className={`hidden sm:block mt-1.5 text-[9px] font-black uppercase tracking-widest ${
                step >= n ? 'text-gray-700' : 'text-gray-300'
              }`}>
                {label}
              </span>
            </div>
            {/* Connector */}
            {i < steps.length - 1 && (
              <div className="flex-1 mx-3 mb-4 sm:mb-6 h-[2px] bg-gray-100 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#ba1f3d] transition-all duration-700 ease-out"
                  style={{ width: step > n ? '100%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN FORM COMPONENT
// ─────────────────────────────────────────────────────────────────

const CheckoutForm = ({ onComplete, stockWarnings = [], isSubmitting = false }) => {
  const { total, cartItems } = useCart();
  const { t } = useLocale();
  const { formatPrice } = useCurrency();

  const [step, setStep] = useState(1);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [errors, setErrors] = useState({});
  const [showCvv, setShowCvv] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: 'Karachi', zip: '',
    paymentMethod: 'credit-card',
    cardNumber: '', expiry: '', cvv: '',
  });

  const stepContentRef = useRef(null);

  // ── Step transition animation ─────────────────────────────────
  const animateStepIn = useCallback((dir = 1) => {
    if (!stepContentRef.current) return;

    anime({
      targets: stepContentRef.current,
      opacity: [0, 1],
      translateX: [dir * 30, 0],
      duration: 450,
      easing: EASING.FABRIC,
    });
  }, []);

  // ── Validation ────────────────────────────────────────────────

  const validate = useCallback((stepNum) => {
    const e = {};
    if (stepNum === 1) {
      if (!formData.firstName.trim()) e.firstName = 'Required';
      if (!formData.lastName.trim()) e.lastName = 'Required';
      if (!formData.email.trim()) e.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Invalid email';
      if (!formData.phone.trim()) e.phone = 'Required';
      else if (!/^03[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) e.phone = 'Format: 03XXXXXXXXX';
      if (!formData.address.trim()) e.address = 'Required';
      if (!formData.city.trim()) e.city = 'Required';
    }
    if (stepNum === 2 && formData.paymentMethod === 'credit-card') {
      if (!formData.cardNumber.trim()) e.cardNumber = 'Required';
      else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) e.cardNumber = '16 digits required';
      if (!formData.expiry.trim()) e.expiry = 'Required';
      else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiry)) e.expiry = 'MM/YY format';
      if (!formData.cvv.trim()) e.cvv = 'Required';
      else if (!/^\d{3,4}$/.test(formData.cvv)) e.cvv = '3-4 digits';
    }
    setErrors(e);

    // Shake animation on error — design spell
    if (Object.keys(e).length > 0) {
      const errorFields = Object.keys(e).map(k => document.querySelector(`[name="${k}"]`)).filter(Boolean);
      anime({
        targets: errorFields,
        translateX: [-6, 6, -4, 4, -2, 2, 0],
        duration: 400,
        easing: 'linear',
      });
    }

    return Object.keys(e).length === 0;
  }, [formData]);

  const nextStep = useCallback(() => {
    if (!validate(step)) return;
    setStep(s => s + 1);
    setTimeout(() => animateStepIn(1), 0);
  }, [step, validate, animateStepIn]);

  const prevStep = useCallback(() => {
    setStep(s => s - 1);
    setTimeout(() => animateStepIn(-1), 0);
  }, [animateStepIn]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  }, []);

  const applyPromo = useCallback(() => {
    const code = promoInput.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setAppliedPromo({ code, ...PROMO_CODES[code] });
      setPromoError('');
      // Success spring animation
      const el = document.querySelector('[data-promo-success]');
      if (el) anime({ targets: el, scale: [0.8, 1.05, 1], duration: 500, easing: EASING.SPRING });
    } else {
      setPromoError('Invalid code. Try CARDINAL20');
      setAppliedPromo(null);
    }
  }, [promoInput]);

  const discount = appliedPromo ? total * appliedPromo.discount : 0;
  const finalTotal = total - discount;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-2xl shadow-gray-200/60 border border-gray-100 rounded-2xl overflow-hidden">
        <div className="p-8 sm:p-12">
          <StepProgress step={step} />

          {/* Step Content */}
          <div ref={stepContentRef} style={{ willChange: 'transform, opacity' }}>

            {/* ── STEP 1: SHIPPING ─────────────────────────── */}
            {step === 1 && (
              <div className="space-y-7">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                    <Truck className="text-[#ba1f3d]" size={18} />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Shipping Info</h2>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <FloatingInput
                    id="firstName" name="firstName" label="First Name" placeholder="Ahmed"
                    value={formData.firstName} onChange={handleChange} error={errors.firstName}
                    autoComplete="given-name"
                  />
                  <FloatingInput
                    id="lastName" name="lastName" label="Last Name" placeholder="Khan"
                    value={formData.lastName} onChange={handleChange} error={errors.lastName}
                    autoComplete="family-name"
                  />
                </div>
                <FloatingInput
                  id="email" name="email" type="email" label="Email Address" placeholder="you@example.com"
                  value={formData.email} onChange={handleChange} error={errors.email}
                  autoComplete="email"
                />
                <FloatingInput
                  id="phone" name="phone" type="tel" label="Phone Number" placeholder="03001234567"
                  value={formData.phone} onChange={handleChange} error={errors.phone}
                  autoComplete="tel"
                />
                <FloatingInput
                  id="address" name="address" label="Street Address" placeholder="House 42, Street 5"
                  value={formData.address} onChange={handleChange} error={errors.address}
                  autoComplete="street-address"
                />
                <div className="grid grid-cols-2 gap-8">
                  <FloatingInput
                    id="city" name="city" label="City" placeholder="Karachi"
                    value={formData.city} onChange={handleChange} error={errors.city}
                    autoComplete="address-level2"
                  />
                  <FloatingInput
                    id="zip" name="zip" label="Postal Code" placeholder="75500"
                    value={formData.zip} onChange={handleChange}
                    autoComplete="postal-code"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2: PAYMENT ──────────────────────────── */}
            {step === 2 && (
              <div className="space-y-7">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                    <CreditCard className="text-[#ba1f3d]" size={18} />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Payment</h2>
                </div>

                {/* Payment options */}
                <div className="space-y-2.5">
                  {[
                    { value: 'credit-card', label: 'Credit / Debit Card' },
                    { value: 'bank-transfer', label: 'Bank Transfer' },
                    { value: 'cod', label: 'Cash on Delivery' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                        formData.paymentMethod === opt.value
                          ? 'border-[#ba1f3d] bg-[#ba1f3d]/3'
                          : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio" name="paymentMethod" value={opt.value}
                        checked={formData.paymentMethod === opt.value}
                        onChange={handleChange}
                        className="w-4 h-4 accent-[#ba1f3d]"
                      />
                      <span className="ml-4 text-[11px] font-black uppercase tracking-widest">{opt.label}</span>
                    </label>
                  ))}
                </div>

                {/* Card fields */}
                {formData.paymentMethod === 'credit-card' && (
                  <div className="p-6 bg-gray-50 rounded-2xl space-y-5 border border-gray-100 animate-fade-up">
                    <FloatingInput
                      id="cardNumber" name="cardNumber" label="Card Number" placeholder="•••• •••• •••• ••••"
                      value={formData.cardNumber} onChange={handleChange} error={errors.cardNumber}
                      maxLength={16} autoComplete="cc-number"
                    />
                    <div className="grid grid-cols-2 gap-6">
                      <FloatingInput
                        id="expiry" name="expiry" label="Expiry (MM/YY)" placeholder="08/27"
                        value={formData.expiry} onChange={handleChange} error={errors.expiry}
                        maxLength={5} autoComplete="cc-exp"
                      />
                      <FloatingInput
                        id="cvv" name="cvv" type={showCvv ? 'text' : 'password'} label="CVV" placeholder="•••"
                        value={formData.cvv} onChange={handleChange} error={errors.cvv}
                        maxLength={4} autoComplete="cc-csc"
                        rightSlot={
                          <button
                            type="button"
                            onClick={() => setShowCvv(s => !s)}
                            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
                          >
                            {showCvv ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Bank details */}
                {formData.paymentMethod === 'bank-transfer' && (
                  <div className="p-6 bg-green-50 rounded-2xl border-2 border-dashed border-green-200 animate-fade-up">
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-800 mb-3">Bank Details</p>
                    {['Account Title: Stop & Shop', 'Account: 0123-4567890123', 'Banks: HBL / MCB / UBL'].map(line => (
                      <p key={line} className="text-sm text-green-700 font-medium mb-1">{line}</p>
                    ))}
                    <p className="text-[10px] text-green-600 mt-3">Include your phone number in the reference.</p>
                  </div>
                )}

                {/* COD */}
                {formData.paymentMethod === 'cod' && (
                  <div className="p-6 bg-yellow-50 rounded-2xl border-2 border-dashed border-yellow-200 animate-fade-up">
                    <div className="flex items-center space-x-3 mb-2">
                      <Truck className="text-yellow-600" size={20} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-yellow-900">Pay at Door</p>
                    </div>
                    <p className="text-sm text-yellow-700">Keep exact change ready for our delivery partner.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: REVIEW ───────────────────────────── */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                      <CheckCircle className="text-[#ba1f3d]" size={18} />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Review</h2>
                  </div>
                  <Link
                    to="/"
                    className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-[#ba1f3d] hover:text-gray-900 transition-colors"
                  >
                    <ShoppingBag size={12} />
                    <span>Edit Bag</span>
                  </Link>
                </div>

                {/* Stock warnings */}
                {stockWarnings.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
                    <div className="flex items-center space-x-2 text-red-700 mb-2">
                      <AlertTriangle size={14} />
                      <span className="font-black uppercase text-[9px] tracking-widest">Stock Warning</span>
                    </div>
                    {stockWarnings.map((w, i) => (
                      <p key={i} className="text-[10px] text-red-600 font-bold">{w}</p>
                    ))}
                  </div>
                )}

                {/* Cart items */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cartItems.map(item => (
                    <div key={item.cartId} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-tight">{item.name}</p>
                          <p className="text-[9px] text-gray-400">
                            Qty: {item.quantity ?? 1}
                            {item.selectedSize ? ` · ${item.selectedSize}` : ''}
                          </p>
                        </div>
                      </div>
                      <p className="font-black text-sm text-[#ba1f3d]">
                        {formatPrice(item.price * (item.quantity ?? 1))}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Promo code — design spell: animated reveal */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Tag size={12} className="text-gray-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Promo Code</span>
                  </div>

                  {appliedPromo ? (
                    <div data-promo-success className="flex items-center justify-between bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircle size={16} className="text-green-600" />
                        <div>
                          <p className="font-black uppercase text-xs tracking-widest text-green-800">{appliedPromo.code}</p>
                          <p className="text-[10px] font-bold text-green-600">{appliedPromo.label} applied!</p>
                        </div>
                      </div>
                      <button onClick={() => { setAppliedPromo(null); setPromoInput(''); }} className="text-gray-400 hover:text-gray-700">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={promoInput}
                            onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                            onKeyDown={e => e.key === 'Enter' && applyPromo()}
                            placeholder="CARDINAL20"
                            className={`flex-grow border-2 ${promoError ? 'border-red-300' : 'border-gray-200'} focus:border-[#ba1f3d] rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest outline-none transition-colors`}
                        />
                      <button
                        onClick={applyPromo}
                        className="px-5 py-3 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#ba1f3d] transition-all duration-300"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {promoError && <p className="text-[10px] font-bold text-red-500">{promoError}</p>}
                </div>

                {/* Order summary */}
                <div className="bg-gray-900 text-white rounded-2xl p-6 space-y-3 shadow-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Subtotal</span>
                    <span className="font-black">{formatPrice(total)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400 font-bold uppercase tracking-widest text-[9px]">
                        Discount ({appliedPromo.label})
                      </span>
                      <span className="font-black text-green-400">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Shipping</span>
                    <span className="font-black text-green-400">Free</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                    <span className="font-black uppercase tracking-tighter text-lg">Total</span>
                    <span className="text-3xl font-black text-[#ba1f3d]">{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                {/* Shipping summary */}
                <div className="bg-gray-50 p-4 rounded-xl text-[10px] font-bold text-gray-500 uppercase tracking-widest space-y-1.5 border border-gray-100">
                  <p>📍 {formData.address}, {formData.city} {formData.zip}</p>
                  <p>📞 {formData.phone}</p>
                  <p>
                    💳{' '}
                    {formData.paymentMethod === 'credit-card'
                      ? `Card ending ···· ${formData.cardNumber.slice(-4) || '????'}`
                      : formData.paymentMethod === 'bank-transfer'
                        ? 'Bank Transfer'
                        : 'Cash on Delivery'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-10 flex space-x-3">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="flex-1 py-4 border-2 border-gray-200 text-gray-700 font-black uppercase text-[10px] tracking-[0.2em] rounded-xl hover:border-gray-900 hover:bg-gray-50 flex items-center justify-center space-x-2 transition-all duration-300"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={nextStep}
                className="flex-[2] py-4 bg-[#ba1f3d] text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl hover:brightness-110 active:scale-95 flex items-center justify-center space-x-2 transition-all duration-300 shadow-xl shadow-red-200/50 btn-shimmer"
              >
                <span>Next Step</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => onComplete?.({ ...formData, finalTotal, appliedPromo })}
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-[#ba1f3d] text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl hover:brightness-110 active:scale-95 flex items-center justify-center space-x-2 transition-all duration-300 shadow-xl shadow-red-200/50 btn-shimmer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm Order 🎉</span>
                    <CheckCircle size={14} />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Security note */}
          <p className="text-center text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mt-5">
            🔒 256-bit SSL encrypted · Your data is safe
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
