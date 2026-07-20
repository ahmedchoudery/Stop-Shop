import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart } from 'lucide-react';
import { useLocalStorage } from '../hooks/useUtils.js';
import { useCustomer } from './CustomerContext.jsx';

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
  const { isLoggedIn, token } = useCustomer();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Sync wishlist from server when logged in, or local storage when logged out
  useEffect(() => {
    if (isLoggedIn && token) {
      fetch('/api/customer/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (Array.isArray(data)) {
            dispatch({ type: ACTIONS.LOAD, payload: data });
          }
        })
        .catch(err => console.error('[Wishlist Sync] Failed to fetch:', err));
    } else {
      dispatch({ type: ACTIONS.LOAD, payload: storedWishlist });
    }
  }, [isLoggedIn, token]);

  // Sync state to local storage ONLY when logged out
  useEffect(() => {
    if (!isLoggedIn) {
      setStoredWishlist(wishlist);
    }
  }, [wishlist, isLoggedIn, setStoredWishlist]);

  // ── Stable action creators ───────────────────────────────────

  const toggleWishlist = useCallback(
    (product) => {
      if (!isLoggedIn) {
        setShowLoginPrompt(true);
        return;
      }

      // Optimistic local update
      dispatch({ type: ACTIONS.TOGGLE, payload: product });

      // Persist to server
      fetch('/api/customer/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product.id })
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (Array.isArray(data)) {
            dispatch({ type: ACTIONS.LOAD, payload: data });
          }
        })
        .catch(err => console.error('[Wishlist Sync] Toggle failed:', err));
    },
    [isLoggedIn, token]
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

      {/* Login Prompt Modal */}
      {showLoginPrompt && createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowLoginPrompt(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-[#FAF9F6] rounded-[4px] border border-gray-200/80 shadow-2xl z-10 w-full max-w-sm p-6 text-center animate-scale-in">
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-black rounded-[4px] transition-colors focus:outline-none"
            >
              <X size={18} />
            </button>

            <div className="mb-6 mt-2">
              <div className="w-12 h-12 bg-cardinal/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-cardinal/10">
                <Heart size={20} className="text-cardinal fill-cardinal/20 animate-pulse" />
              </div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-cardinal mb-1">Wishlist</p>
              <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">
                Save Your Favorite Pieces
              </h4>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-2.5 leading-relaxed">
                Please log in or create an account to save items to your personal wishlist.
              </p>
            </div>

            <div className="space-y-2.5">
              <a
                href="/account/login"
                onClick={() => setShowLoginPrompt(false)}
                className="block w-full bg-gray-900 text-white hover:bg-cardinal py-3.5 text-[9px] font-black uppercase tracking-[0.25em] transition-all duration-300 rounded-[4px] text-center"
              >
                Sign In
              </a>
              <a
                href="/account/login?tab=register"
                onClick={() => setShowLoginPrompt(false)}
                className="block w-full border border-gray-200 text-gray-600 hover:border-gray-900 py-3.5 text-[9px] font-black uppercase tracking-[0.25em] transition-all duration-300 rounded-[4px] bg-white text-center"
              >
                Create Account
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
