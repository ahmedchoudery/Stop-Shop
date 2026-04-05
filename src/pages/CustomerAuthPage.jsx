/**
 * @fileoverview CustomerAuthPage.jsx
 * Route: /account/login
 * Handles both customer registration and login in a single page.
 * On success → redirects to /account or to the page they came from.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, ArrowLeft, User, Mail, Lock,
  Phone, ChevronRight, Loader, AlertCircle
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';

// ─────────────────────────────────────────────────────────────────
// SHARED INPUT
// ─────────────────────────────────────────────────────────────────

const Field = ({ label, error, children }) => (
  <div>
    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 block mb-2">
      {label}
    </label>
    {children}
    {error && (
      <p className="text-[9px] font-bold text-[#ba1f3d] mt-1.5 flex items-center space-x-1">
        <AlertCircle size={9} />
        <span>{error}</span>
      </p>
    )}
  </div>
);

const inputCls = (err) =>
  `w-full border-b-2 py-3 text-sm font-bold bg-transparent text-gray-900 outline-none transition-all placeholder:text-gray-300 placeholder:font-normal ${
    err ? 'border-[#ba1f3d]' : 'border-gray-200 focus:border-[#ba1f3d]'
  }`;

// ─────────────────────────────────────────────────────────────────
// REGISTER FORM
// ─────────────────────────────────────────────────────────────────

const RegisterForm = ({ onSwitch }) => {
  const { register, loading, error: ctxError } = useCustomer();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [form,   setForm]   = useState({ name: '', email: '', password: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [show,   setShow]   = useState(false);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await register(form);
      const from = location.state?.from ?? '/account';
      navigate(from, { replace: true });
    } catch { /* error shown from context */ }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Field label="Full Name *" error={errors.name}>
        <div className="relative">
          <User size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" />
          <input type="text" value={form.name} onChange={set('name')} placeholder="Ahmed Khan"
            className={`${inputCls(errors.name)} pl-6`} />
        </div>
      </Field>

      <Field label="Email *" error={errors.email}>
        <div className="relative">
          <Mail size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" />
          <input type="email" value={form.email} onChange={set('email')} placeholder="ahmed@email.com"
            className={`${inputCls(errors.email)} pl-6`} />
        </div>
      </Field>

      <Field label="Phone (optional)" error={errors.phone}>
        <div className="relative">
          <Phone size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" />
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="0300-0000000"
            className={`${inputCls(errors.phone)} pl-6`} />
        </div>
      </Field>

      <Field label="Password *" error={errors.password}>
        <div className="relative">
          <Lock size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type={show ? 'text' : 'password'}
            value={form.password}
            onChange={set('password')}
            placeholder="Min 6 characters"
            className={`${inputCls(errors.password)} pl-6 pr-10`}
          />
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </Field>

      {ctxError && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-100 rounded-sm">
          <AlertCircle size={13} className="text-[#ba1f3d] flex-shrink-0" />
          <p className="text-xs font-bold text-[#ba1f3d]">{ctxError}</p>
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center space-x-2 py-4 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-[0.3em] hover:brightness-110 transition-all disabled:opacity-50 shadow-xl shadow-red-100/50">
        {loading ? <Loader size={14} className="animate-spin" /> : <><span>Create Account</span><ChevronRight size={13} /></>}
      </button>

      <p className="text-center text-[10px] font-bold text-gray-400">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-[#ba1f3d] font-black hover:underline">
          Sign In
        </button>
      </p>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────────
// LOGIN FORM
// ─────────────────────────────────────────────────────────────────

const LoginForm = ({ onSwitch }) => {
  const { login, loading, error: ctxError } = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();

  const [form,   setForm]   = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [show,   setShow]   = useState(false);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.password)     e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await login(form);
      const from = location.state?.from ?? '/account';
      navigate(from, { replace: true });
    } catch { /* shown from context */ }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Field label="Email *" error={errors.email}>
        <div className="relative">
          <Mail size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" />
          <input type="email" value={form.email} onChange={set('email')} placeholder="ahmed@email.com"
            autoFocus className={`${inputCls(errors.email)} pl-6`} />
        </div>
      </Field>

      <Field label="Password *" error={errors.password}>
        <div className="relative">
          <Lock size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type={show ? 'text' : 'password'}
            value={form.password}
            onChange={set('password')}
            placeholder="Your password"
            className={`${inputCls(errors.password)} pl-6 pr-10`}
          />
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </Field>

      {ctxError && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-100 rounded-sm">
          <AlertCircle size={13} className="text-[#ba1f3d] flex-shrink-0" />
          <p className="text-xs font-bold text-[#ba1f3d]">{ctxError}</p>
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center space-x-2 py-4 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-[0.3em] hover:brightness-110 transition-all disabled:opacity-50 shadow-xl shadow-red-100/50">
        {loading ? <Loader size={14} className="animate-spin" /> : <><span>Sign In</span><ChevronRight size={13} /></>}
      </button>

      <p className="text-center text-[10px] font-bold text-gray-400">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-[#ba1f3d] font-black hover:underline">
          Create One
        </button>
      </p>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────

const CustomerAuthPage = () => {
  const { isLoggedIn } = useCustomer();
  const navigate       = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  useEffect(() => {
    if (isLoggedIn) navigate('/account', { replace: true });
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Back link */}
        <Link to="/" className="flex items-center space-x-2 text-gray-400 hover:text-gray-900 transition-colors mb-10 text-[10px] font-black uppercase tracking-widest">
          <ArrowLeft size={13} />
          <span>Back to Shop</span>
        </Link>

        {/* Card */}
        <div className="bg-white border border-gray-100 rounded-sm shadow-2xl shadow-gray-100/80 p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-[#ba1f3d] flex items-center justify-center">
                <span className="text-white text-[8px] font-black">S&S</span>
              </div>
              <span className="text-sm font-black italic uppercase tracking-tighter text-[#ba1f3d]">Stop & Shop</span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-sm text-gray-400 font-bold mt-1">
              {mode === 'login'
                ? 'Sign in to track orders and manage your profile'
                : 'Join Stop & Shop for order history and faster checkout'
              }
            </p>
          </div>

          {/* Form — toggle between register and login */}
          {mode === 'login'
            ? <LoginForm    onSwitch={() => setMode('register')} />
            : <RegisterForm onSwitch={() => setMode('login')}    />
          }
        </div>
      </div>
    </div>
  );
};

export default CustomerAuthPage;