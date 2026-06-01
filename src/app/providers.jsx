'use client';

import React from 'react';
import { CartProvider } from '../context/CartContext.tsx';
import { WishlistProvider } from '../context/WishlistContext.jsx';
import { RecentlyViewedProvider } from '../context/RecentlyViewedContext.jsx';
import { CurrencyProvider } from '../context/CurrencyContext.jsx';
import { LocaleProvider } from '../context/LocaleContext.jsx';
import { CustomerProvider } from '../context/CustomerContext.jsx';

export default function Providers({ children }) {
  return (
    <LocaleProvider>
      <CurrencyProvider>
        <RecentlyViewedProvider>
          <WishlistProvider>
            <CartProvider>
              <CustomerProvider>{children}</CustomerProvider>
            </CartProvider>
          </WishlistProvider>
        </RecentlyViewedProvider>
      </CurrencyProvider>
    </LocaleProvider>
  );
}
