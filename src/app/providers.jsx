'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import { CartProvider } from '../context/CartContext.tsx';
import { WishlistProvider } from '../context/WishlistContext.jsx';
import { RecentlyViewedProvider } from '../context/RecentlyViewedContext.jsx';
import { CurrencyProvider } from '../context/CurrencyContext.jsx';
import { LocaleProvider } from '../context/LocaleContext.jsx';
import { CustomerProvider } from '../context/CustomerContext.jsx';

export default function Providers({ children }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#ba1f3d',
          colorLink: '#ba1f3d',
          colorSuccess: '#22C55E',
          colorWarning: '#FBBF24',
          colorError: '#F63049',
          colorBgBase: '#ffffff',
          colorTextBase: '#111827',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          borderRadius: 4,
        },
        components: {
          Button: {
            borderRadius: 0, // Sharp-edged buttons as per design system guidelines
            colorPrimary: '#ba1f3d',
            colorPrimaryHover: '#F63049',
            colorPrimaryActive: '#8B0000',
            controlHeight: 40,
          },
          Input: {
            borderRadius: 2,
            colorPrimary: '#ba1f3d',
            colorPrimaryHover: '#F63049',
          },
          Select: {
            borderRadius: 2,
            colorPrimary: '#ba1f3d',
          },
          Card: {
            borderRadius: 0,
          },
        },
      }}
    >
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
    </ConfigProvider>
  );
}

