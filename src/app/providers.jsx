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
          /* Charcoal Black Primary Accent */
          colorPrimary:       '#111111',
          colorPrimaryHover:  '#333333',
          colorPrimaryActive: '#000000',
          colorLink:          '#111111',
          colorLinkHover:     '#333333',

          /* Semantic (Desaturated colors matching pastels) */
          colorSuccess: '#346538',
          colorWarning: '#956400',
          colorError:   '#9f2f2d',
          colorInfo:    '#111111',

          /* Surfaces — clean warm monochrome */
          colorBgBase:       '#ffffff',
          colorBgContainer:  '#ffffff',
          colorBgElevated:   '#f2f1ec',
          colorBgLayout:     '#f7f6f3',

          /* Typography */
          colorTextBase:     '#111111',
          colorTextSecondary:'#787774',
          colorTextTertiary: '#a4a4a2',

          /* Borders */
          colorBorder:       '#eaeaea',
          colorBorderSecondary: '#eaeaea',

          /* Typography & Radii */
          fontFamily: "'SF Pro Display', 'Geist Sans', var(--font-dm-sans), system-ui, -apple-system, sans-serif",
          fontSize: 14,
          borderRadius: 4,
          borderRadiusLG: 6,
          borderRadiusSM: 2,

          /* Motion */
          motionDurationFast: '0.15s',
          motionDurationMid:  '0.25s',
          motionDurationSlow: '0.35s',
          motionEaseInOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
        },
        components: {
          Button: {
            borderRadius:       4,
            colorPrimary:       '#111111',
            colorPrimaryHover:  '#333333',
            colorPrimaryActive: '#000000',
            controlHeight:      40,
            fontWeight:         900,
          },
          Input: {
            borderRadius:      4,
            colorPrimary:      '#111111',
            colorPrimaryHover: '#333333',
            activeBorderColor: '#111111',
            hoverBorderColor:  '#333333',
          },
          Select: {
            borderRadius:      4,
            colorPrimary:      '#111111',
            optionSelectedBg:  'rgba(17,17,17,0.06)',
          },
          Card: {
            borderRadius:    4,
            colorBgContainer:'#ffffff',
          },
          Badge: {
            colorError: '#111111',
          },
          Tag: {
            colorPrimary:      '#111111',
            colorPrimaryHover: '#333333',
          },
          Table: {
            colorPrimary: '#111111',
            rowHoverBg:   'rgba(17,17,17,0.03)',
          },
          Tabs: {
            colorPrimary:      '#111111',
            inkBarColor:       '#111111',
          },
          Switch: {
            colorPrimary:      '#111111',
            colorPrimaryHover: '#333333',
          },
          Checkbox: {
            colorPrimary:      '#111111',
            colorPrimaryHover: '#333333',
          },
          Radio: {
            colorPrimary:      '#111111',
          },
          Pagination: {
            colorPrimary:      '#111111',
            colorPrimaryHover: '#333333',
          },
          Progress: {
            defaultColor: '#111111',
          },
          Slider: {
            colorPrimary:      '#111111',
            colorPrimaryHover: '#333333',
          },
          Rate: {
            starColor: '#956400',
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

