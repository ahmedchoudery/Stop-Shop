import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartLogicContext = createContext();
const CART_STORAGE_KEY = 'stopshop-cart';

export const CartLogicProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    } catch (err) {
      console.warn('Failed to parse cart from localStorage', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (err) {
      console.warn('Failed to persist cart in localStorage', err);
    }
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.id === product.id && item.activeColor === product.activeColor && item.selectedSize === product.selectedSize
      );

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: (newItems[existingItemIndex].quantity || 1) + 1,
        };
        return newItems;
      } else {
        return [...prevItems, { ...product, quantity: 1, cartId: Date.now() }];
      }
    });
  };

  const removeFromCart = (id, activeColor, selectedSize, cartId = null) => {
    setCartItems((prevItems) => 
      prevItems.filter((item) => {
        if (cartId) return item.cartId !== cartId;
        return !(item.id === id && item.activeColor === activeColor && item.selectedSize === selectedSize);
      })
    );
  };

  const updateQuantity = (id, activeColor, selectedSize, delta, cartId = null) => {
    setCartItems((prevItems) => {
      const existingItemIndex = cartId
        ? prevItems.findIndex((item) => item.cartId === cartId)
        : prevItems.findIndex((item) => item.id === id && item.activeColor === activeColor && item.selectedSize === selectedSize);

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        const currentQty = newItems[existingItemIndex].quantity || 1;
        const newQty = currentQty + delta;

        if (newQty <= 0) {
          return prevItems.filter((_, index) => index !== existingItemIndex);
        } else {
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newQty,
          };
          return newItems;
        }
      }
      return prevItems;
    });
  };

  const setCartItemOptions = (cartId, updatedColor, updatedSize) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.cartId === cartId) {
          return {
            ...item,
            activeColor: updatedColor || item.activeColor,
            selectedSize: updatedSize || item.selectedSize,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = useMemo(() => 
    cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0), 
    [cartItems]
  );

  const total = useMemo(() => 
    cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0), 
    [cartItems]
  );

  const value = {
    cartItems,
    cartCount,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    setCartItemOptions,
    clearCart,
  };

  return (
    <CartLogicContext.Provider value={value}>
      {children}
    </CartLogicContext.Provider>
  );
};

export const useCartLogic = () => {
  const context = useContext(CartLogicContext);
  if (!context) {
    throw new Error('useCartLogic must be used within a CartLogicProvider');
  }
  return context;
};

export default CartLogicContext;
