import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [activeBucket, setActiveBucket] = useState('All');
  const [activeSub, setActiveSub] = useState(null);
  const [lastViewedBucket, setLastViewedBucket] = useState('Tops');
  const [sortBy, setSortBy] = useState('featured');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('cart');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shouldScrollGrid, setShouldScrollGrid] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);

  const openDrawer = (mode, product = null) => {
    setDrawerMode(mode);
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  const triggerBounce = () => {
    setShakeCount((prev) => prev + 1);
  };

  const value = {
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
    isDrawerOpen,
    drawerMode,
    selectedProduct,
    openDrawer,
    closeDrawer,
    shouldScrollGrid,
    isBouncing,
    setIsBouncing,
    shakeCount,
    setShakeCount,
    triggerBounce,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export default UIContext;
