/**
 * @fileoverview CustomerContext.jsx
 * Global customer authentication state.
 * Completely separate from admin auth — uses /api/customer/* endpoints.
 * Token stored in localStorage as 'customer_token'.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import { apiUrl } from '../config/api.js';

const STORAGE_KEY = 'customer_token';

// ─────────────────────────────────────────────────────────────────
// REDUCER
// ─────────────────────────────────────────────────────────────────

const ACTIONS = {
  SET_CUSTOMER: 'SET_CUSTOMER',
  LOGOUT:       'LOGOUT',
  SET_LOADING:  'SET_LOADING',
  SET_ERROR:    'SET_ERROR',
};

const initialState = {
  customer: null,   // { _id, name, email, phone, address, city, zip }
  token:    null,
  loading:  false,
  error:    null,
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CUSTOMER:
      return { ...state, customer: action.customer, token: action.token, loading: false, error: null };
    case ACTIONS.LOGOUT:
      return { ...initialState };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.loading, error: null };
    case ACTIONS.SET_ERROR:
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────

const CustomerContext = createContext(null);

export const CustomerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Restore session on mount ──────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return;

    fetch(apiUrl('/api/customer/profile'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(customer => {
        if (customer) {
          dispatch({ type: ACTIONS.SET_CUSTOMER, customer, token });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => localStorage.removeItem(STORAGE_KEY));
  }, []);

  // ── Register ──────────────────────────────────────────────────
  const register = useCallback(async ({ name, email, password, phone }) => {
    dispatch({ type: ACTIONS.SET_LOADING, loading: true });
    try {
      const res = await fetch(apiUrl('/api/customer/register'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Registration failed');

      localStorage.setItem(STORAGE_KEY, data.token);
      dispatch({ type: ACTIONS.SET_CUSTOMER, customer: data.customer, token: data.token });
      return data;
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, error: err.message });
      throw err;
    }
  }, []);

  // ── Login ─────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    dispatch({ type: ACTIONS.SET_LOADING, loading: true });
    try {
      const res = await fetch(apiUrl('/api/customer/login'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Login failed');

      localStorage.setItem(STORAGE_KEY, data.token);
      dispatch({ type: ACTIONS.SET_CUSTOMER, customer: data.customer, token: data.token });
      return data;
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, error: err.message });
      throw err;
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: ACTIONS.LOGOUT });
  }, []);

  // ── Update profile ────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/customer/profile'), {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Update failed');
      dispatch({ type: ACTIONS.SET_CUSTOMER, customer: data, token });
      return data;
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, error: err.message });
      throw err;
    }
  }, []);

  // ── Fetch customer orders ─────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return [];
    const res = await fetch(apiUrl('/api/customer/orders'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
  }, []);

  const value = useMemo(() => ({
    customer:      state.customer,
    token:         state.token,
    loading:       state.loading,
    error:         state.error,
    isLoggedIn:    !!state.customer,
    register,
    login,
    logout,
    updateProfile,
    fetchOrders,
  }), [state, register, login, logout, updateProfile, fetchOrders]);

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
};