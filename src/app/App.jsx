import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Toast from '../components/Toast';
import Layout from '../layout/Layout';
import UniversalDrawer from '../layout/UniversalDrawer';
import { CartProvider, useCart } from '../context/CartContext';
import HomePage from '../pages/HomePage';
import CheckoutPage from '../pages/CheckoutPage';
import AdminDashboard from '../pages/AdminDashboard';
import DashboardHome from '../pages/DashboardHome';
import AdminOrders from '../pages/AdminOrders';
import AdminInventory from '../pages/AdminInventory';
import AdminUsers from '../pages/AdminUsers';
import AdminSettings from '../pages/AdminSettings';
import LoginPage from '../pages/LoginPage';
import ProtectedRoute from '../components/ProtectedRoute';

// Helper to access context for Toast
const ContextAwareToast = () => {
  const { toast, clearToast, openDrawer } = useCart();
  if (!toast) return null;
  return (
    <Toast 
      message={toast} 
      onClose={clearToast} 
      onViewCart={() => {
        clearToast();
        openDrawer('cart');
      }} 
    />
  );
};

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <Layout>
              <HomePage />
            </Layout>
          } />
          <Route path="/checkout" element={
            <Layout>
              <CheckoutPage />
            </Layout>
          } />

          {/* Admin & Auth Routes (Clean Layouts) */}
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
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          {/* 404 Fallback */}
          <Route path="*" element={
            <div className="min-h-screen bg-white flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-9xl font-black text-gray-100">404</h1>
                <p className="text-xl font-black uppercase tracking-tighter text-gray-900 mt-4">Page Not Found</p>
                <a href="/" className="mt-8 inline-block px-8 py-3 bg-red-800 text-white text-xs font-black uppercase tracking-widest rounded-sm hover:bg-red-900 transition-colors">Go Home</a>
              </div>
            </div>
          } />
        </Routes>

        {/* Global Components needed everywhere */}
        <ContextAwareToast />
        <UniversalDrawer />
      </Router>
    </CartProvider>
  );
}

export default App;
