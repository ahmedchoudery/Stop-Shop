// src/config/api.js
// Single source of truth for all API calls.
// In development: points to localhost:5000
// In production:  points to your Railway backend URL

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API = {
    // Public
    publicProducts: `${API_BASE}/api/public/products`,
    publicSettings: `${API_BASE}/api/public/settings`,

    // Orders
    orders: `${API_BASE}/api/orders`,
    order: (id) => `${API_BASE}/api/orders/${id}`,

    // Admin — Auth
    adminLogin: `${API_BASE}/api/admin/login`,

    // Admin — Products
    adminProducts: `${API_BASE}/api/admin/products`,
    adminProduct: (id)`${API_BASE}/api/admin/products/${id}`,

    // Admin — Users
    adminUsers: `${API_BASE}/api/admin/users`,
    adminUser: (id) => `${API_BASE}/api/admin/users/${id}`,

    // Admin — Settings
    settings: `${API_BASE}/api/settings`,

    // Stats
    statsRevenue: `${API_BASE}/api/stats/revenue`,
    statsOrders: `${API_BASE}/api/stats/orders`,
    statsInventory: `${API_BASE}/api/stats/inventory`,
};

export default API_BASE;