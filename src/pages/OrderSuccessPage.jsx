/**
 * @fileoverview OrderSuccessPage.jsx
 * Route: /order-success?orderID=ORD-XXXXX
 * Shown after successful checkout.
 * Includes a "Track This Order" button linking to /track.
 */

import React, { useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">

        {/* ── Success Icon ─────────────────────────────── */}
        <div className="relative inline-block mb-8">
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20" />
          <div className="relative w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-200/60 mx-auto">
            <CheckCircle size={44} className="text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* ── Headline ──────────────────────────────────── */}
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-3">
          Order Confirmed
        </p>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-gray-900 mb-3">
          Thank You!
        </h1>
        <p className="text-gray-500 font-bold text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          Your order has been placed successfully. We'll start processing it right away.
        </p>

        {/* ── Order ID Card ─────────────────────────────── */}
        {orderID && (
          <div className="bg-white border border-gray-100 rounded-sm shadow-xl p-6 mb-8 inline-block w-full">
            <div className="h-1 bg-[#ba1f3d] w-full -mt-6 -mx-6 mb-6" style={{ width: 'calc(100% + 48px)', marginLeft: '-24px' }} />
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 mb-2">
              Your Order Reference
            </p>
            <p className="text-2xl font-black text-gray-900 font-mono tracking-wider">
              {orderID}
            </p>
            <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
              Save this for tracking your order
            </p>
          </div>
        )}

        {/* ── What Happens Next ──────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-sm shadow-sm p-6 mb-8 text-left">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-5">
            What Happens Next
          </p>
          <div className="space-y-4">
            {[
              { icon: Package,  label: 'We prepare your order',  sub: 'Usually within 1 business day' },
              { icon: Truck,    label: 'Your order ships',        sub: 'You\'ll get a confirmation email' },
              { icon: MapPin,   label: 'Delivered to you',        sub: 'Estimated 2-4 business days' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center space-x-4">
                <div className="w-9 h-9 bg-[#ba1f3d]/5 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-[#ba1f3d]" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-gray-900">{label}</p>
                  <p className="text-[10px] font-bold text-gray-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Action Buttons ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Track Order — primary */}
          {orderID && (
            <Link
              to={`/track?orderID=${orderID}`}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-red-100/50"
            >
              <Search size={14} />
              <span>Track This Order</span>
              <ArrowRight size={14} />
            </Link>
          )}

          {/* Continue Shopping */}
          <Link
            to="/"
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 border-2 border-gray-900 text-gray-900 text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all"
          >
            <Home size={14} />
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
            className="text-[#ba1f3d] hover:underline"
          >
            WhatsApp us
          </a>
          {' '}or email{' '}
          <a
            href="mailto:concierge@stop-shop.pk"
            className="text-[#ba1f3d] hover:underline"
          >
            concierge@stop-shop.pk
          </a>
        </p>
      </div>
    </div>
  );
};

export default OrderSuccessPage;