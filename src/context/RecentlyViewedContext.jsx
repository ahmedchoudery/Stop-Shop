import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { usePublicProducts } from '../hooks/useDomain.js';

const RecentlyViewedContext = createContext();

const MAX_ITEMS = 8;
const STORAGE_KEY = 'stopshop_recently_viewed';

    export const RecentlyViewedProvider = ({ children }) => {
    // ── Get the global products to keep history in sync ──
    const { products } = usePublicProducts();

    const [recentlyViewedRaw, setRecentlyViewedRaw] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });

    // ── Auto-sync with live products ─────────────────────────────
    // This instantly removes "Slim Fit Denim" or any item that was
    // deleted from the database from the user's history slider.
    const recentlyViewed = useMemo(() => {
        if (!products || products.length === 0) return recentlyViewedRaw;
        const liveIds = new Set(products.map(p => p.id));
        return recentlyViewedRaw.filter(p => liveIds.has(p.id));
    }, [recentlyViewedRaw, products]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewedRaw));
    }, [recentlyViewedRaw]);

    const addViewed = (product) => {
        if (!product?.id) return;
        setRecentlyViewedRaw(prev => {
            const filtered = prev.filter(p => p.id !== product.id);
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
