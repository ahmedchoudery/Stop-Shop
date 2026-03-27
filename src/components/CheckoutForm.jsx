import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { CreditCard, Truck, CheckCircle, ArrowRight, ArrowLeft, Tag, X, AlertTriangle, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useCurrency } from '../context/CurrencyContext';

const PROMO_CODES = {
  'CARDINAL20': { discount: 0.20, label: '20% OFF' },
  'CARDINAL10': { discount: 0.10, label: '10% OFF' },
  'FIRST15': { discount: 0.15, label: '15% OFF' },
};

const CheckoutForm = ({ onComplete, stockWarnings = [] }) => {
  const { total, cartItems } = useCart();
  const { t } = useLocale();
  const { formatPrice } = useCurrency();
  const [step, setStep] = useState(1);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '',
    city: 'Karachi', zip: '', paymentMethod: 'credit-card',
    cardNumber: '', expiry: '', cvv: '',
  });

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    return /^03[0-9]{9}$/.test(phone.replace(/\s/g, ''));
  };

  const validateCardNumber = (num) => {
    const cleaned = num.replace(/\s/g, '');
    return /^\d{16}$/.test(cleaned);
  };

  const validateExpiry = (exp) => {
    return /^(0[1-9]|1[0-2])\/\d{2}$/.test(exp);
  };

  const validateCVV = (cvv) => {
    return /^\d{3,4}$/.test(cvv);
  };

  const validateStep = (stepNum) => {
    const newErrors = {};

    if (stepNum === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = `${t('forms.firstName')} ${t('forms.required')}`;
      if (!formData.lastName.trim()) newErrors.lastName = `${t('forms.lastName')} ${t('forms.required')}`;
      if (!formData.email.trim()) {
        newErrors.email = `${t('forms.email')} ${t('forms.required')}`;
      } else if (!validateEmail(formData.email)) {
        newErrors.email = `${t('forms.email')} ${t('forms.invalid')}`;
      }
      if (!formData.phone.trim()) {
        newErrors.phone = `${t('forms.phone')} ${t('forms.required')}`;
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = `${t('forms.phone')} ${t('forms.invalid')}`;
      }
      if (!formData.address.trim()) newErrors.address = `${t('forms.address')} ${t('forms.required')}`;
      if (!formData.city.trim()) newErrors.city = `${t('forms.city')} ${t('forms.required')}`;
    }

    if (stepNum === 2) {
      if (formData.paymentMethod === 'credit-card') {
        if (!formData.cardNumber.trim()) {
          newErrors.cardNumber = 'Card number is required';
        } else if (!validateCardNumber(formData.cardNumber)) {
          newErrors.cardNumber = 'Enter 16-digit card number';
        }
        if (!formData.expiry.trim()) {
          newErrors.expiry = 'Expiry is required';
        } else if (!validateExpiry(formData.expiry)) {
          newErrors.expiry = 'Use MM/YY format';
        }
        if (!formData.cvv.trim()) {
          newErrors.cvv = 'CVV is required';
        } else if (!validateCVV(formData.cvv)) {
          newErrors.cvv = 'Enter 3-4 digit CVV';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 3));
    }
  };
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setAppliedPromo({ code, ...PROMO_CODES[code] });
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try CARDINAL20');
      setAppliedPromo(null);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError('');
  };

  const discount = appliedPromo ? total * appliedPromo.discount : 0;
  const finalTotal = total - discount;

  const inputClass = (hasError) => `w-full border-b-2 ${hasError ? 'border-red-400' : 'border-gray-100'} focus:border-[#ba1f3d] outline-none py-2.5 font-bold text-gray-900 transition-colors bg-transparent placeholder:text-gray-300`;
  const errorClass = "text-[9px] font-bold text-red-500 mt-1";
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-gray-400";

  const ProgressIndicator = () => (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        {[{ n: 1, label: t('checkout.step1') }, { n: 2, label: t('checkout.step2') }, { n: 3, label: t('checkout.step3') }].map(({ n, label }) => (
          <div key={n} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= n ? 'bg-[#ba1f3d] text-white shadow-lg shadow-[#ba1f3d]/10' : 'bg-gray-100 text-gray-400'
              }`}>
              {step > n ? <CheckCircle size={16} /> : n}
            </div>
            <span className={`hidden sm:block ml-2 text-[10px] font-black uppercase tracking-widest ${step >= n ? 'text-gray-900' : 'text-gray-300'
              }`}>{label}</span>
            {n < 3 && <div className={`w-8 sm:w-16 md:w-24 h-0.5 ml-2 mr-2 transition-all ${step > n ? 'bg-[#ba1f3d]' : 'bg-gray-100'}`} />}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-10 bg-white shadow-2xl border border-gray-100 min-h-[600px] flex flex-col rounded-2xl">
      <ProgressIndicator />

      <div className="flex-grow">
        {/* Step 1: Shipping */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-red-50 rounded-xl">
                <Truck className="text-[#ba1f3d]" size={22} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">{t('checkout.info')}</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className={labelClass}>{t('forms.firstName')} *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className={inputClass(!!errors.firstName)} placeholder="John" />
                {errors.firstName && <p className={errorClass}>{errors.firstName}</p>}
              </div>
              <div className="space-y-1">
                <label className={labelClass}>{t('forms.lastName')} *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className={inputClass(!!errors.lastName)} placeholder="Doe" />
                {errors.lastName && <p className={errorClass}>{errors.lastName}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>{t('forms.email')} *</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass(!!errors.email)} placeholder="john@example.com" />
              {errors.email && <p className={errorClass}>{errors.email}</p>}
            </div>
            <div className="space-y-1">
              <label className={labelClass}>{t('forms.phone')} *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={inputClass(!!errors.phone)} placeholder="03001234567" />
              {errors.phone && <p className={errorClass}>{errors.phone}</p>}
            </div>
            <div className="space-y-1">
              <label className={labelClass}>{t('forms.address')} *</label>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} className={inputClass(!!errors.address)} placeholder="123 Fashion Ave" />
              {errors.address && <p className={errorClass}>{errors.address}</p>}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className={labelClass}>{t('forms.city')} *</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} className={inputClass(!!errors.city)} placeholder="Karachi" />
                {errors.city && <p className={errorClass}>{errors.city}</p>}
              </div>
              <div className="space-y-1">
                <label className={labelClass}>{t('forms.zip')}</label>
                <input type="text" name="zip" value={formData.zip} onChange={handleInputChange} className={inputClass(false)} placeholder="75500" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-up">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-red-50 rounded-xl">
                <CreditCard className="text-[#ba1f3d]" size={22} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">{t('checkout.payment')}</h2>
            </div>

            <div className="space-y-3">
              {[
                { value: 'credit-card', label: 'Credit / Debit Card' },
                { value: 'bank-transfer', label: 'Bank Transfer' },
                { value: 'cod', label: 'Cash on Delivery' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 border-gray-100 has-[:checked]:border-[#ba1f3d] has-[:checked]:bg-[#ba1f3d]/5">
                  <input
                    type="radio" name="paymentMethod" value={opt.value}
                    checked={formData.paymentMethod === opt.value}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#ba1f3d]"
                  />
                  <span className="ml-4 font-black uppercase text-xs tracking-widest">{opt.label}</span>
                </label>
              ))}
            </div>

            {formData.paymentMethod === 'credit-card' && (
              <div className="p-6 bg-gray-50 rounded-2xl space-y-4 border border-gray-100">
                <div className="space-y-1">
                  <label className={labelClass}>Card Number *</label>
                  <input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} maxLength={16} className={`w-full bg-white border rounded-xl px-4 py-3 font-mono text-sm focus:border-[#ba1f3d] outline-none ${errors.cardNumber ? 'border-red-400' : 'border-gray-200'}`} placeholder="•••• •••• •••• ••••" />
                  {errors.cardNumber && <p className={errorClass}>{errors.cardNumber}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}>Expiry *</label>
                    <input type="text" name="expiry" value={formData.expiry} onChange={handleInputChange} maxLength={5} className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:border-[#ba1f3d] outline-none ${errors.expiry ? 'border-red-400' : 'border-gray-200'}`} placeholder="MM/YY" />
                    {errors.expiry && <p className={errorClass}>{errors.expiry}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>CVV *</label>
                    <input type="text" name="cvv" value={formData.cvv} onChange={handleInputChange} maxLength={4} className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:border-[#ba1f3d] outline-none ${errors.cvv ? 'border-red-400' : 'border-gray-200'}`} placeholder="•••" />
                    {errors.cvv && <p className={errorClass}>{errors.cvv}</p>}
                  </div>
                </div>
              </div>
            )}

            {formData.paymentMethod === 'bank-transfer' && (
              <div className="p-6 bg-green-50 rounded-2xl border-2 border-dashed border-green-200 space-y-3">
                <p className="font-black uppercase text-xs tracking-widest text-green-800">Bank Transfer Details</p>
                <p className="text-sm text-green-700">Account Title: Stop Shop</p>
                <p className="text-sm text-green-700">Account Number: 0123-4567890123</p>
                <p className="text-sm text-green-700">Bank: HBL / MCB / UBL</p>
                <p className="text-[10px] text-green-600 mt-2">Please include your phone number in the transfer reference.</p>
              </div>
            )}

            {formData.paymentMethod === 'cod' && (
              <div className="p-6 bg-yellow-50 rounded-2xl border-2 border-dashed border-yellow-200 space-y-3">
                <div className="flex items-center space-x-3">
                  <Truck className="text-yellow-600" size={24} />
                  <p className="font-black uppercase text-xs tracking-widest text-yellow-900">Pay At Your Door</p>
                </div>
                <p className="text-sm text-yellow-700">Keep exact change ready for our delivery partner.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-50 rounded-xl">
                  <CheckCircle className="text-[#ba1f3d]" size={22} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">{t('checkout.review')}</h2>
              </div>
              <Link to="/" onClick={() => {}} className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-[#ba1f3d] hover:text-gray-900 transition-colors">
                <ShoppingBag size={14} />
                <span>{t('checkout.edit')}</span>
              </Link>
            </div>

            {/* Stock Warnings */}
            {stockWarnings.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle size={16} />
                  <span className="font-black uppercase text-xs tracking-widest">Low Stock Warning</span>
                </div>
                {stockWarnings.map((warning, idx) => (
                  <p key={idx} className="text-[10px] text-red-600 font-bold">
                    {warning}
                  </p>
                ))}
              </div>
            )}

            {/* Items */}
            <div className="space-y-3 max-h-[180px] overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.cartId} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg shadow-sm" />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-tight">{item.name}</p>
                      <p className="text-[10px] text-gray-400">Qty: {item.quantity || 1}{item.selectedSize ? ` · Size: ${item.selectedSize}` : ''}</p>
                    </div>
                  </div>
                  <p className="font-black text-sm text-[#ba1f3d]">{formatPrice(item.price * (item.quantity || 1))}</p>
                </div>
              ))}
            </div>

            {/* Promo Code */}
            <div className="space-y-3">
              <label className={labelClass + " flex items-center space-x-2"}>
                <Tag size={12} />
                <span>Promo Code</span>
              </label>

              {appliedPromo ? (
                <div className="flex items-center justify-between bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-black uppercase text-xs tracking-widest text-green-800">{appliedPromo.code}</p>
                      <p className="text-[10px] font-bold text-green-600">{appliedPromo.label} applied!</p>
                    </div>
                  </div>
                  <button onClick={removePromo} className="text-gray-400 hover:text-gray-900 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                    onKeyDown={e => e.key === 'Enter' && applyPromo()}
                    placeholder="Enter code (e.g. CARDINAL20)"
                    className={`flex-grow border-2 ${promoError ? 'border-[#ba1f3d]/50' : 'border-gray-200'} focus:border-[#ba1f3d] rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest outline-none transition-colors`}
                  />
                  <button
                    onClick={applyPromo}
                    className="px-5 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#ba1f3d] transition-all"
                  >
                    Apply
                  </button>
                </div>
              )}
              {promoError && <p className="text-[10px] font-bold text-red-500">{promoError}</p>}
            </div>

            {/* Order Summary */}
            <div className="bg-gray-900 text-white rounded-2xl p-6 space-y-3 shadow-xl">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('checkout.subtotal')}</span>
                <span className="font-black">{formatPrice(total)}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-400 font-bold uppercase tracking-widest text-xs">{t('checkout.discount')} ({appliedPromo.label})</span>
                  <span className="font-black text-green-400">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('checkout.step1')}</span>
                <span className="font-black text-green-400">Free</span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                <span className="font-black uppercase tracking-tighter text-lg">{t('checkout.total')}</span>
                <span className="text-3xl font-black text-[#ba1f3d]">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest space-y-1">
              <p>📍 {formData.address}, {formData.city} {formData.zip}</p>
              <p>📞 {formData.phone}</p>
              <p>💳 {formData.paymentMethod === 'credit-card' ? 'Card ending ···· ' + (formData.cardNumber.slice(-4) || '????') : formData.paymentMethod === 'bank-transfer' ? 'Bank Transfer' : 'Cash on Delivery'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-12 flex justify-between space-x-4">
        {step > 1 && (
          <button
            onClick={prevStep}
            className="flex-1 py-4 border-2 border-gray-200 text-gray-700 font-black uppercase text-[11px] tracking-[0.2em] rounded-xl hover:border-gray-900 hover:bg-gray-50 flex items-center justify-center space-x-2 transition-all"
          >
            <ArrowLeft size={16} />
            <span>{t('checkout.back')}</span>
          </button>
        )}

        {step < 3 ? (
            <button
            onClick={nextStep}
            style={{ backgroundColor: '#ba1f3d' }}
            className="flex-[2] py-4 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-xl shadow-xl hover:brightness-110 active:scale-95 flex items-center justify-center space-x-2 transition-all"
          >
            <span>{t('checkout.next')}</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => onComplete && onComplete({ ...formData, finalTotal, appliedPromo })}
            style={{ backgroundColor: '#F63049' }}
            className="flex-[2] py-4 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-xl shadow-2xl hover:brightness-110 active:scale-95 flex items-center justify-center space-x-2 transition-all"
          >
            <span>{t('checkout.confirm')} 🎉</span>
            <CheckCircle size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CheckoutForm;