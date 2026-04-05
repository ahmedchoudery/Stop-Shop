/**
 * @fileoverview App.jsx — Root component with all routes
 * Updated: Added AdminReviews route at /admin/reviews
 */

import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../layout/Layout.jsx';
import UniversalDrawer from '../layout/UniversalDrawer.jsx';

import CursorFollower from '../components/CursorFollower.jsx';
import { CartProvider } from '../context/CartContext.jsx';
import { WishlistProvider } from '../context/WishlistContext.jsx';
import { RecentlyViewedProvider } from '../context/RecentlyViewedContext.jsx';
import { CurrencyProvider } from '../context/CurrencyContext.jsx';
import { LocaleProvider } from '../context/LocaleContext.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import HomePage from '../pages/HomePage.jsx';
import CheckoutPage from '../pages/CheckoutPage.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import DashboardHome from '../pages/DashboardHome.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

// ── Admin pages (lazy) ─────────────────────────────────────────────
const AdminOrders    = lazy(() => import('../pages/AdminOrders.jsx'));
const AdminInventory = lazy(() => import('../pages/AdminInventory.jsx'));
const AdminProducts  = lazy(() => import('../pages/AdminProducts.jsx'));
const AdminUsers     = lazy(() => import('../pages/AdminUsers.jsx'));
const AdminSettings  = lazy(() => import('../pages/AdminSettings.jsx'));
const AdminAuditPanel = lazy(() => import('../pages/AdminAuditPanel.jsx'));
const AdminCoupons   = lazy(() => import('../pages/AdminCoupons.jsx'));
const AdminAnalytics = lazy(() => import('../pages/AdminAnalytics.jsx'));
const AdminReviews   = lazy(() => import('../pages/AdminReviews.jsx'));  // ← NEW

// ── Public pages (lazy) ────────────────────────────────────────────
const ProductPage       = lazy(() => import('../pages/ProductPage.jsx'));
const SearchPage        = lazy(() => import('../pages/SearchPage.jsx'));
const OrderTrackingPage = lazy(() => import('../pages/OrderTrackingPage.jsx'));
const OrderSuccessPage  = lazy(() => import('../pages/OrderSuccessPage.jsx'));
const ReturnsPage       = lazy(() => import('../pages/ReturnsPage.jsx'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center space-y-3">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#ba1f3d]" />
      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">Loading</p>
    </div>
  </div>
);

const HomeWithLayout = () => {
  const [liveProducts, setLiveProducts] = useState([]);
  return (
    <Layout products={liveProducts}>
      <HomePage onProductsLoaded={setLiveProducts} />
    </Layout>
  );
};

function App() {


  return (
    <ErrorBoundary title="Something went wrong">
      <LocaleProvider>
        <CurrencyProvider>
          <RecentlyViewedProvider>
            <WishlistProvider>
              <CartProvider>
                <CursorFollower />


                <Router>
                  <Routes>

                    {/* ── Storefront ──────────────────────────────────── */}
                    <Route path="/" element={<HomeWithLayout />} />

                    <Route path="/product/:id" element={
                      <Layout>
                        <Suspense fallback={<PageLoader />}>
                          <ProductPage />
                        </Suspense>
                      </Layout>
                    } />

                    <Route path="/search" element={
                      <Suspense fallback={<PageLoader />}>
                        <SearchPage />
                      </Suspense>
                    } />

                    <Route path="/checkout" element={
                      <Layout>
                        <CheckoutPage />
                      </Layout>
                    } />

                    <Route path="/order-success" element={
                      <Suspense fallback={<PageLoader />}>
                        <OrderSuccessPage />
                      </Suspense>
                    } />

                    <Route path="/track" element={
                      <Suspense fallback={<PageLoader />}>
                        <OrderTrackingPage />
                      </Suspense>
                    } />

                    <Route path="/returns" element={
                      <Layout>
                        <Suspense fallback={<PageLoader />}>
                          <ReturnsPage />
                        </Suspense>
                      </Layout>
                    } />

                    {/* ── Auth ────────────────────────────────────────── */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* ── Admin ───────────────────────────────────────── */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Navigate to="/admin/dashboard" replace />} />
                      <Route path="dashboard"  element={<DashboardHome />} />
                      <Route path="orders"     element={<Suspense fallback={<PageLoader />}><AdminOrders /></Suspense>} />
                      <Route path="inventory"  element={<Suspense fallback={<PageLoader />}><AdminInventory /></Suspense>} />
                      <Route path="products"   element={<Suspense fallback={<PageLoader />}><AdminProducts /></Suspense>} />
                      <Route path="users"      element={<Suspense fallback={<PageLoader />}><AdminUsers /></Suspense>} />
                      <Route path="audits"     element={<Suspense fallback={<PageLoader />}><AdminAuditPanel /></Suspense>} />
                      <Route path="settings"   element={<Suspense fallback={<PageLoader />}><AdminSettings /></Suspense>} />
                      <Route path="coupons"    element={<Suspense fallback={<PageLoader />}><AdminCoupons /></Suspense>} />
                      <Route path="analytics"  element={<Suspense fallback={<PageLoader />}><AdminAnalytics /></Suspense>} />
                      <Route path="reviews"    element={<Suspense fallback={<PageLoader />}><AdminReviews /></Suspense>} />
                    </Route>

                    {/* ── 404 ─────────────────────────────────────────── */}
                    <Route path="*" element={
                      <div className="min-h-screen bg-white flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-[160px] sm:text-[180px] font-black text-gray-50 leading-none select-none">404</h1>
                          <p className="text-xl font-black uppercase tracking-tighter text-gray-900 mt-4">Page Not Found</p>
                          <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest font-black">The design doesn't exist here.</p>
                          <a href="/" className="mt-8 inline-flex items-center space-x-2 px-10 py-5 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-gray-900 transition-all shadow-xl">
                            <span>Return Home</span>
                          </a>
                        </div>
                      </div>
                    } />

                  </Routes>

                  <UniversalDrawer />
                </Router>
              </CartProvider>
            </WishlistProvider>
          </RecentlyViewedProvider>
        </CurrencyProvider>
      </LocaleProvider>
    </ErrorBoundary>
  );
}

export default App;