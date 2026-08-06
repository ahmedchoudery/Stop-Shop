/**
 * CouponInput — Premium Minimalist Edition
 * Borderless input with bottom border only, surgical feedback.
 */

import React, { useState } from 'react';
import { Tag, Check, X, Loader } from 'lucide-react';
import { apiUrl } from '../config/api.js';

const CouponInput = ({ cartTotal, onApply, onRemove, appliedCoupon }) => {
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/public/coupons/validate'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          code:             trimmed,
          cartTotal,
          activeCouponCode: appliedCoupon?.code ?? '',
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Invalid coupon code'); return; }
      onApply(data);
      setCode('');
    } catch {
      setError('Could not validate coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => { setCode(''); setError(''); onRemove(); };
  const handleKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleApply(); } };

  // ── Applied state ──────────────────────────────────────────────
  if (appliedCoupon) {
    return (
      <div className="bg-cardinal/5 border-cardinal/20 flex animate-fade-up items-center justify-between border px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-cardinal">
            <Check size={10} className="text-black" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-900">
              {appliedCoupon.code}
            </p>
            <p className="mt-0.5 text-[9px] font-bold text-cardinal">
              {appliedCoupon.message}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="p-1 text-gray-400 transition-colors hover:text-gray-900"
          title="Remove coupon"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  // ── Input state ────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-stretch space-x-3">
        {/* Input */}
        <div className="relative flex-grow">
          <Tag size={12} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            id="coupon-code-input"
            name="couponCode"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="PROMO CODE"
            maxLength={30}
            className="w-full border-b-2 border-gray-200 bg-transparent py-3 pl-5 pr-2 text-[11px] font-black uppercase tracking-[0.25em] outline-none transition-colors duration-200 placeholder:font-normal placeholder:normal-case placeholder:text-gray-300 focus:border-gray-900"
          />
        </div>

        {/* Apply button */}
        <button
          type="button"
          onClick={handleApply}
          disabled={!code.trim() || loading}
          className="flex flex-shrink-0 items-center space-x-1.5 bg-gray-900 px-5 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-cardinal disabled:cursor-not-allowed disabled:opacity-30"
        >
          {loading
            ? <Loader size={11} className="animate-spin" />
            : <span>Apply</span>
          }
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 flex items-center space-x-1.5 text-[9px] font-bold text-cardinal">
          <X size={9} className="flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default CouponInput;