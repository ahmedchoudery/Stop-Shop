import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import UniversalDrawer from '../layout/UniversalDrawer';
import SmoothLoader from '../components/SmoothLoader';
import { CartProvider, useCart } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { RecentlyViewedProvider } from '../components/RecentlyViewedContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { LocaleProvider } from '../context/LocaleContext';
import HomePage from '../pages/HomePage';
import CheckoutPage from '../pages/CheckoutPage';
import AdminDashboard from '../pages/AdminDashboard';
import DashboardHome from '../pages/DashboardHome';
import LoginPage from '../pages/LoginPage';
import ProtectedRoute from '../components/ProtectedRoute';

const AdminOrders = lazy(() => import('../pages/AdminOrders'));
const AdminInventory = lazy(() => import('../pages/AdminInventory'));
const AdminProducts = lazy(() => import('../pages/AdminProducts'));
const AdminUsers = lazy(() => import('../pages/AdminUsers'));
const AdminSettings = lazy(() => import('../pages/AdminSettings'));
const AdminAuditPanel = lazy(() => import('../pages/AdminAuditPanel'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ba1f3d]"></div>
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
  const [loading, setLoading] = useState(true);

  return (
    <LocaleProvider>
      <CurrencyProvider>
        <RecentlyViewedProvider>
          <WishlistProvider>
            <CartProvider>
              {loading && <SmoothLoader onComplete={() => setLoading(false)} />}
              <Router>
                <Routes>
                  <Route path="/" element={<HomeWithLayout />} />

                  <Route path="/checkout" element={
                    <Layout>
                      <CheckoutPage />
                    </Layout>
                  } />

                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardHome />} />
                    <Route path="orders" element={<Suspense fallback={<LoadingFallback />}><AdminOrders /></Suspense>} />
                    <Route path="inventory" element={<Suspense fallback={<LoadingFallback />}><AdminInventory /></Suspense>} />
                    <Route path="products" element={<Suspense fallback={<LoadingFallback />}><AdminProducts /></Suspense>} />
                    <Route path="users" element={<Suspense fallback={<LoadingFallback />}><AdminUsers /></Suspense>} />
                    <Route path="audits" element={<Suspense fallback={<LoadingFallback />}><AdminAuditPanel /></Suspense>} />
                    <Route path="settings" element={<Suspense fallback={<LoadingFallback />}><AdminSettings /></Suspense>} />
                  </Route>

                  <Route path="*" element={
                    <div className="min-h-screen bg-white flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-[180px] font-black text-gray-50 leading-none select-none">404</h1>
                        <p className="text-xl font-black uppercase tracking-tighter text-gray-900 mt-4">Page Not Found</p>
                        <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest font-black">The design doesn't exist here.</p>
                        <a href="/" className="mt-8 inline-flex items-center space-x-2 px-10 py-5 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-none hover:bg-gray-900 transition-all shadow-xl">
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
  );
}

export default App;