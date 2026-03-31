/**
 * @fileoverview Checkout Page
 * Applies: react-ui-patterns (button disabled during submit, error surfaced),
 *          javascript-pro (async/await, proper error handling),
 *          react-patterns (composition with CheckoutForm)
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import CheckoutForm from '../components/CheckoutForm.jsx';
import { useCart } from '../context/CartContext.jsx';
import { apiUrl } from '../config/api.js';
import { useMutation } from '../hooks/useAsync.js';

const CheckoutPage = () => {
  const { cartItems, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [stockWarnings, setStockWarnings] = useState([]);

  // ── Checkout mutation ─────────────────────────────────────────

  const { mutate: placeOrder, loading: placing, error: checkoutError } = useMutation(
    async (formData) => {
      const customer = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        address: formData.address,
        city: formData.city,
        zip: formData.zip ?? '',
      };

      const items = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity ?? 1,
        selectedSize: item.selectedSize ?? '',
      }));

      const res = await fetch(apiUrl('/api/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          items,
          total: formData.finalTotal ?? total,
          paymentMethod: formData.paymentMethod,
        }),
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
        // Surface stock warnings from error message
        if (err.message.includes('stock')) {
          setStockWarnings([err.message]);
        }
      },
    }
  );

  // ── Empty cart guard ──────────────────────────────────────────

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag size={32} className="text-gray-300" />
          </div>
          <div>
            <p className="text-xl font-black uppercase tracking-tighter text-gray-900 mb-2">
              Your bag is empty
            </p>
            <p className="text-sm text-gray-400">Add some items to checkout</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-[#ba1f3d] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:brightness-110 transition-all"
          >
            <ArrowLeft size={14} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900 mb-2">
            Complete Your Order
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            256-bit SSL encrypted · Safe & Secure
          </p>
        </div>

        {/* Global checkout error */}
        {checkoutError && !stockWarnings.length && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm font-bold text-red-700">{checkoutError}</p>
          </div>
        )}

        {/* Checkout Form */}
        <CheckoutForm
          onComplete={placeOrder}
          stockWarnings={stockWarnings}
          isSubmitting={placing}
        />
      </div>
    </div>
  );
};

export default CheckoutPage;
