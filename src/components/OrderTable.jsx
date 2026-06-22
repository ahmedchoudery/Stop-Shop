import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, AlertCircle, FileText, Download } from 'lucide-react';
import { generateInvoice } from '../utils/generateInvoice';
import { apiUrl } from '../config/api';
import { authFetch, handleAuthError } from '../lib/auth';


const OrderTable = ({ externalOrders, loading: externalLoading, onStatusUpdated, onViewDetail }) => {
  const [internalOrders, setInternalOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const orders = externalOrders || internalOrders;
  const isLoading = externalLoading !== undefined ? externalLoading : loading;

  const fetchOrders = async () => {
    if (externalOrders) return;
    try {
      const response = await authFetch(apiUrl('/api/orders'));
      if (handleAuthError(response.status)) return;
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
    if (newStatus === 'Shipped') {
      alert('To mark an order as Shipped, please open the "View Details" (document icon) modal to enter Courier and Tracking information.');
      return;
    }
    try {
      const response = await authFetch(apiUrl(`/api/orders/${orderId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (handleAuthError(response.status)) return;
      if (!response.ok) throw new Error('Failed to update status');
      if (onStatusUpdated) {
        onStatusUpdated();
      } else {
        setInternalOrders(orders.map(order =>
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const statusIcons = {
    'Pending': <Clock size={10} className="stroke-[2.5]" />,
    'Processing': <Package size={10} className="stroke-[2.5]" />,
    'Confirmed': <CheckCircle size={10} className="stroke-[2.5]" />,
    'Shipped': <Truck size={10} className="stroke-[2.5]" />,
    'Delivered': <CheckCircle size={10} className="stroke-[2.5]" />,
    'Cancelled': <AlertCircle size={10} className="stroke-[2.5]" />,
    'Paid': <CheckCircle size={10} className="stroke-[2.5]" />,
    'Failed': <AlertCircle size={10} className="stroke-[2.5]" />,
    'Refunded': <AlertCircle size={10} className="stroke-[2.5]" />,
  };

  const statusColors = {
    'Pending': 'bg-[#FBF3DB] border-[#ECD5A5] text-[#956400]',
    'Processing': 'bg-[#EDF3EC] border-[#D0E2CE] text-[#346538]',
    'Confirmed': 'bg-[#EDF3EC] border-[#D0E2CE] text-[#346538]',
    'Shipped': 'bg-purple-50 border-purple-200 text-purple-700',
    'Delivered': 'bg-[#E2EFE0] border-[#C2DEC0] text-[#2D5A30]',
    'Cancelled': 'bg-[#FDEBEC] border-[#F9CFCF] text-[#9F2F2D]',
    'Paid': 'bg-[#EDF3EC] border-[#D0E2CE] text-[#346538]',
    'Failed': 'bg-black border-black text-white',
    'Refunded': 'bg-gray-100 border-gray-300 text-gray-600',
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="p-20 text-center bg-white border border-gray-150 rounded-[4px]">
        <div className="w-10 h-10 border-2 border-black/10 border-t-black rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Loading Business Intelligence...</p>
      </div>
    );
  }
  if (error) return <div className="p-10 text-center text-red-600 font-bold bg-white border border-red-200 rounded-[4px]">Error: {error}</div>;

  return (
    <div className="w-full">
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150">
                <th className="p-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Order ID</th>
                <th className="p-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Customer</th>
                <th className="p-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Items</th>
                <th className="p-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Total</th>
                <th className="p-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Status</th>
                <th className="p-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Date</th>
                <th className="p-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const totalQuantity = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
                return (
                  <tr key={order._id} className="hover:bg-gray-50/60 transition-colors group">
                    {/* Order ID */}
                    <td className="p-4 font-mono text-[10px] font-bold text-gray-500">
                      #{order.orderID || order.orderId || order._id?.toString()?.slice(-8).toUpperCase()}
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tight text-gray-900">
                          {order.customer?.name || `${order.customer?.firstName ?? ''} ${order.customer?.lastName ?? ''}`.trim() || 'Guest Customer'}
                        </span>
                        <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                          {order.customer?.city || 'Urgent Delivery'}
                        </span>
                      </div>
                    </td>

                    {/* Items — overlapping stacked image gallery */}
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex -space-x-3.5 hover:-space-x-1.5 transition-all duration-300">
                          {(order.items || []).slice(0, 3).map((item, idx) => {
                            const firstLetter = item.name ? item.name.charAt(0).toUpperCase() : '?';
                            return (
                              <div
                                key={idx}
                                className="relative group/img w-9 h-9 rounded-[4px] overflow-hidden border border-white bg-gray-50 flex items-center justify-center shadow-sm cursor-pointer transition-all duration-250 hover:z-30 hover:scale-120 hover:border-black"
                                style={{ zIndex: 10 - idx }}
                              >
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 font-mono">
                                    {firstLetter}
                                  </div>
                                )}
                                {/* Editorial Hover Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/img:block z-[100] bg-black text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-[4px] shadow-lg whitespace-nowrap pointer-events-none">
                                  {item.name}
                                  {item.selectedColor && ` · ${item.selectedColor.includes('|') ? item.selectedColor.split('|')[1] : item.selectedColor}`}
                                  {item.selectedSize && ` · ${item.selectedSize}`}
                                  {` · Qty: ${item.quantity}`}
                                </div>
                              </div>
                            );
                          })}

                          {(order.items || []).length > 3 && (
                            <div
                              className="relative w-9 h-9 rounded-[4px] border border-white bg-black text-white flex items-center justify-center shadow-sm text-[8px] font-black tracking-tighter cursor-help"
                              style={{ zIndex: 0 }}
                              title={(order.items || []).slice(3).map(i => i.name).join(', ')}
                            >
                              +{(order.items || []).length - 3}
                            </div>
                          )}
                        </div>

                        {/* Order Summary Text */}
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none">
                            {totalQuantity} {totalQuantity === 1 ? 'PC' : 'PCS'}
                          </span>
                          <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {(order.items || []).length} {(order.items || []).length === 1 ? 'Product' : 'Products'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Total Price */}
                    <td className="p-4">
                      <span className="text-xs font-black text-gray-900 font-mono">
                        {order.currency || 'PKR'} {Number(order.total ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Status Badge + Change Dropdown */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-[4px] border text-[8px] font-black uppercase tracking-widest ${statusColors[order.status] || 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                          {statusIcons[order.status] || <Clock size={10} />}
                          <span>{order.status}</span>
                        </span>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="bg-transparent border border-gray-200 text-[8px] font-black uppercase tracking-widest rounded-[4px] px-1.5 py-0.5 outline-none cursor-pointer hover:border-black hover:bg-gray-50 transition-all font-mono"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {onViewDetail && (
                          <button
                            onClick={() => onViewDetail(order)}
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-150 rounded-[4px] transition-all"
                            title="View Details"
                          >
                            <FileText size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => generateInvoice(order)}
                          className="p-2 text-gray-400 hover:text-black hover:bg-gray-150 rounded-[4px] transition-all"
                          title="Download Invoice (PDF)"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderTable;
