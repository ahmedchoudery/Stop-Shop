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
      <div className="flex items-center justify-between py-3 px-4 bg-cardinal/5 border border-cardinal/20 animate-fade-up">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 bg-cardinal flex items-center justify-center flex-shrink-0">
            <Check size={10} className="text-black" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-900">
              {appliedCoupon.code}
            </p>
            <p className="text-[9px] font-bold text-cardinal mt-0.5">
              {appliedCoupon.message}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
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
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="PROMO CODE"
            maxLength={30}
            className="w-full pl-5 pr-2 py-3 bg-transparent border-b-2 border-gray-200 focus:border-gray-900 outline-none text-[11px] font-black uppercase tracking-[0.25em] placeholder:text-gray-300 placeholder:font-normal placeholder:normal-case transition-colors duration-200"
          />
        </div>

        {/* Apply button */}
        <button
          type="button"
          onClick={handleApply}
          disabled={!code.trim() || loading}
          className="px-5 py-3 bg-gray-900 text-white text-[9px] font-black uppercase tracking-[0.25em] hover:bg-cardinal transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-1.5 flex-shrink-0"
        >
          {loading
            ? <Loader size={11} className="animate-spin" />
            : <span>Apply</span>
          }
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="flex items-center space-x-1.5 text-[9px] font-bold text-cardinal mt-2">
          <X size={9} className="flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default CouponInput;