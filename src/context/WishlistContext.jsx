import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState(() => {
        try {
            const stored = localStorage.getItem('stopshop_wishlist');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('stopshop_wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    const toggleWishlist = (product) => {
        setWishlist(prev => {
            const exists = prev.find(p => p.id === product.id);
            return exists ? prev.filter(p => p.id !== product.id) : [...prev, product];
        });
    };

    const isWishlisted = (id) => wishlist.some(p => p.id === id);

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted, wishlistCount: wishlist.length }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
    return ctx;
};