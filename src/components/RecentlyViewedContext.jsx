import React, { createContext, useContext, useState, useEffect } from 'react';

const RecentlyViewedContext = createContext();

const MAX_ITEMS = 8;
const STORAGE_KEY = 'stopshop_recently_viewed';

export const RecentlyViewedProvider = ({ children }) => {
    const [recentlyViewed, setRecentlyViewed] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
    }, [recentlyViewed]);

    const addViewed = (product) => {
        if (!product?.id) return;
        setRecentlyViewed(prev => {
            // Remove existing entry for this product if present
            const filtered = prev.filter(p => p.id !== product.id);
            // Add to front, cap at MAX_ITEMS
            return [product, ...filtered].slice(0, MAX_ITEMS);
        });
    };

    const clearViewed = () => setRecentlyViewed([]);

    return (
        <RecentlyViewedContext.Provider value={{ recentlyViewed, addViewed, clearViewed }}>
            {children}
        </RecentlyViewedContext.Provider>
    );
};

export const useRecentlyViewed = () => {
    const ctx = useContext(RecentlyViewedContext);
    if (!ctx) throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
    return ctx;
};