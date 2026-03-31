/**
 * @fileoverview Currency Context
 * Applies: react-patterns (stable callbacks, memoization, typed),
 *          typescript-expert (const assertions, JSDoc types),
 *          javascript-mastery (nullish coalescing, optional chaining)
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useUtils.js';

// ─────────────────────────────────────────────────────────────────
// CURRENCY CONFIG (Relative to PKR base)
// ─────────────────────────────────────────────────────────────────

export const CURRENCIES = Object.freeze({
  PKR: { symbol: 'Rs.', label: 'PKR', locale: 'ur-PK' },
  USD: { symbol: '$', label: 'USD', locale: 'en-US' },
  EUR: { symbol: '€', label: 'EUR', locale: 'de-DE' },
  GBP: { symbol: '£', label: 'GBP', locale: 'en-GB' },
});

const VALID_CURRENCIES = Object.keys(CURRENCIES);
const STORAGE_KEY = 'stopshop-currency';
const RATES_CACHE_KEY = 'stopshop-rates-cache';
const DEFAULT_CURRENCY = 'PKR';

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [stored, setStored] = useLocalStorage(STORAGE_KEY, DEFAULT_CURRENCY);
  const [currency, setCurrencyState] = useState(
    VALID_CURRENCIES.includes(stored) ? stored : DEFAULT_CURRENCY
  );

  // Default rates if API fails (approximate)
  const [rates, setRates] = useState({
    PKR: 1,
    USD: 0.0036, // 1 PKR = 0.0036 USD (~278 PKR/USD)
    EUR: 0.0033,
    GBP: 0.0028,
  });

  const [loading, setLoading] = useState(true);

  // Fetch live rates once per session based on PKR as base
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Try session storage first to minimize API hits
        const cached = sessionStorage.getItem(RATES_CACHE_KEY);
        if (cached) {
          setRates(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const response = await fetch('https://open.er-api.com/v6/latest/PKR');
        const data = await response.json();

        if (data.result === 'success' && data.rates) {
          const newRates = {
            PKR: 1,
            USD: data.rates.USD || 0.0036,
            EUR: data.rates.EUR || 0.0033,
            GBP: data.rates.GBP || 0.0028,
          };
          setRates(newRates);
          sessionStorage.setItem(RATES_CACHE_KEY, JSON.stringify(newRates));
          console.log('[Currency] Live rates loaded (Base: PKR):', newRates);
        }
      } catch (err) {
        console.error('[Currency] Failed to fetch live rates:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const changeCurrency = useCallback((code) => {
    if (!VALID_CURRENCIES.includes(code)) return;
    setCurrencyState(code);
    setStored(code);
  }, [setStored]);

  const formatPrice = useCallback((priceInPKR) => {
    const rate = rates[currency] || 1;
    const config = CURRENCIES[currency];
    const converted = (priceInPKR ?? 0) * rate;

    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(converted);
  }, [currency, rates]);

  const convertPrice = useCallback((priceInPKR) => {
    const rate = rates[currency] || 1;
    return (priceInPKR ?? 0) * rate;
  }, [currency, rates]);

  const value = useMemo(() => ({
    currency,
    setCurrency: changeCurrency,
    formatPrice,
    convertPrice,
    CURRENCIES,
    rates,
    loadingRates: loading,
    currencyConfig: CURRENCIES[currency],
  }), [currency, rates, loading, changeCurrency, formatPrice, convertPrice]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
};
