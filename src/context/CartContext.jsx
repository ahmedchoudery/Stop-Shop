import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Create the Context
const CartContext = createContext();

// 2. Create the Provider
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isBouncing, setIsBouncing] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [toast, setToast] = useState(null);

  // Handle Animation Queueing
  useEffect(() => {
    if (shakeCount > 0 && !isBouncing) {
      setIsBouncing(true);
      
      const timer = setTimeout(() => {
        setIsBouncing(false);
        setShakeCount((prev) => prev - 1);
      }, 500); // Matching animate-cart-shake duration
      
      return () => clearTimeout(timer);
    }
  }, [shakeCount, isBouncing]);

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      // Logic: Check for existence by ID and activeColor
      const existingItemIndex = prevItems.findIndex(
        (item) => item.id === product.id && item.activeColor === product.activeColor
      );

      if (existingItemIndex > -1) {
        // Update Quantity
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: (newItems[existingItemIndex].quantity || 1) + 1,
        };
        return newItems;
      } else {
        // Add New
        return [...prevItems, { ...product, quantity: 1, cartId: Date.now() }];
      }
    });

    setShakeCount((prev) => prev + 1);
    
    // Show toast notification
    setToast(`Added ${product.name} to cart!`);
    setTimeout(() => setToast(null), 4000);
  };

  const removeFromCart = (id, activeColor) => {
    setCartItems((prevItems) => 
      prevItems.filter(item => !(item.id === id && item.activeColor === activeColor))
    );
  };

  const updateQuantity = (id, activeColor, delta) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.id === id && item.activeColor === activeColor
      );

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        const currentQty = newItems[existingItemIndex].quantity || 1;
        const newQty = currentQty + delta;

        if (newQty <= 0) {
          // Remove if 0
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

  const clearToast = () => setToast(null);

  // Storefront Filter State (hoisted for global accessibility)
  const [activeBucket, setActiveBucket] = useState('All');
  const [activeSub, setActiveSub] = useState(null);
  const [lastViewedBucket, setLastViewedBucket] = useState('Tops');
  const [sortBy, setSortBy] = useState('featured');

  // Unified Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('cart'); // 'cart' | 'product'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shouldScrollGrid, setShouldScrollGrid] = useState(0); // Trigger via increment

  const openDrawer = (mode, product = null) => {
    setDrawerMode(mode);
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  const value = {
    cartItems,
    cartCount: cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    addToCart,
    removeFromCart,
    updateQuantity,
    isBouncing,
    toast,
    clearToast,
    total: cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0),
    isDrawerOpen,
    drawerMode,
    selectedProduct,
    openDrawer,
    closeDrawer,
    activeBucket,
    setActiveBucket: (bucket) => {
      setActiveBucket(bucket);
      setShouldScrollGrid(prev => prev + 1);
    },
    activeSub,
    setActiveSub: (sub) => {
      setActiveSub(sub);
      setShouldScrollGrid(prev => prev + 1);
    },
    lastViewedBucket,
    setLastViewedBucket,
    sortBy,
    setSortBy,
    shouldScrollGrid,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// 3. Custom hook for easy access
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
