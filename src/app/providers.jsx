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
          /* Cardinal Red — OKLCH(0.42 0.18 17) ≈ #ba1f3d */
          colorPrimary:       '#ba1f3d',
          colorPrimaryHover:  '#d4294d',  /* OKLCH(0.50 0.20 17) */
          colorPrimaryActive: '#8B0000',  /* OKLCH(0.32 0.15 17) */
          colorLink:          '#ba1f3d',
          colorLinkHover:     '#d4294d',

          /* Semantic */
          colorSuccess: '#22C55E',   /* OKLCH(0.64 0.18 145) */
          colorWarning: '#FBBF24',   /* OKLCH(0.82 0.16 84)  */
          colorError:   '#F63049',   /* OKLCH(0.55 0.22 19)  */
          colorInfo:    '#ba1f3d',

          /* Surfaces — warm-tinted OKLCH neutrals */
          colorBgBase:       '#ffffff',
          colorBgContainer:  '#f9fafb',
          colorBgElevated:   '#f3f4f6',
          colorBgLayout:     '#ffffff',

          /* Typography */
          colorTextBase:     '#111827',  /* OKLCH(0.15 0.01 240) */
          colorTextSecondary:'#4b5563',  /* OKLCH(0.42 0.012 240) */
          colorTextTertiary: '#9ca3af',  /* OKLCH(0.64 0.010 240) */

          /* Borders */
          colorBorder:       '#e5e7eb',  /* OKLCH(0.92 0.005 240) */
          colorBorderSecondary: '#d1d5db',

          /* Typography */
          fontFamily: 'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 14,
          borderRadius: 4,
          borderRadiusLG: 8,
          borderRadiusSM: 2,

          /* Motion */
          motionDurationFast: '0.15s',
          motionDurationMid:  '0.25s',
          motionDurationSlow: '0.35s',
          motionEaseInOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
        },
        components: {
          Button: {
            borderRadius:       0,
            colorPrimary:       '#ba1f3d',
            colorPrimaryHover:  '#d4294d',
            colorPrimaryActive: '#8B0000',
            controlHeight:      40,
            fontWeight:         900,
          },
          Input: {
            borderRadius:      2,
            colorPrimary:      '#ba1f3d',
            colorPrimaryHover: '#d4294d',
            activeBorderColor: '#ba1f3d',
            hoverBorderColor:  '#d4294d',
          },
          Select: {
            borderRadius:      2,
            colorPrimary:      '#ba1f3d',
            optionSelectedBg:  'rgba(186,31,61,0.08)',
          },
          Card: {
            borderRadius:    0,
            colorBgContainer:'#f9fafb',
          },
          Badge: {
            colorError: '#ba1f3d',
          },
          Tag: {
            colorPrimary:      '#ba1f3d',
            colorPrimaryHover: '#d4294d',
          },
          Table: {
            colorPrimary: '#ba1f3d',
            rowHoverBg:   'rgba(186,31,61,0.04)',
          },
          Tabs: {
            colorPrimary:      '#ba1f3d',
            inkBarColor:       '#ba1f3d',
          },
          Switch: {
            colorPrimary:      '#ba1f3d',
            colorPrimaryHover: '#d4294d',
          },
          Checkbox: {
            colorPrimary:      '#ba1f3d',
            colorPrimaryHover: '#d4294d',
          },
          Radio: {
            colorPrimary:      '#ba1f3d',
          },
          Pagination: {
            colorPrimary:      '#ba1f3d',
            colorPrimaryHover: '#d4294d',
          },
          Progress: {
            defaultColor: '#ba1f3d',
          },
          Slider: {
            colorPrimary:      '#ba1f3d',
            colorPrimaryHover: '#d4294d',
          },
          Rate: {
            starColor: '#FBBF24',
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

