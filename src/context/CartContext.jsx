/**
 * @fileoverview Cart Context — refactored with useReducer
 * Applies: react-patterns (useReducer for complex state, stable callbacks),
 *          javascript-mastery (pure functions, immutability, switch/case),
 *          react-ui-patterns (predictable state transitions)
 */

import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useUtils.js';

// ─────────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────────

const CART_STORAGE_KEY = 'stopshop-cart';

const ActionTypes = Object.freeze({
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  SET_ITEM_OPTIONS: 'SET_ITEM_OPTIONS',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_FROM_STORAGE: 'LOAD_FROM_STORAGE',
  OPEN_DRAWER: 'OPEN_DRAWER',
  CLOSE_DRAWER: 'CLOSE_DRAWER',
  SET_BUCKET: 'SET_BUCKET',
  SET_SUB: 'SET_SUB',
  SET_SORT: 'SET_SORT',
});

// ─────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────

const initialState = {
  // Cart items
  cartItems: [],
  // UI state
  isDrawerOpen: false,
  drawerMode: 'cart',       // 'cart' | 'product' | 'wishlist'
  selectedProduct: null,
  // Filter/sort state
  activeBucket: 'All',
  activeSub: null,
  lastViewedBucket: 'Tops',
  sortBy: 'featured',
  // Scroll trigger counter (increment to scroll grid into view)
  scrollGridTick: 0,
  // Animation
  shakeCount: 0,
};

// ─────────────────────────────────────────────────────────────────
// PURE REDUCER — all state transitions in one place
// ─────────────────────────────────────────────────────────────────

/**
 * Find cart item index by composite key (id + color + size) or cartId.
 * @param {Array} items
 * @param {Object} params
 * @returns {number}
 */
const findItemIndex = (items, { id, activeColor, selectedSize, cartId }) => {
  if (cartId) return items.findIndex(item => item.cartId === cartId);
  return items.findIndex(
    item => item.id === id && item.activeColor === activeColor && item.selectedSize === selectedSize
  );
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.LOAD_FROM_STORAGE:
      return { ...state, cartItems: action.payload ?? [] };

    case ActionTypes.ADD_ITEM: {
      const { product } = action.payload;
      const existingIdx = findItemIndex(state.cartItems, {
        id: product.id,
        activeColor: product.activeColor,
        selectedSize: product.selectedSize,
      });

      const updatedItems = existingIdx > -1
        ? state.cartItems.map((item, i) =>
            i === existingIdx
              ? { ...item, quantity: (item.quantity ?? 1) + 1 }
              : item
          )
        : [...state.cartItems, { ...product, quantity: 1, cartId: Date.now() }];

      return {
        ...state,
        cartItems: updatedItems,
        shakeCount: state.shakeCount + 1,
      };
    }

    case ActionTypes.REMOVE_ITEM: {
      const idx = findItemIndex(state.cartItems, action.payload);
      if (idx === -1) return state;
      return {
        ...state,
        cartItems: state.cartItems.filter((_, i) => i !== idx),
      };
    }

    case ActionTypes.UPDATE_QUANTITY: {
      const { delta, ...key } = action.payload;
      const idx = findItemIndex(state.cartItems, key);
      if (idx === -1) return state;

      const current = state.cartItems[idx];
      const newQty = (current.quantity ?? 1) + delta;

      // Remove if quantity drops to 0
      if (newQty <= 0) {
        return {
          ...state,
          cartItems: state.cartItems.filter((_, i) => i !== idx),
        };
      }

      return {
        ...state,
        cartItems: state.cartItems.map((item, i) =>
          i === idx ? { ...item, quantity: newQty } : item
        ),
      };
    }

    case ActionTypes.SET_ITEM_OPTIONS: {
      const { cartId, activeColor, selectedSize } = action.payload;
      return {
        ...state,
        cartItems: state.cartItems.map(item =>
          item.cartId === cartId
            ? {
                ...item,
                activeColor: activeColor ?? item.activeColor,
                selectedSize: selectedSize ?? item.selectedSize,
              }
            : item
        ),
      };
    }

    case ActionTypes.CLEAR_CART:
      return { ...state, cartItems: [] };

    case ActionTypes.OPEN_DRAWER:
      return {
        ...state,
        isDrawerOpen: true,
        drawerMode: action.payload.mode,
        selectedProduct: action.payload.product ?? null,
      };

    case ActionTypes.CLOSE_DRAWER:
      return { ...state, isDrawerOpen: false };

    case ActionTypes.SET_BUCKET:
      return {
        ...state,
        activeBucket: typeof action.payload === 'object' ? action.payload.bucket : action.payload,
        activeSub: typeof action.payload === 'object' ? action.payload.sub : null,
        scrollGridTick: state.scrollGridTick + 1,
      };

    case ActionTypes.SET_SUB:
      return {
        ...state,
        activeSub: action.payload,
        scrollGridTick: state.scrollGridTick + 1,
      };

    case ActionTypes.SET_SORT:
      return { ...state, sortBy: action.payload };

    default:
      return state;
  }
};

// ─────────────────────────────────────────────────────────────────
// CONTEXT & PROVIDER
// ─────────────────────────────────────────────────────────────────

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [storedCart, setStoredCart] = useLocalStorage(CART_STORAGE_KEY, []);

  // Hydrate cart from localStorage on mount
  useEffect(() => {
    dispatch({ type: ActionTypes.LOAD_FROM_STORAGE, payload: storedCart });
  }, []);  

  // Persist cart to localStorage on changes
  useEffect(() => {
    setStoredCart(state.cartItems);
  }, [state.cartItems, setStoredCart]);

  // ── DERIVED STATE ──────────────────────────────────────────────

  const cartCount = useMemo(
    () => state.cartItems.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
    [state.cartItems]
  );

  const total = useMemo(
    () => state.cartItems.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0),
    [state.cartItems]
  );

  // ── STABLE ACTION CREATORS ─────────────────────────────────────

  const addToCart = useCallback(
    (product) => dispatch({ type: ActionTypes.ADD_ITEM, payload: { product } }),
    []
  );

  const removeFromCart = useCallback(
    (id, activeColor, selectedSize, cartId = null) =>
      dispatch({ type: ActionTypes.REMOVE_ITEM, payload: { id, activeColor, selectedSize, cartId } }),
    []
  );

  const updateQuantity = useCallback(
    (id, activeColor, selectedSize, delta, cartId = null) =>
      dispatch({ type: ActionTypes.UPDATE_QUANTITY, payload: { id, activeColor, selectedSize, delta, cartId } }),
    []
  );

  const setCartItemOptions = useCallback(
    (cartId, activeColor, selectedSize) =>
      dispatch({ type: ActionTypes.SET_ITEM_OPTIONS, payload: { cartId, activeColor, selectedSize } }),
    []
  );

  const clearCart = useCallback(
    () => dispatch({ type: ActionTypes.CLEAR_CART }),
    []
  );

  const openDrawer = useCallback(
    (mode, product = null) =>
      dispatch({ type: ActionTypes.OPEN_DRAWER, payload: { mode, product } }),
    []
  );

  const closeDrawer = useCallback(
    () => dispatch({ type: ActionTypes.CLOSE_DRAWER }),
    []
  );

  const setActiveBucket = useCallback(
    (bucket, sub = null) => dispatch({ type: ActionTypes.SET_BUCKET, payload: { bucket, sub } }),
    []
  );

  const setActiveSub = useCallback(
    (sub) => dispatch({ type: ActionTypes.SET_SUB, payload: sub }),
    []
  );

  const setSortBy = useCallback(
    (sort) => dispatch({ type: ActionTypes.SET_SORT, payload: sort }),
    []
  );

  // ── CONTEXT VALUE ──────────────────────────────────────────────

  const value = useMemo(() => ({
    // State
    cartItems: state.cartItems,
    cartCount,
    total,
    isDrawerOpen: state.isDrawerOpen,
    drawerMode: state.drawerMode,
    selectedProduct: state.selectedProduct,
    activeBucket: state.activeBucket,
    activeSub: state.activeSub,
    lastViewedBucket: state.lastViewedBucket,
    sortBy: state.sortBy,
    shouldScrollGrid: state.scrollGridTick,
    isBouncing: state.shakeCount > 0,
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    setCartItemOptions,
    clearCart,
    openDrawer,
    closeDrawer,
    setActiveBucket,
    setActiveSub,
    setLastViewedBucket: (b) => dispatch({ type: ActionTypes.SET_BUCKET, payload: b }),
    setSortBy,
  }), [state, cartCount, total, addToCart, removeFromCart, updateQuantity,
      setCartItemOptions, clearCart, openDrawer, closeDrawer,
      setActiveBucket, setActiveSub, setSortBy]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export default CartContext;
