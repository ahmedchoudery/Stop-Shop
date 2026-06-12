/**
 * @fileoverview Cart Context in strict TypeScript.
 * Applies: react-patterns (useReducer for complex state, stable callbacks),
 *          react-state-management (type-safe global state context, derived state memoization),
 *          javascript-mastery (pure functions, immutability, switch/case)
 */

import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useUtils.js';
import { CartItem, Product } from '../types/index.ts';

// ─────────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────────

const CART_STORAGE_KEY = 'stopshop-cart';

export interface CartState {
  cartItems: CartItem[];
  isDrawerOpen: boolean;
  drawerMode: 'cart' | 'product' | 'wishlist';
  selectedProduct: Product | null;
  activeBucket: string;
  activeSub: string | null;
  lastViewedBucket: string;
  sortBy: string;
  scrollGridTick: number;
  shakeCount: number;
}

export type CartAction =
  | { type: 'LOAD_FROM_STORAGE'; payload: CartItem[] }
  | { type: 'SYNC_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: { product: CartItem } }
  | { type: 'REMOVE_ITEM'; payload: { id: string; activeColor?: string; selectedSize?: string; cartId?: number | null } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; activeColor?: string; selectedSize?: string; delta: number; cartId?: number | null } }
  | { type: 'SET_ITEM_OPTIONS'; payload: { cartId: number; activeColor?: string; selectedSize?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'OPEN_DRAWER'; payload: { mode: 'cart' | 'product' | 'wishlist'; product?: Product | null } }
  | { type: 'CLOSE_DRAWER' }
  | { type: 'SET_BUCKET'; payload: string | { bucket: string; sub: string | null } }
  | { type: 'SET_SUB'; payload: string | null }
  | { type: 'SET_SORT'; payload: string };

// ─────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────

const initialState: CartState = {
  cartItems: [],
  isDrawerOpen: false,
  drawerMode: 'cart',
  selectedProduct: null,
  activeBucket: 'All',
  activeSub: null,
  lastViewedBucket: 'Tops',
  sortBy: 'featured',
  scrollGridTick: 0,
  shakeCount: 0,
};

// ─────────────────────────────────────────────────────────────────
// PURE REDUCER — all state transitions in one place
// ─────────────────────────────────────────────────────────────────

interface ItemKeyParams {
  id: string;
  activeColor?: string;
  selectedSize?: string;
  cartId?: number | null;
}

const findItemIndex = (items: CartItem[], { id, activeColor, selectedSize, cartId }: ItemKeyParams): number => {
  if (cartId) return items.findIndex(item => item.cartId === cartId);
  return items.findIndex(
    item => item.id === id && item.activeColor === activeColor && item.selectedSize === selectedSize
  );
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'LOAD_FROM_STORAGE':
      return { ...state, cartItems: action.payload ?? [] };

    case 'SYNC_CART':
      return { ...state, cartItems: action.payload };

    case 'ADD_ITEM': {
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

    case 'REMOVE_ITEM': {
      const idx = findItemIndex(state.cartItems, action.payload);
      if (idx === -1) return state;
      return {
        ...state,
        cartItems: state.cartItems.filter((_, i) => i !== idx),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { delta, ...key } = action.payload;
      const idx = findItemIndex(state.cartItems, key);
      if (idx === -1) return state;

      const current = state.cartItems[idx];
      const newQty = (current.quantity ?? 1) + delta;

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

    case 'SET_ITEM_OPTIONS': {
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

    case 'CLEAR_CART':
      return { ...state, cartItems: [] };

    case 'OPEN_DRAWER':
      return {
        ...state,
        isDrawerOpen: true,
        drawerMode: action.payload.mode,
        selectedProduct: action.payload.product ?? null,
      };

    case 'CLOSE_DRAWER':
      return { ...state, isDrawerOpen: false };

    case 'SET_BUCKET':
      return {
        ...state,
        activeBucket: typeof action.payload === 'object' ? action.payload.bucket : action.payload,
        activeSub: typeof action.payload === 'object' ? action.payload.sub : null,
        scrollGridTick: state.scrollGridTick + 1,
      };

    case 'SET_SUB':
      return {
        ...state,
        activeSub: action.payload,
        scrollGridTick: state.scrollGridTick + 1,
      };

    case 'SET_SORT':
      return { ...state, sortBy: action.payload };

    default:
      return state;
  }
};

// ─────────────────────────────────────────────────────────────────
// CONTEXT & PROVIDER
// ─────────────────────────────────────────────────────────────────

export interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  total: number;
  isDrawerOpen: boolean;
  drawerMode: 'cart' | 'product' | 'wishlist';
  selectedProduct: Product | null;
  activeBucket: string;
  activeSub: string | null;
  lastViewedBucket: string;
  sortBy: string;
  shouldScrollGrid: number;
  isBouncing: boolean;
  addToCart: (product: CartItem) => void;
  removeFromCart: (id: string, activeColor: string | undefined, selectedSize: string | undefined, cartId?: number | null) => void;
  updateQuantity: (id: string, activeColor: string | undefined, selectedSize: string | undefined, delta: number, cartId?: number | null) => void;
  setCartItemOptions: (cartId: number, activeColor?: string, selectedSize?: string) => void;
  clearCart: () => void;
  openDrawer: (mode: 'cart' | 'product' | 'wishlist', product?: Product | null) => void;
  closeDrawer: () => void;
  setActiveBucket: (bucket: string | { bucket: string; sub: string | null }, sub?: string | null) => void;
  setActiveSub: (sub: string | null) => void;
  setLastViewedBucket: (b: string | { bucket: string; sub: string | null }) => void;
  setSortBy: (sort: string) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [storedCart, setStoredCart] = useLocalStorage<CartItem[]>(CART_STORAGE_KEY, []);

  // Hydrate cart from localStorage on mount
  useEffect(() => {
    dispatch({ type: 'LOAD_FROM_STORAGE', payload: storedCart });
  }, []);  

  const syncAttempted = useRef(false);

  // Synchronize cart items with the database on mount
  useEffect(() => {
    if (state.cartItems.length === 0 || syncAttempted.current) return;
    syncAttempted.current = true;

    let active = true;
    const syncCartWithDb = async () => {
      try {
        const res = await fetch(`/api/public/products?_t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        const dbProducts: Product[] = Array.isArray(data) ? data : (data.products ?? []);

        if (!active) return;

        let changed = false;
        const syncedItems = state.cartItems.reduce((acc: CartItem[], item) => {
          const dbProd = dbProducts.find(p => p.id === item.id);
          if (!dbProd) {
            // Product deleted from database, remove from cart
            changed = true;
            return acc;
          }

          // Calculate available stock
          let availableStock = dbProd.quantity ?? 0;
          const size = (item.selectedSize ?? '').trim();
          if (size && dbProd.sizeStock) {
            const sizeStockObj = dbProd.sizeStock instanceof Map
              ? Object.fromEntries(dbProd.sizeStock)
              : dbProd.sizeStock;
            availableStock = sizeStockObj[size] ?? 0;
          }

          if (availableStock <= 0) {
            // No stock left, remove from cart
            changed = true;
            return acc;
          }

          const targetQty = Math.min(item.quantity ?? 1, availableStock);
          if (targetQty !== item.quantity) {
            changed = true;
          }

          const discount = dbProd.discount ?? 0;
          // Check for price, discount, name, image changes
          if (
            item.price !== dbProd.price ||
            item.discount !== discount ||
            item.name !== dbProd.name ||
            item.image !== dbProd.image
          ) {
            changed = true;
          }

          acc.push({
            ...item,
            name: dbProd.name,
            price: dbProd.price,
            discount: discount,
            image: dbProd.image ?? '',
            quantity: targetQty,
          });

          return acc;
        }, []);

        if (changed) {
          dispatch({ type: 'SYNC_CART', payload: syncedItems });
        }
      } catch (err) {
        console.error('[CartSync] Failed to sync cart items:', err);
      }
    };

    // Delay slightly to ensure hydration is completed
    const timer = setTimeout(syncCartWithDb, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [state.cartItems.length]);

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
    () => state.cartItems.reduce((sum, item) => {
      const discount = item.discount ?? 0;
      const finalPrice = discount > 0 ? item.price * (1 - discount / 100) : item.price;
      return sum + finalPrice * (item.quantity ?? 1);
    }, 0),
    [state.cartItems]
  );

  // ── STABLE ACTION CREATORS ─────────────────────────────────────

  const addToCart = useCallback(
    (product: CartItem) => dispatch({ type: 'ADD_ITEM', payload: { product } }),
    []
  );

  const removeFromCart = useCallback(
    (id: string, activeColor: string | undefined, selectedSize: string | undefined, cartId: number | null = null) =>
      dispatch({ type: 'REMOVE_ITEM', payload: { id, activeColor, selectedSize, cartId } }),
    []
  );

  const updateQuantity = useCallback(
    (id: string, activeColor: string | undefined, selectedSize: string | undefined, delta: number, cartId: number | null = null) =>
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, activeColor, selectedSize, delta, cartId } }),
    []
  );

  const setCartItemOptions = useCallback(
    (cartId: number, activeColor?: string, selectedSize?: string) =>
      dispatch({ type: 'SET_ITEM_OPTIONS', payload: { cartId, activeColor, selectedSize } }),
    []
  );

  const clearCart = useCallback(
    () => dispatch({ type: 'CLEAR_CART' }),
    []
  );

  const openDrawer = useCallback(
    (mode: 'cart' | 'product' | 'wishlist', product: Product | null = null) =>
      dispatch({ type: 'OPEN_DRAWER', payload: { mode, product } }),
    []
  );

  const closeDrawer = useCallback(
    () => dispatch({ type: 'CLOSE_DRAWER' }),
    []
  );

  const setActiveBucket = useCallback(
    (bucket: string | { bucket: string; sub: string | null }, sub: string | null = null) => {
      const payload = typeof bucket === 'string' ? { bucket, sub } : bucket;
      dispatch({ type: 'SET_BUCKET', payload });
    },
    []
  );

  const setActiveSub = useCallback(
    (sub: string | null) => dispatch({ type: 'SET_SUB', payload: sub }),
    []
  );

  const setLastViewedBucket = useCallback(
    (b: string | { bucket: string; sub: string | null }) => dispatch({ type: 'SET_BUCKET', payload: b }),
    []
  );

  const setSortBy = useCallback(
    (sort: string) => dispatch({ type: 'SET_SORT', payload: sort }),
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
    setLastViewedBucket,
    setSortBy,
  }), [state, cartCount, total, addToCart, removeFromCart, updateQuantity,
      setCartItemOptions, clearCart, openDrawer, closeDrawer,
      setActiveBucket, setActiveSub, setLastViewedBucket, setSortBy]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export default CartContext;
