/**
 * @fileoverview Wishlist Context
 * Applies: react-patterns (useReducer, stable callbacks, proper memoization),
 *          javascript-mastery (pure functions, immutability)
 */

import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useUtils.js';

// ─────────────────────────────────────────────────────────────────
// REDUCER
// ─────────────────────────────────────────────────────────────────

const ACTIONS = Object.freeze({
  TOGGLE: 'TOGGLE',
  CLEAR: 'CLEAR',
  LOAD: 'LOAD',
});

/**
 * Pure wishlist reducer
 * @param {Array} state
 * @param {{ type: string, payload?: any }} action
 * @returns {Array}
 */
const wishlistReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.LOAD:
      return Array.isArray(action.payload) ? action.payload : state;

    case ACTIONS.TOGGLE: {
      const product = action.payload;
      const exists = state.some(p => p.id === product.id);
      return exists
        ? state.filter(p => p.id !== product.id)
        : [...state, product];
    }

    case ACTIONS.CLEAR:
      return [];

    default:
      return state;
  }
};

// ─────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [storedWishlist, setStoredWishlist] = useLocalStorage('stopshop_wishlist', []);
  const [wishlist, dispatch] = useReducer(wishlistReducer, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    dispatch({ type: ACTIONS.LOAD, payload: storedWishlist });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to localStorage on change
  useEffect(() => {
    setStoredWishlist(wishlist);
  }, [wishlist, setStoredWishlist]);

  // ── Stable action creators ───────────────────────────────────

  const toggleWishlist = useCallback(
    (product) => dispatch({ type: ACTIONS.TOGGLE, payload: product }),
    []
  );

  const clearWishlist = useCallback(
    () => dispatch({ type: ACTIONS.CLEAR }),
    []
  );

  const isWishlisted = useCallback(
    (id) => wishlist.some(p => p.id === id),
    [wishlist]
  );

  // ── Memoized context value ────────────────────────────────────

  const value = useMemo(() => ({
    wishlist,
    wishlistCount: wishlist.length,
    toggleWishlist,
    clearWishlist,
    isWishlisted,
  }), [wishlist, toggleWishlist, clearWishlist, isWishlisted]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};