/**
 * @fileoverview Admin Login Page in strict TypeScript.
 * Applies: react-ui-patterns (button disabled during submit, error always surfaced),
 *          javascript-pro (async/await, proper error propagation),
 *          react-patterns (form state management, single responsibility)
 */

import React, { useState, useCallback, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Shield, AlertCircle, Key } from 'lucide-react';
import { adminLogin, extractErrorMessage } from '../lib/auth.js';
import { useMutation } from '../hooks/useAsync.js';

interface FieldErrors {
  email?: string;
  password?: string;
}

interface TwoFactorData {
  required: boolean;
  setupRequired: boolean;
  tempToken: string;
  qrCode?: string;
  secret?: string;
  backupCodes?: string[];
}

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to intended page after login (or default to /admin)
  const from = (location.state as any)?.from?.pathname ?? '/admin';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // 2FA state variables
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null);
  const [otpCode, setOtpCode] = useState('');

  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // ── Validation ────────────────────────────────────────────────

  const validateForm = useCallback((): boolean => {
    const errors: FieldErrors = {};
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email';
    }
    if (!form.password) {
      errors.password = 'Password is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  // ── Login mutation ────────────────────────────────────────────

  const { mutate: doLogin, loading, error: loginError } = useMutation<any>(
    () => adminLogin(form.email.trim(), form.password),
    {
      onSuccess: (data) => {
        if (data && (data['2faRequired'] || data.requiresTwoFactor || data.twoFactorData?.required)) {
          const t2fa = data.twoFactorData || {};
          setTwoFactorData({
            required: true,
            setupRequired: data.setupRequired ?? t2fa.setupRequired ?? false,
            tempToken: data.tempToken ?? t2fa.tempToken ?? '',
            qrCode: data.qrCode ?? t2fa.qrCode,
            secret: data.secret ?? t2fa.secret,
            backupCodes: data.backupCodes ?? t2fa.backupCodes
          });
        } else {
          navigate(from, { replace: true });
        }
      },
    }
  );

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    await doLogin();
  }, [validateForm, doLogin]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    setFieldErrors(prev => {
      const field = name as keyof FieldErrors;
      if (field !== 'email' && field !== 'password') return prev;
      
      const hasError = field === 'email' ? !!prev.email : !!prev.password;
      if (!hasError) return prev;
      
      const next = { ...prev };
      if (field === 'email') {
        delete next.email;
      } else {
        delete next.password;
      }
      return next;
    });
  }, []);

  const handleVerify2fa = async (e: FormEvent) => {
    e.preventDefault();
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const payload: any = {
        tempToken: twoFactorData?.tempToken,
      };
      if (!otpCode.trim()) {
        throw new Error('Verification code is required');
      }
      payload.code = otpCode.trim();

      const res = await fetch('/api/v1/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractErrorMessage(data, 'Failed to verify 2FA code'));
      }

      if (data.token) {
        localStorage.setItem('stopshop_admin_token', data.token);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed');
    } finally {
      setIsVerifyingOtp(false);
    }
  };



  // ── Styles ────────────────────────────────────────────────────

  const inputCls = (field: keyof FieldErrors) => {
    const hasError = field === 'email' ? !!fieldErrors.email : field === 'password' ? !!fieldErrors.password : false;
    return `w-full border-b-2 py-3 text-sm font-bold bg-transparent outline-none transition-all placeholder:text-gray-300 ${
      hasError ? 'border-red-400 text-red-900' : 'border-gray-100 focus:border-cardinal'
    }`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">

        {/* Brand Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-5xl font-black uppercase italic tracking-tighter text-cardinal">
            Stop & Shop
          </h1>
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <Shield size={14} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Admin Control Center</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-[4px] border border-[#EAEAEA] bg-white p-10 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
          
          {!twoFactorData ? (
            <>
              <h2 className="mb-8 text-2xl font-black uppercase tracking-tighter text-gray-900">
                Sign In
              </h2>

              {/* Global error — always surfaced */}
              {loginError && (
                <div className="mb-6 flex items-start space-x-3 rounded-[4px] border border-red-100 bg-red-50 p-4">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
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
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
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
                  className="border-gray-250/20 flex w-full items-center justify-center space-x-3 rounded-[4px] border bg-cardinal py-4 text-xs font-black uppercase tracking-[0.3em] text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
            </>
          ) : (
            // ── 2FA View ──────────────────────────────────────────────
            <div>
              <div className="mb-6 flex items-center space-x-3">
                <div className="bg-cardinal/10 flex h-8 w-8 items-center justify-center rounded-[4px] text-cardinal">
                  <Key size={16} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900">
                  Security Verification
                </h2>
              </div>

              {otpError && (
                <div className="mb-6 flex items-start space-x-3 rounded-[4px] border border-red-100 bg-red-50 p-4">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
                  <p className="text-xs font-bold text-red-700">{otpError}</p>
                </div>
              )}

              <form onSubmit={handleVerify2fa} className="space-y-6">
                <p className="text-xs font-bold leading-relaxed text-gray-500">
                  Enter the 6-digit verification code sent to your admin email address.
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    pattern="\d*"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full border-b-2 border-gray-100 bg-transparent py-3 text-center font-mono text-lg font-bold tracking-[0.5em] outline-none placeholder:text-gray-200 focus:border-cardinal"
                    placeholder="000000"
                    disabled={isVerifyingOtp}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="flex w-full items-center justify-center space-x-3 rounded-[4px] bg-cardinal py-4 text-xs font-black uppercase tracking-[0.3em] text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
                >
                  {isVerifyingOtp ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Shield size={14} />
                      <span>Verify Identity</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorData(null);
                    setOtpCode('');
                    setOtpError('');
                  }}
                  className="w-full rounded-[4px] border bg-gray-50 py-2 text-[10px] font-black uppercase tracking-widest text-gray-700 transition-colors hover:bg-gray-100"
                >
                  Back to Login
                </button>
              </form>
            </div>
          )}

          {/* Security note */}
          <p className="mt-8 text-center text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">
            256-bit SSL · Session expires in 15 minutes
          </p>
        </div>

        {/* Version */}
        <p className="mt-8 text-center text-[8px] font-black uppercase tracking-[0.5em] text-gray-300">
          Gujarat Edition · 2026
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
