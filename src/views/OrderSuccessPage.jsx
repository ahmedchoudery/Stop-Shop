'use client';

/**
 * @fileoverview OrderSuccessPage.jsx
 * Route: /order-success?orderID=ORD-XXXXX
 * Shown after successful checkout.
 * Includes a "Track This Order" button linking to /track.
 */

import React, { useEffect, useRef } from 'react';
import { useSearchParams, Link } from '../utils/router-compat.jsx';
import { CheckCircle, Package, MapPin, Truck, ArrowRight, Home, Search } from 'lucide-react';

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderID = searchParams.get('orderID') ?? searchParams.get('orderId') ?? '';

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Order Confirmed — Stop & Shop';
    return () => { document.title = 'Stop & Shop | Premium Clothing'; };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">

        {/* ── Success Icon ─────────────────────────────── */}
        <div className="relative inline-block mb-8">
          <div className="w-20 h-20 border border-gray-900 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-gray-900" strokeWidth={1} />
          </div>
        </div>

        {/* ── Headline ──────────────────────────────────── */}
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 mb-3">
          Order Confirmed
        </p>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-gray-900 mb-3 font-heading">
          Thank You
        </h1>
        <p className="text-gray-500 font-bold text-xs leading-relaxed mb-8 max-w-xs mx-auto uppercase tracking-widest">
          Your order has been placed successfully. We'll start processing it right away.
        </p>

        {/* ── Order ID Card ─────────────────────────────── */}
        {orderID && (
          <div className="bg-white border border-gray-150 p-6 mb-8 inline-block w-full rounded-none">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 mb-2">
              Your Order Reference
            </p>
            <p className="text-2xl font-black text-gray-900 font-mono tracking-wider">
              {orderID}
            </p>
            <p className="text-[8px] font-bold text-gray-400 mt-2.5 uppercase tracking-[0.2em]">
              Save this for tracking your order
            </p>
          </div>
        )}

        {/* ── What Happens Next ──────────────────────────── */}
        <div className="bg-white border border-gray-150 p-6 mb-8 text-left rounded-none">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-5">
            What Happens Next
          </p>
          <div className="space-y-5">
            {[
              { icon: Package,  label: 'We prepare your order',  sub: 'Usually within 1 business day' },
              { icon: Truck,    label: 'Your order ships',        sub: 'You\'ll get a confirmation email' },
              { icon: MapPin,   label: 'Delivered to you',        sub: 'Estimated 2-4 business days' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center space-x-4">
                <div className="w-9 h-9 border border-gray-200 flex items-center justify-center flex-shrink-0 bg-white">
                  <Icon size={14} className="text-gray-900" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-900 leading-none mb-1">{label}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Action Buttons ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Track Order — primary */}
          {orderID && (
            <Link
              to={`/track?orderID=${orderID}`}
              className="flex-1 flex items-center justify-center space-x-2.5 px-6 py-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all rounded-none"
            >
              <Search size={13} />
              <span>Track Order</span>
              <ArrowRight size={13} />
            </Link>
          )}

          {/* Continue Shopping */}
          <Link
            to="/"
            className="flex-1 flex items-center justify-center space-x-2.5 px-6 py-4 border border-gray-900 text-gray-900 text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all rounded-none"
          >
            <Home size={13} />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* ── Help line ─────────────────────────────────── */}
        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-10">
          Questions?{' '}
          <a
            href="https://wa.me/923068458655"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cardinal hover:underline"
          >
            WhatsApp us
          </a>
          {' '}or email{' '}
          <a
            href="mailto:concierge@stop-shop.pk"
            className="text-cardinal hover:underline"
          >
            concierge@stop-shop.pk
          </a>
        </p>
      </div>
    </div>
  );
};

export default OrderSuccessPage;