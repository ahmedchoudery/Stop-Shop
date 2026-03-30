/**
 * @fileoverview Currency Context
 * Applies: react-patterns (stable callbacks, memoization, typed),
 *          typescript-expert (const assertions, JSDoc types),
 *          javascript-mastery (nullish coalescing, optional chaining)
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useUtils.js';

// ─────────────────────────────────────────────────────────────────
// CURRENCY CONFIG (const assertion for type safety)
// ─────────────────────────────────────────────────────────────────

/** @type {Record<string, { symbol: string, rate: number, label: string, locale: string }>} */
export const CURRENCIES = Object.freeze({
  USD: { symbol: '$', rate: 1, label: 'USD', locale: 'en-US' },
  PKR: { symbol: 'Rs.', rate: 280, label: 'PKR', locale: 'ur-PK' },
  EUR: { symbol: '€', rate: 0.92, label: 'EUR', locale: 'de-DE' },
  GBP: { symbol: '£', rate: 0.79, label: 'GBP', locale: 'en-GB' },
});

const VALID_CURRENCIES = Object.keys(CURRENCIES);
const STORAGE_KEY = 'stopshop-currency';
const DEFAULT_CURRENCY = 'USD';

// ─────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [stored, setStored] = useLocalStorage(STORAGE_KEY, DEFAULT_CURRENCY);

  // Validate stored value — fall back to USD if invalid
  const [currency, setCurrencyState] = useState(
    VALID_CURRENCIES.includes(stored) ? stored : DEFAULT_CURRENCY
  );

  const changeCurrency = useCallback((code) => {
    if (!VALID_CURRENCIES.includes(code)) {
      console.warn(`[Currency] Unknown currency code: ${code}`);
      return;
    }
    setCurrencyState(code);
    setStored(code);
  }, [setStored]);

  /**
   * Format a USD price in the selected currency.
   * Uses Intl.NumberFormat for locale-aware formatting.
   *
   * @param {number} priceInUSD
   * @returns {string}
   */
  const formatPrice = useCallback((priceInUSD) => {
    const config = CURRENCIES[currency];
    const converted = (priceInUSD ?? 0) * config.rate;

    const formatted = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(converted);

    return `${config.symbol}${formatted}`;
  }, [currency]);

  /**
   * Convert a USD price to current currency (raw number, no formatting).
   * @param {number} priceInUSD
   * @returns {number}
   */
  const convertPrice = useCallback((priceInUSD) => {
    return (priceInUSD ?? 0) * CURRENCIES[currency].rate;
  }, [currency]);

  const value = useMemo(() => ({
    currency,
    setCurrency: changeCurrency,
    formatPrice,
    convertPrice,
    CURRENCIES,
    currencyConfig: CURRENCIES[currency],
  }), [currency, changeCurrency, formatPrice, convertPrice]);

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