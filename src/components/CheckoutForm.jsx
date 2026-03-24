import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { CreditCard, Truck, CheckCircle, ArrowRight, ArrowLeft, Tag, X } from 'lucide-react';

const PROMO_CODES = {
  'CARDINAL20': { discount: 0.20, label: '20% OFF' },
  'CARDINAL10': { discount: 0.10, label: '10% OFF' },
  'FIRST15': { discount: 0.15, label: '15% OFF' },
};

const CheckoutForm = ({ onComplete }) => {
  const { total, cartItems } = useCart();
  const [step, setStep] = useState(1);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', address: '',
    city: 'Karachi', zip: '75500', paymentMethod: 'credit-card',
    cardNumber: '', expiry: '', cvv: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
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

  const inputClass = "w-full border-b-2 border-gray-100 focus:border-[#ba1f3d] outline-none py-2.5 font-bold text-gray-900 transition-colors bg-transparent placeholder:text-gray-300";
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-gray-400";

  const ProgressIndicator = () => (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        {[{ n: 1, label: 'Shipping' }, { n: 2, label: 'Payment' }, { n: 3, label: 'Review' }].map(({ n, label }) => (
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
              <h2 className="text-2xl font-black uppercase tracking-tighter">Shipping Info</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className={labelClass}>First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className={inputClass} placeholder="John" />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className={inputClass} placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} placeholder="john@example.com" />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Street Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} className={inputClass} placeholder="123 Fashion Ave" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className={labelClass}>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} className={inputClass} placeholder="Ahmedabad" />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>ZIP / PIN Code</label>
                <input type="text" name="zip" value={formData.zip} onChange={handleInputChange} className={inputClass} placeholder="380054" />
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
              <h2 className="text-2xl font-black uppercase tracking-tighter">Payment</h2>
            </div>

            <div className="space-y-3">
              {[
                { value: 'credit-card', label: 'Credit / Debit Card' },
                { value: 'upi', label: 'UPI / QR Code' },
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
                  <label className={labelClass}>Card Number</label>
                  <input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm focus:border-[#ba1f3d] outline-none" placeholder="•••• •••• •••• ••••" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}>Expiry</label>
                    <input type="text" name="expiry" value={formData.expiry} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#ba1f3d] outline-none" placeholder="MM/YY" />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>CVV</label>
                    <input type="text" name="cvv" value={formData.cvv} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#ba1f3d] outline-none" placeholder="•••" />
                  </div>
                </div>
              </div>
            )}

            {formData.paymentMethod === 'upi' && (
              <div className="p-8 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200 text-center space-y-3">
                <p className="text-4xl">📱</p>
                <p className="font-black uppercase text-xs tracking-widest text-purple-900">UPI ID: stopshop@upi</p>
                <p className="text-sm text-purple-700">Scan QR or pay to the above UPI ID at delivery confirmation.</p>
              </div>
            )}

            {formData.paymentMethod === 'cod' && (
              <div className="p-8 bg-yellow-50 rounded-2xl border-2 border-dashed border-yellow-200 text-center space-y-3">
                <Truck className="mx-auto text-yellow-600" size={32} />
                <p className="font-black uppercase text-xs tracking-widest text-yellow-900">Pay At Your Door</p>
                <p className="text-sm text-yellow-700">Keep exact change ready for our delivery partner.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-up">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-red-50 rounded-xl">
                <CheckCircle className="text-[#ba1f3d]" size={22} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Order Review</h2>
            </div>

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
                  <p className="font-black text-sm text-[#ba1f3d]">PKR {(item.price * (item.quantity || 1)).toLocaleString()}</p>
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
                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Subtotal</span>
                <span className="font-black">PKR {total.toLocaleString()}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-400 font-bold uppercase tracking-widest text-xs">Discount ({appliedPromo.label})</span>
                  <span className="font-black text-green-400">-PKR {discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Shipping</span>
                <span className="font-black text-green-400">Free</span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                <span className="font-black uppercase tracking-tighter text-lg">Total</span>
                <span className="text-3xl font-black text-[#ba1f3d]">PKR {finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest space-y-1">
              <p>📍 {formData.address}, {formData.city} {formData.zip}</p>
              <p>💳 {formData.paymentMethod === 'credit-card' ? 'Card ending ···· ' + (formData.cardNumber.slice(-4) || '????') : formData.paymentMethod === 'upi' ? 'UPI Payment' : 'Cash on Delivery'}</p>
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
            <span>Back</span>
          </button>
        )}

        {step < 3 ? (
            <button
            onClick={nextStep}
            style={{ backgroundColor: '#ba1f3d' }}
            className="flex-[2] py-4 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-xl shadow-xl hover:brightness-110 active:scale-95 flex items-center justify-center space-x-2 transition-all"
          >
            <span>Next Step</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => onComplete && onComplete({ ...formData, finalTotal, appliedPromo })}
            style={{ backgroundColor: '#F63049' }}
            className="flex-[2] py-4 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-xl shadow-2xl hover:brightness-110 active:scale-95 flex items-center justify-center space-x-2 transition-all"
          >
            <span>Confirm Order 🎉</span>
            <CheckCircle size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CheckoutForm;