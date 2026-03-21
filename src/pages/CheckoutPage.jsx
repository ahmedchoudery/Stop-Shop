import React from 'react';
import CheckoutForm from '../components/CheckoutForm';

const CheckoutPage = () => {
  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-8 text-center">Checkout</h1>
        <CheckoutForm />
      </div>
    </div>
  );
};

export default CheckoutPage;
