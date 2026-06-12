import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { usePublicProducts } from '../hooks/useDomain.js';

const RecentlyViewedContext = createContext();

const MAX_ITEMS = 8;
const STORAGE_KEY = 'stopshop_recently_viewed';

    export const RecentlyViewedProvider = ({ children }) => {
    // ── Get the global products to keep history in sync ──
    const { products, loading } = usePublicProducts();

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
        if (loading) return [];
        const liveIds = new Set(products.map(p => p.id));
        return recentlyViewedRaw.filter(p => liveIds.has(p.id));
    }, [recentlyViewedRaw, products, loading]);

    // Cleanup stale/deleted entries from state permanently once loaded
    useEffect(() => {
        if (!loading && products) {
            const liveIds = new Set(products.map(p => p.id));
            const filtered = recentlyViewedRaw.filter(p => liveIds.has(p.id));
            if (filtered.length !== recentlyViewedRaw.length) {
                setRecentlyViewedRaw(filtered);
            }
        }
    }, [loading, products, recentlyViewedRaw]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewedRaw));
        } catch {
            // ignore: restricted environments
        }
    }, [recentlyViewedRaw]);

    const addViewed = (product) => {
        if (!product?.id) return;
        setRecentlyViewedRaw(prev => {
            const filtered = prev.filter(p => p.id !== product.id);
            return [product, ...filtered].slice(0, MAX_ITEMS);
        });
    };

    const clearViewed = () => setRecentlyViewedRaw([]);

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
