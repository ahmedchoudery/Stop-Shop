/**
 * @fileoverview ReturnsPage.jsx
 * Route: /returns
 * Public returns & refund policy page.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, CheckCircle, X } from 'lucide-react';

const ReturnsPage = () => (
  <div className="min-h-screen bg-white">

    {/* ── Hero ──────────────────────────────────────────── */}
    <div className="bg-gray-900 text-white py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-4">
          Customer Care
        </p>
        <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-4">
          Returns &amp; Exchanges
        </h1>
        <p className="text-gray-400 font-bold max-w-md mx-auto">
          We want you to love what you bought. If you don't, we'll make it right.
        </p>
      </div>
    </div>

    <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">

      {/* ── Policy ────────────────────────────────────────── */}
      <section>
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-4">
          Our Policy
        </p>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-6">
          7-Day Return Policy
        </h2>
        <p className="text-gray-600 font-bold leading-relaxed mb-4">
          You may return any unworn, unwashed item with original tags attached within
          7 days of delivery. We offer full exchange or store credit — no questions asked.
        </p>
        <p className="text-gray-500 text-sm font-bold leading-relaxed">
          Items must be in original condition. We do not accept returns on sale items,
          undergarments, or items that have been worn, washed, or damaged by the customer.
        </p>
      </section>

      {/* ── Accepted / Not Accepted ───────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 bg-green-50 border border-green-100 rounded-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-green-600 mb-4">
            ✓ We Accept
          </p>
          <ul className="space-y-2">
            {[
              'Unworn items with tags attached',
              'Items returned within 7 days',
              'Items in original packaging',
              'Defective or damaged products',
              'Wrong size or item sent',
            ].map(item => (
              <li key={item} className="flex items-center space-x-2 text-xs font-bold text-gray-700">
                <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 bg-red-50 border border-red-100 rounded-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-[#ba1f3d] mb-4">
            ✗ We Don't Accept
          </p>
          <ul className="space-y-2">
            {[
              'Worn or washed items',
              'Returns requested after 7 days',
              'Items without original tags',
              'Sale or discounted items',
              'Customer-damaged items',
            ].map(item => (
              <li key={item} className="flex items-center space-x-2 text-xs font-bold text-gray-700">
                <X size={12} className="text-[#ba1f3d] flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Process ───────────────────────────────────────── */}
      <section>
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-4">
          How It Works
        </p>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-8">
          Return Process
        </h2>

        <div className="space-y-6">
          {[
            {
              step: '01', title: 'Contact Us',
              desc: 'WhatsApp or email us with your order ID and reason for return within 7 days of delivery.',
            },
            {
              step: '02', title: 'Get Approval',
              desc: "We'll review your request within 24 hours and send you return instructions.",
            },
            {
              step: '03', title: 'Ship It Back',
              desc: 'Pack the item securely with original tags. Drop it at your nearest courier service.',
            },
            {
              step: '04', title: 'Exchange / Credit',
              desc: "Once received and inspected, we'll process your exchange or store credit within 2 business days.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start space-x-5">
              <div className="w-10 h-10 bg-[#ba1f3d] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[10px] font-black">{step}</span>
              </div>
              <div className="pt-1">
                <p className="font-black uppercase tracking-tight text-gray-900 mb-1">{title}</p>
                <p className="text-sm font-bold text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Shipping Costs ────────────────────────────────── */}
      <section className="p-6 bg-gray-50 border border-gray-100 rounded-sm">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">
          Shipping Costs
        </p>
        <p className="text-sm font-bold text-gray-700 leading-relaxed">
          If the return is due to our error (wrong item, defective product), we cover the
          return shipping. For size exchanges, the customer covers return shipping.
          All replacement items are shipped free of charge.
        </p>
      </section>

      {/* ── Contact ───────────────────────────────────────── */}
      <section className="bg-gray-900 text-white p-10 rounded-sm">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-4">
          Need Help?
        </p>
        <h2 className="text-xl font-black uppercase tracking-tighter mb-6">
          Contact Our Team
        </h2>
        <div className="space-y-4">
          <a
            href="https://wa.me/923068458655?text=Hi%2C%20I%20need%20help%20with%20a%20return"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 text-sm font-bold text-gray-300 hover:text-white transition-colors"
          >
            <Phone size={14} className="text-[#ba1f3d]" />
            <span>+92 306-8458655 (WhatsApp preferred)</span>
          </a>
          <a
            href="mailto:concierge@stop-shop.pk"
            className="flex items-center space-x-3 text-sm font-bold text-gray-300 hover:text-white transition-colors"
          >
            <Mail size={14} className="text-[#ba1f3d]" />
            <span>concierge@stop-shop.pk</span>
          </a>
        </div>
        <p className="text-[9px] font-bold text-gray-600 mt-6 uppercase tracking-widest">
          Response time: Within 24 hours · Mon–Sat 10am–8pm PKT
        </p>
        <div className="mt-8 pt-6 border-t border-white/10">
          <Link
            to="/"
            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
          >
            ← Back to Shopping
          </Link>
        </div>
      </section>
    </div>
  </div>
);

export default ReturnsPage;