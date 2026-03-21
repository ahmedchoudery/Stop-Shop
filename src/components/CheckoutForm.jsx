import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { CreditCard, Truck, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const CheckoutForm = ({ onComplete }) => {
  const { total, cartItems } = useCart();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    zip: '',
    paymentMethod: 'credit-card',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const ProgressIndicator = () => (
    <div className="mb-10">
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-black inline-block py-1 px-2 uppercase rounded-full text-red-900 bg-yellow-400">
              Step {step} of 3
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-black inline-block text-gray-400 uppercase tracking-widest">
              {step === 1 ? 'Shipping' : step === 2 ? 'Payment' : 'Review'}
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
          <div 
            style={{ width: `${(step / 3) * 100}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-400 transition-all duration-500"
          ></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-10 bg-white shadow-2xl border border-gray-100 min-h-[600px] flex flex-col">
      <ProgressIndicator />

      <div className="flex-grow">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-3 mb-8">
              <Truck className="text-red-600" size={24} />
              <h2 className="text-2xl font-black uppercase tracking-tighter">Shipping Info</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">First Name</label>
                <input 
                  type="text" 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full border-b-2 border-gray-100 focus:border-red-600 outline-none py-2 font-bold text-gray-900 transition-colors"
                  placeholder="John"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Last Name</label>
                <input 
                  type="text" 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full border-b-2 border-gray-100 focus:border-red-600 outline-none py-2 font-bold text-gray-900 transition-colors"
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full border-b-2 border-gray-100 focus:border-red-600 outline-none py-2 font-bold text-gray-900 transition-colors"
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Street Address</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full border-b-2 border-gray-100 focus:border-red-600 outline-none py-2 font-bold text-gray-900 transition-colors"
                placeholder="123 Fashion Ave"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">City</label>
                <input 
                  type="text" 
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full border-b-2 border-gray-100 focus:border-red-600 outline-none py-2 font-bold text-gray-900 transition-colors"
                  placeholder="New York"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">ZIP Code</label>
                <input 
                  type="text" 
                  name="zip"
                  value={formData.zip}
                  onChange={handleInputChange}
                  className="w-full border-b-2 border-gray-100 focus:border-red-600 outline-none py-2 font-bold text-gray-900 transition-colors"
                  placeholder="10001"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center space-x-3 mb-8">
              <CreditCard className="text-red-600" size={24} />
              <h2 className="text-2xl font-black uppercase tracking-tighter">Payment Method</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 border-gray-100 has-[:checked]:border-red-600 has-[:checked]:bg-red-50">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="credit-card"
                  checked={formData.paymentMethod === 'credit-card'}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500"
                />
                <span className="ml-4 font-black uppercase text-xs tracking-widest">Credit / Debit Card</span>
              </label>

              <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 border-gray-100 has-[:checked]:border-red-600 has-[:checked]:bg-red-50">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500"
                />
                <span className="ml-4 font-black uppercase text-xs tracking-widest">Cash on Delivery (COD)</span>
              </label>
            </div>

            {formData.paymentMethod === 'credit-card' ? (
              <div className="p-6 bg-gray-50 rounded-2xl space-y-4 border border-gray-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Card Number</label>
                  <input 
                    type="text" 
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 font-mono"
                    placeholder="**** **** **** ****"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Expiry Date</label>
                    <input 
                      type="text" 
                      name="expiry"
                      value={formData.expiry}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">CVV</label>
                    <input 
                      type="text" 
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 bg-red-50 rounded-2xl border-2 border-dashed border-red-200 text-center space-y-3">
                <Truck className="mx-auto text-red-600" size={32} />
                <p className="font-black uppercase text-xs tracking-widest text-red-900">Pay At Your Door</p>
                <p className="text-sm text-red-700 font-medium">Please keep the exact change ready for our delivery partner.</p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center space-x-3 mb-8">
              <CheckCircle className="text-red-600" size={24} />
              <h2 className="text-2xl font-black uppercase tracking-tighter">Order Summary</h2>
            </div>

            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2">
              {cartItems.map((item) => (
                <div key={item.cartId} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded shadow-sm" />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-tight line-clamp-1">{item.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Qty: 1</p>
                    </div>
                  </div>
                  <p className="font-black text-sm text-red-600">${item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="p-6 bg-black text-white rounded-2xl space-y-4 shadow-xl">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                <span>Shipping Address</span>
                <button onClick={() => setStep(1)} className="text-yellow-400 hover:underline">Edit</button>
              </div>
              <p className="text-sm font-medium">{formData.address}, {formData.city} {formData.zip}</p>
              
              <div className="border-t border-gray-800 pt-4 flex justify-between items-center">
                <span className="text-lg font-black uppercase tracking-tighter">Order Total</span>
                <span className="text-3xl font-black text-yellow-400">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 flex justify-between space-x-4">
        {step > 1 && (
          <button 
            onClick={prevStep}
            className="flex-1 py-4 border-2 border-black text-black font-black uppercase text-[11px] tracking-[0.2em] rounded-xl hover:bg-gray-50 flex items-center justify-center space-x-2 transition-all"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}
        
        {step < 3 ? (
          <button 
            onClick={nextStep}
            style={{ backgroundColor: '#F63049' }}
            className="flex-[2] py-4 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-xl shadow-xl hover:brightness-110 active:scale-95 flex items-center justify-center space-x-2 transition-all"
          >
            <span>Next Step</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <button 
            onClick={() => onComplete && onComplete(formData)}
            style={{ backgroundColor: '#F63049' }}
            className="flex-[2] py-4 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-xl shadow-2xl hover:brightness-110 active:scale-95 animate-pulse flex items-center justify-center space-x-2 transition-all"
          >
            <span>Confirm Order</span>
            <CheckCircle size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CheckoutForm;
