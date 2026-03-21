import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, AlertCircle, FileText, Download } from 'lucide-react';
import { generateInvoice } from '../utils/generateInvoice';

const OrderTable = ({ externalOrders, loading: externalLoading, onStatusUpdated, onViewDetail }) => {
  const [internalOrders, setInternalOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const orders = externalOrders || internalOrders;
  const isLoading = externalLoading !== undefined ? externalLoading : loading;

  const fetchOrders = async () => {
    if (externalOrders) return; // Skip if data is provided externally
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setInternalOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [externalOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
        return;
      }
      if (!response.ok) throw new Error('Failed to update status');
      
      // Notify parent to refresh if needed
      if (onStatusUpdated) {
        onStatusUpdated();
      } else {
        // Update local state if no external refresh
        setInternalOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const statusIcons = {
    'Pending': <Clock className="text-yellow-500" size={16} />,
    'Processing': <Package className="text-blue-500" size={16} />,
    'Shipped': <Truck className="text-purple-500" size={16} />,
    'Delivered': <CheckCircle className="text-green-500" size={16} />,
    'Cancelled': <AlertCircle className="text-red-500" size={16} />,
  };

  if (isLoading) return <div className="p-10 text-center font-black uppercase tracking-widest text-gray-400 bg-white">Loading Business Intelligence...</div>;
  if (error) return <div className="p-10 text-center text-red-600 font-bold">Error: {error}</div>;

  return (
    <div className="w-full">

      <div className="bg-white border border-gray-200 shadow-2xl overflow-hidden rounded-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Items</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Total</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4 font-mono text-xs font-bold text-red-600">
                    {order.orderID}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black uppercase tracking-tight">{order.customer.name}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{order.customer.city}, Gujarat</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-gray-600">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-black text-gray-900">${order.total.toFixed(2)}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 min-w-[80px]">
                        {statusIcons[order.status]}
                        <span className="text-[10px] font-black uppercase tracking-widest ml-1">{order.status}</span>
                      </div>
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="bg-gray-100 border-none text-[10px] font-black uppercase tracking-widest rounded px-2 py-1 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-4 text-[10px] font-bold text-gray-400 uppercase">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {onViewDetail && (
                        <button 
                          onClick={() => onViewDetail(order)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all group-hover:scale-110"
                          title="View Details"
                        >
                          <FileText size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => generateInvoice(order)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-all group-hover:scale-110"
                        title="Download Invoice (PDF)"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderTable;
