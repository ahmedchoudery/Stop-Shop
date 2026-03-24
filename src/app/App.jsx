import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Toast from '../components/Toast';
import Layout from '../layout/Layout';
import UniversalDrawer from '../layout/UniversalDrawer';
import SmoothLoader from '../components/SmoothLoader';
import { CartProvider, useCart } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { RecentlyViewedProvider } from '../components/RecentlyViewedContext';
import HomePage from '../pages/HomePage';
import CheckoutPage from '../pages/CheckoutPage';
import AdminDashboard from '../pages/AdminDashboard';
import DashboardHome from '../pages/DashboardHome';
import AdminOrders from '../pages/AdminOrders';
import AdminInventory from '../pages/AdminInventory';
import AdminProducts from '../pages/AdminProducts';
import AdminUsers from '../pages/AdminUsers';
import AdminSettings from '../pages/AdminSettings';
import LoginPage from '../pages/LoginPage';
import ProtectedRoute from '../components/ProtectedRoute';

const ContextAwareToast = () => {
  const { toast, clearToast, openDrawer } = useCart();
  if (!toast) return null;
  return (
    <Toast
      message={toast}
      onClose={clearToast}
      onViewCart={() => { clearToast(); openDrawer('cart'); }}
    />
  );
};

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
                <Route path="orders" element={<AdminOrders />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminSettings />} />
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

            <ContextAwareToast />
            <UniversalDrawer />
          </Router>
        </CartProvider>
      </WishlistProvider>
    </RecentlyViewedProvider>
  );
}

export default App;