/**
 * @fileoverview App.jsx — Root component with all routes
 * Updated: Added Customer Account routes + CustomerProvider
 */

import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from '../layout/Layout.jsx';
import UniversalDrawer from '../layout/UniversalDrawer.jsx';

import { CartProvider } from '../context/CartContext.tsx';
import { WishlistProvider } from '../context/WishlistContext.jsx';
import { RecentlyViewedProvider } from '../context/RecentlyViewedContext.jsx';
import { CurrencyProvider } from '../context/CurrencyContext.jsx';
import { LocaleProvider } from '../context/LocaleContext.jsx';
import { CustomerProvider } from '../context/CustomerContext.jsx';
import ErrorBoundary from '../components/ErrorBoundary.tsx';
import HomePage from '../views/HomePage.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

// ── Admin pages (lazy) ─────────────────────────────────────────────
const AdminDashboard = lazy(() => import('../views/AdminDashboard.jsx'));
const DashboardHome  = lazy(() => import('../views/DashboardHome.jsx'));
const AdminOrders    = lazy(() => import('../views/AdminOrders.jsx'));
const AdminInventory = lazy(() => import('../views/AdminInventory.jsx'));
const AdminProducts  = lazy(() => import('../views/AdminProducts.jsx'));
const AdminUsers     = lazy(() => import('../views/AdminUsers.jsx'));
const AdminSettings  = lazy(() => import('../views/AdminSettings.jsx'));
const AdminAuditPanel = lazy(() => import('../views/AdminAuditPanel.jsx'));
const AdminCoupons   = lazy(() => import('../views/AdminCoupons.jsx'));
const AdminAnalytics = lazy(() => import('../views/AdminAnalytics.jsx'));
const AdminReviews   = lazy(() => import('../views/AdminReviews.jsx'));

// ── Public pages (lazy) ────────────────────────────────────────────
const ProductPage        = lazy(() => import('../views/ProductPage.jsx'));
const SearchPage         = lazy(() => import('../views/SearchPage.jsx'));
const OrderTrackingPage  = lazy(() => import('../views/OrderTrackingPage.jsx'));
const OrderSuccessPage   = lazy(() => import('../views/OrderSuccessPage.jsx'));
const ReturnsPage        = lazy(() => import('../views/ReturnsPage.jsx'));
const CheckoutPage       = lazy(() => import('../views/CheckoutPage.jsx'));

// ── Customer account pages (lazy) ─────────────────────────────────
const CustomerAuthPage = lazy(() => import('../views/CustomerAuthPage.jsx'));
const AccountPage      = lazy(() => import('../views/AccountPage.jsx'));

// ── Admin authentication (lazy) ───────────────────────────────────
const LoginPage        = lazy(() => import('../views/LoginPage.tsx'));

// ── 404 page (lazy) ──────────────────────────────────────────────
const NotFoundPage     = lazy(() => import('../views/NotFoundPage.jsx'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center space-y-3">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cardinal" />
      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">Loading</p>
    </div>
  </div>
);

/**
 * PageSuspense — Reusable Suspense boundary with branded PageLoader.
 * Eliminates repeated <Suspense fallback={<PageLoader />}> boilerplate.
 * (frontend-dev-guidelines §2: Lazy Load Anything Heavy)
 */
const PageSuspense = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const PageContent = () => {
  const location = useLocation();
  const [liveProducts, setLiveProducts] = useState([]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ── Storefront ──────────────────────────────── */}
        <Route path="/" element={
          <Layout products={liveProducts}>
            <HomePage onProductsLoaded={setLiveProducts} />
          </Layout>
        } />

        <Route path="/product/:id" element={
          <Layout>
            <PageSuspense>
              <ProductPage />
            </PageSuspense>
          </Layout>
        } />

        <Route path="/search" element={
          <Layout>
            <PageSuspense>
              <SearchPage />
            </PageSuspense>
          </Layout>
        } />

        <Route path="/checkout" element={
          <Layout>
            <PageSuspense>
              <CheckoutPage />
            </PageSuspense>
          </Layout>
        } />

        <Route path="/order-success" element={
          <Layout>
            <PageSuspense>
              <OrderSuccessPage />
            </PageSuspense>
          </Layout>
        } />

        <Route path="/track" element={
          <Layout>
            <PageSuspense>
              <OrderTrackingPage />
            </PageSuspense>
          </Layout>
        } />

        <Route path="/returns" element={
          <Layout>
            <PageSuspense>
              <ReturnsPage />
            </PageSuspense>
          </Layout>
        } />

        {/* ── Customer Account ────────────────────────── */}
        <Route path="/account/login" element={
          <Layout>
            <PageSuspense>
              <CustomerAuthPage />
            </PageSuspense>
          </Layout>
        } />

        <Route path="/account" element={
          <Layout>
            <PageSuspense>
              <AccountPage />
            </PageSuspense>
          </Layout>
        } />

        {/* ── Admin auth ──────────────────────────────── */}
        <Route path="/login" element={
          <PageSuspense>
            <LoginPage />
          </PageSuspense>
        } />

        {/* ── Admin panel ─────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <PageSuspense>
                <AdminDashboard />
              </PageSuspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"  element={
            <PageSuspense>
              <DashboardHome />
            </PageSuspense>
          } />
          <Route path="orders"     element={<PageSuspense><AdminOrders /></PageSuspense>} />
          <Route path="inventory"  element={<PageSuspense><AdminInventory /></PageSuspense>} />
          <Route path="products"   element={<PageSuspense><AdminProducts /></PageSuspense>} />
          <Route path="users"      element={<PageSuspense><AdminUsers /></PageSuspense>} />
          <Route path="audits"     element={<PageSuspense><AdminAuditPanel /></PageSuspense>} />
          <Route path="settings"   element={<PageSuspense><AdminSettings /></PageSuspense>} />
          <Route path="coupons"    element={<PageSuspense><AdminCoupons /></PageSuspense>} />
          <Route path="analytics"  element={<PageSuspense><AdminAnalytics /></PageSuspense>} />
          <Route path="reviews"    element={<PageSuspense><AdminReviews /></PageSuspense>} />
        </Route>

        {/* ── 404 ─────────────────────────────────────── */}
        <Route path="*" element={
          <PageSuspense>
            <NotFoundPage />
          </PageSuspense>
        } />
      </Routes>
    </AnimatePresence>
  );
};

import { ConfigProvider } from 'antd';

function App() {
  return (
    <ErrorBoundary title="Something went wrong">
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
              borderRadius: 0,
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
                  <CustomerProvider>
                    <Router>
                      <PageContent />
                      <UniversalDrawer />
                    </Router>
                  </CustomerProvider>
                </CartProvider>
              </WishlistProvider>
            </RecentlyViewedProvider>
          </CurrencyProvider>
        </LocaleProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export function ClientRouter() {
  return (
    <Router>
      <PageContent />
    </Router>
  );
}

export default App;