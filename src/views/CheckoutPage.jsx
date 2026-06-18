'use client';

/**
 * CheckoutPage — Premium Minimalist Edition
 * Delegates form rendering, coupon validation, and profile auto-fill to CheckoutForm.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from '../utils/router-compat.jsx';
import { ShoppingBag, ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { apiUrl } from '../config/api.js';
import { useMutation } from '../hooks/useAsync.js';
import CheckoutForm from '../components/CheckoutForm.jsx';

const CheckoutPage = () => {
  const { cartItems, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [stockWarnings, setStockWarnings] = useState([]);

  // ── Checkout mutation ──────────────────────────────────────────
  const { mutate: placeOrder, loading: placing, error: checkoutError } = useMutation(
    async (formData) => {
      const customer = {
        name:    `${formData.firstName} ${formData.lastName}`.trim(),
        email:   formData.email,
        phone:   formData.phone,
        address: formData.address,
        city:    formData.city,
        zip:     formData.zip ?? '',
      };

      const items = cartItems.map(item => {
        const discount = item.discount ?? 0;
        const finalPrice = discount > 0 ? item.price * (1 - discount / 100) : item.price;
        return {
          id:            item.id,
          name:          item.name,
          price:         finalPrice,
          quantity:      item.quantity ?? 1,
          selectedSize:  item.selectedSize  ?? '',
          selectedColor: item.selectedColor ?? '',
          category:      item.bucket        ?? '',
          subCategory:   item.subCategory   ?? '',
        };
      });

      const res = await fetch(apiUrl('/api/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customer, 
          items, 
          total: formData.finalTotal, 
          paymentMethod: formData.paymentMethod,
          couponCode: formData.couponCode,
          paymentDetails: formData.paymentDetails,
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

      {/* ── Checkout form integration ───────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-12 lg:py-20">
        <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-10">
          Shipping & Payment
        </h1>

        {/* Error banner */}
        {checkoutError && (
          <div className="mb-6 flex items-start space-x-3 p-4 bg-red-50 border-l-2 border-cardinal">
            <AlertCircle size={14} className="text-cardinal flex-shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-cardinal">{checkoutError}</p>
          </div>
        )}

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