/**
 * @fileoverview Admin Login Page
 * Applies: react-ui-patterns (button disabled during submit, error always surfaced),
 *          javascript-pro (async/await, proper error propagation),
 *          react-patterns (form state management, single responsibility)
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { adminLogin } from '../lib/auth.js';
import { useMutation } from '../hooks/useAsync.js';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to intended page after login (or default to /admin)
  const from = location.state?.from?.pathname ?? '/admin';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Validation ────────────────────────────────────────────────

  const validateForm = useCallback(() => {
    const errors = {};
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email';
    if (!form.password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  // ── Login mutation ────────────────────────────────────────────

  const { mutate: doLogin, loading, error: loginError } = useMutation(
    () => adminLogin(form.email.trim(), form.password),
    {
      onSuccess: () => navigate(from, { replace: true }),
    }
  );

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    await doLogin();
  }, [validateForm, doLogin]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    setFieldErrors(prev => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  // ── Styles ────────────────────────────────────────────────────

  const inputCls = (field) => `w-full border-b-2 py-3 text-sm font-bold bg-transparent outline-none transition-all placeholder:text-gray-300 ${
    fieldErrors[field] ? 'border-red-400 text-red-900' : 'border-gray-100 focus:border-[#ba1f3d]'
  }`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Brand Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-[#ba1f3d] mb-3">
            Stop & Shop
          </h1>
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <Shield size={14} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Admin Control Center</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white shadow-2xl p-10 rounded-2xl">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-8">
            Sign In
          </h2>

          {/* Global error — always surfaced */}
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3">
              <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-bold text-red-700">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-8">

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={inputCls('email')}
                placeholder="admin@stopshop.com"
                autoComplete="email"
                disabled={loading}
              />
              {fieldErrors.email && (
                <p className="text-[10px] font-bold text-red-500">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className={`${inputCls('password')} pr-10`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[10px] font-bold text-red-500">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit — ALWAYS disabled during loading (react-ui-patterns rule) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#ba1f3d] text-white font-black uppercase tracking-[0.3em] text-xs rounded-xl shadow-2xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Shield size={14} />
                  <span>Access Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Security note */}
          <p className="mt-8 text-center text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">
            256-bit SSL · Session expires in 8 hours
          </p>
        </div>

        {/* Version */}
        <p className="text-center text-[8px] font-black uppercase tracking-[0.5em] text-gray-300 mt-8">
          Gujarat Edition · 2026
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
