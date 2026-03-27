import React, { useState, useEffect } from 'react';
import OrderTable from '../components/OrderTable';
import { apiUrl } from '../config/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(apiUrl('/api/admin/orders'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-12">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900 border-l-8 border-[#FBBF24] pl-6">
          Order Management
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2 ml-6">
          Track fulfillment & customer satisfaction
        </p>
      </header>
      <OrderTable externalOrders={orders} loading={loading} onStatusUpdated={fetchOrders} />
    </div>
  );
};

export default AdminOrders;
