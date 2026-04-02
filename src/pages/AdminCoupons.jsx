/**
 * @fileoverview AdminCoupons.jsx
 * Route: /admin/coupons
 *
 * Full coupon management:
 * - Create percentage or fixed discount coupons
 * - Set expiry date, min order, max uses
 * - Toggle active/inactive
 * - Delete coupons
 * - Live usage counter
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Plus, Tag, Trash2, ToggleLeft, ToggleRight,
  CheckCircle, AlertCircle, X, RefreshCw, Copy, Check
} from 'lucide-react';
import { authFetch, handleAuthError } from '../lib/auth.js';
import { apiUrl } from '../config/api.js';

// ─────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────

const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, show };
};

const DEFAULT_FORM = {
  code: '', type: 'percentage', value: '',
  minOrderValue: '', maxUses: '', expiresAt: '',
};

// ─────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────

const CouponStatusBadge = ({ coupon }) => {
  const expired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  const maxed   = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;

  if (!coupon.isActive) {
    return <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[8px] font-black uppercase tracking-widest rounded-full">Inactive</span>;
  }
  if (expired) {
    return <span className="px-2.5 py-1 bg-red-50 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-full">Expired</span>;
  }
  if (maxed) {
    return <span className="px-2.5 py-1 bg-orange-50 text-orange-600 text-[8px] font-black uppercase tracking-widest rounded-full">Limit Reached</span>;
  }
  return <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[8px] font-black uppercase tracking-widest rounded-full">Active</span>;
};

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────

const AdminCoupons = () => {
  const [coupons,   setCoupons]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState(DEFAULT_FORM);
  const [errors,    setErrors]    = useState({});
  const [copied,    setCopied]    = useState(null);
  const { toast, show: showToast } = useToast();

  // ── Fetch ────────────────────────────────────────────────────────
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(apiUrl('/api/admin/coupons'));
      if (handleAuthError(res.status)) return;
      if (!res.ok) throw new Error('Failed to fetch coupons');
      setCoupons(await res.json());
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  // ── Validate form ─────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.code.trim()) errs.code = 'Code is required';
    else if (!/^[A-Z0-9_-]{3,30}$/.test(form.code.toUpperCase())) errs.code = 'Only letters, numbers, hyphens, underscores (3-30 chars)';
    if (!form.value || isNaN(parseFloat(form.value)) || parseFloat(form.value) <= 0) errs.value = 'Enter a valid value';
    if (form.type === 'percentage' && parseFloat(form.value) > 100) errs.value = 'Percentage cannot exceed 100';
    return errs;
  };

  // ── Create coupon ─────────────────────────────────────────────────
  const handleCreate = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const res = await authFetch(apiUrl('/api/admin/coupons'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          code:          form.code.trim().toUpperCase(),
          type:          form.type,
          value:         parseFloat(form.value),
          minOrderValue: parseFloat(form.minOrderValue) || 0,
          maxUses:       form.maxUses ? parseInt(form.maxUses) : null,
          expiresAt:     form.expiresAt || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create coupon');

      setCoupons(prev => [data, ...prev]);
      setForm(DEFAULT_FORM);
      setErrors({});
      setShowForm(false);
      showToast(`Coupon "${data.code}" created ✓`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ─────────────────────────────────────────────────
  const handleToggle = async (coupon) => {
    try {
      const res = await authFetch(apiUrl(`/api/admin/coupons/${coupon._id}`), {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (!res.ok) throw new Error('Failed to update coupon');
      const updated = await res.json();
      setCoupons(prev => prev.map(c => c._id === coupon._id ? updated : c));
      showToast(`"${coupon.code}" ${updated.isActive ? 'activated' : 'deactivated'} ✓`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ── Delete coupon ─────────────────────────────────────────────────
  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
    try {
      const res = await authFetch(apiUrl(`/api/admin/coupons/${coupon._id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete coupon');
      setCoupons(prev => prev.filter(c => c._id !== coupon._id));
      showToast(`"${coupon.code}" deleted ✓`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ── Copy code ─────────────────────────────────────────────────────
  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const inputCls = (field) =>
    `w-full border-b-2 py-2.5 text-sm font-bold bg-transparent outline-none transition-all placeholder:text-gray-300 ${
      errors[field] ? 'border-red-400' : 'border-gray-200 focus:border-[#ba1f3d]'
    }`;

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">Promotions</p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Coupons</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={fetchCoupons} disabled={loading}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all disabled:opacity-40">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setShowForm(s => !s); setForm(DEFAULT_FORM); setErrors({}); }}
            className="flex items-center space-x-2 px-6 py-3 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-900 transition-all shadow-xl shadow-red-200/40"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            <span>{showForm ? 'Cancel' : 'New Coupon'}</span>
          </button>
        </div>
      </div>

      {/* ── Toast ─────────────────────────────────────────── */}
      {toast && (
        <div key={toast.id} className={`mb-6 p-4 rounded-xl flex items-center space-x-3 animate-slide-up border ${
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
          <p className="text-xs font-bold">{toast.message}</p>
        </div>
      )}

      {/* ── Create Form ───────────────────────────────────── */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-xl mb-8 animate-slide-up">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-8">New Coupon</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-6">
            {/* Code */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Code *</label>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20"
                maxLength={30}
                className={inputCls('code')}
              />
              {errors.code && <p className="text-[9px] text-red-500 mt-1">{errors.code}</p>}
            </div>

            {/* Type */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border-b-2 border-gray-200 focus:border-[#ba1f3d] py-2.5 text-sm font-bold bg-transparent outline-none transition-all"
              >
                <option value="percentage">Percentage (% off)</option>
                <option value="fixed">Fixed Amount (PKR off)</option>
              </select>
            </div>

            {/* Value */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                Value * {form.type === 'percentage' ? '(%)' : '(PKR)'}
              </label>
              <input
                type="number"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder={form.type === 'percentage' ? '20' : '500'}
                min="1"
                max={form.type === 'percentage' ? '100' : undefined}
                className={inputCls('value')}
              />
              {errors.value && <p className="text-[9px] text-red-500 mt-1">{errors.value}</p>}
            </div>

            {/* Min order */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Min Order (PKR)</label>
              <input
                type="number"
                value={form.minOrderValue}
                onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))}
                placeholder="0 = no minimum"
                min="0"
                className={inputCls('minOrderValue')}
              />
            </div>

            {/* Max uses */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Max Uses</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="Leave blank = unlimited"
                min="1"
                className={inputCls('maxUses')}
              />
            </div>

            {/* Expiry */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Expiry Date</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className={inputCls('expiresAt')}
              />
            </div>
          </div>

          {/* Preview */}
          {form.code && form.value && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Preview</p>
              <p className="text-sm font-black text-gray-900">
                Code <span className="font-mono text-[#ba1f3d]">{form.code || '—'}</span> gives{' '}
                {form.type === 'percentage' ? `${form.value}% off` : `PKR ${parseInt(form.value || 0).toLocaleString()} off`}
                {form.minOrderValue ? ` on orders over PKR ${parseInt(form.minOrderValue).toLocaleString()}` : ''}
                {form.maxUses ? ` (max ${form.maxUses} uses)` : ' (unlimited uses)'}
                {form.expiresAt ? ` · expires ${new Date(form.expiresAt).toLocaleDateString()}` : ' · no expiry'}
              </p>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={saving}
            className="flex items-center space-x-2 px-8 py-3 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Tag size={13} /><span>Create Coupon</span></>
            }
          </button>
        </div>
      )}

      {/* ── Coupons Table ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-2 border-gray-100 border-t-[#ba1f3d] rounded-full animate-spin mx-auto" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-20 text-center">
            <Tag size={32} className="mx-auto text-gray-200 mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-300">No coupons yet</p>
            <p className="text-[10px] text-gray-300 mt-2">CARDINAL20 (20% off) is auto-created on server start</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Code', 'Discount', 'Min Order', 'Uses', 'Expiry', 'Status', 'Actions'].map(col => (
                    <th key={col} className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map(coupon => (
                  <tr key={coupon._id} className="group hover:bg-gray-50/60 transition-colors">
                    {/* Code */}
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-black text-gray-900">{coupon.code}</span>
                        <button
                          onClick={() => handleCopy(coupon.code)}
                          className="p-1 text-gray-300 hover:text-[#ba1f3d] transition-colors"
                          title="Copy code"
                        >
                          {copied === coupon.code ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>

                    {/* Discount */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-black text-[#ba1f3d]">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `PKR ${coupon.value.toLocaleString()}`} off
                      </span>
                    </td>

                    {/* Min order */}
                    <td className="px-5 py-4 text-xs font-bold text-gray-500">
                      {coupon.minOrderValue > 0 ? `PKR ${coupon.minOrderValue.toLocaleString()}` : 'None'}
                    </td>

                    {/* Uses */}
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold text-gray-700">
                        {coupon.usedCount}
                        {coupon.maxUses !== null && ` / ${coupon.maxUses}`}
                      </span>
                    </td>

                    {/* Expiry */}
                    <td className="px-5 py-4 text-xs font-bold text-gray-500">
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString('en-PK')
                        : 'Never'}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <CouponStatusBadge coupon={coupon} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggle(coupon)}
                          title={coupon.isActive ? 'Deactivate' : 'Activate'}
                          className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          {coupon.isActive
                            ? <ToggleRight size={18} className="text-green-500" />
                            : <ToggleLeft size={18} />
                          }
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          title="Delete coupon"
                          className="p-2 text-gray-300 hover:text-[#ba1f3d] transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
            {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} total
          </p>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">
            MongoDB · stopshop.coupons
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminCoupons;