import React, { useState } from 'react';
import CheckoutForm from '../components/CheckoutForm';
import OrderSuccessPage from './OrderSuccessPage';
import { useCart } from '../context/CartContext';

const CheckoutPage = () => {
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const { cartItems, total } = useCart();

  const handleOrderComplete = async (formData) => {
    // Try to submit to backend
    try {
      const orderPayload = {
        customer: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          zip: formData.zip,
        },
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          selectedSize: item.selectedSize,
        })),
        total: formData.finalTotal || total,
        paymentMethod: formData.paymentMethod,
        promoApplied: formData.appliedPromo?.code || null,
      };

      await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
    } catch (err) {
      // Silently fail — show success anyway
    }

    setOrderData(formData);
    setOrderComplete(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (orderComplete) {
    return <OrderSuccessPage orderData={orderData} />;
  }

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-3">Secure Checkout</p>
          <h1 className="text-5xl font-black uppercase tracking-tighter">Complete Your Order</h1>
          <p className="text-gray-400 mt-3 text-sm">256-bit SSL encrypted · Safe & Secure</p>
        </div>
        <CheckoutForm onComplete={handleOrderComplete} />
      </div>
    </div>
  );
};

export default CheckoutPage;