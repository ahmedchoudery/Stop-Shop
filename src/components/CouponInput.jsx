/**
 * @fileoverview CouponInput.jsx
 * Updated: Passes activeCouponCode to server to prevent discount stacking.
 * The server rejects a second coupon if one is already applied.
 */

import React, { useState } from 'react';
import { Tag, CheckCircle, X, Loader } from 'lucide-react';
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
          activeCouponCode: appliedCoupon?.code ?? null, // ← stacking prevention
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
      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-sm animate-fade-up">
        <div className="flex items-center space-x-3">
          <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-green-800">{appliedCoupon.code} applied</p>
            <p className="text-[10px] font-bold text-green-600 mt-0.5">{appliedCoupon.message}</p>
          </div>
        </div>
        <button onClick={handleRemove} className="p-1.5 text-green-400 hover:text-green-700 hover:bg-green-100 rounded-lg transition-all" title="Remove coupon">
          <X size={14} />
        </button>
      </div>
    );
  }

  // ── Input state ────────────────────────────────────────────────
  return (
    <div>
      <div className="flex space-x-2">
        <div className="relative flex-grow">
          <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="COUPON CODE"
            maxLength={30}
            className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 focus:border-[#ba1f3d] outline-none transition-all text-xs font-black uppercase tracking-widest placeholder:text-gray-300 placeholder:font-normal placeholder:normal-case bg-white"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={!code.trim() || loading}
          className="px-5 py-3.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#ba1f3d] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2 flex-shrink-0"
        >
          {loading ? <Loader size={13} className="animate-spin" /> : <span>Apply</span>}
        </button>
      </div>
      {error && (
        <p className="text-[10px] font-bold text-[#ba1f3d] mt-2 flex items-center space-x-1.5">
          <X size={10} className="flex-shrink-0" /><span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default CouponInput;