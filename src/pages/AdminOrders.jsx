/**
 * @fileoverview Admin Orders Page
 * Applies: react-patterns (custom hooks, composition), react-ui-patterns (loading/error/empty states),
 *          javascript-pro (async error handling)
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Package, Search, Download } from 'lucide-react';
import OrderTable from '../components/OrderTable.jsx';
import OrderDetails from '../components/OrderDetails.jsx';
import { AsyncContent } from '../components/ErrorBoundary.jsx';
import { useOrders } from '../hooks/useDomain.js';
import { useDebounce } from '../hooks/useUtils.js';
import { generateInvoice } from '../utils/generateInvoice.js';

const ORDER_STATUSES = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const AdminOrders = () => {
  const { orders, loading, error, updating, updateOrderStatus, refetch } = useOrders();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchRaw, setSearchRaw] = useState('');

  const searchTerm = useDebounce(searchRaw, 250);

  // ── Derived: filtered orders ──────────────────────────────────

  const filteredOrders = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return orders.filter(order => {
      const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
      const matchesSearch = !searchTerm
        || (order.orderID ?? order._id).toLowerCase().includes(lower)
        || order.customer?.name?.toLowerCase().includes(lower)
        || order.customer?.email?.toLowerCase().includes(lower);
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  // ── Status counts for filter badges ──────────────────────────

  const statusCounts = useMemo(() => {
    const counts = { All: orders.length };
    ORDER_STATUSES.slice(1).forEach(s => {
      counts[s] = orders.filter(o => o.status === s).length;
    });
    return counts;
  }, [orders]);

  // ── Handle status change from inline select ───────────────────

  const handleStatusChange = useCallback(async (orderId, status) => {
    try {
      await updateOrderStatus({ orderId, status });
      // Update selected order if it's the one being changed
      setSelectedOrder(prev => prev?._id === orderId ? { ...prev, status } : prev);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  }, [updateOrderStatus]);

  // ── Export orders as CSV ──────────────────────────────────────

  const handleExportCSV = useCallback(() => {
    const headers = ['Order ID', 'Customer', 'Email', 'Total', 'Status', 'Date'];
    const rows = filteredOrders.map(o => [
      o.orderID ?? o._id,
      o.customer?.name ?? '',
      o.customer?.email ?? '',
      o.total?.toFixed(2) ?? '0',
      o.status,
      new Date(o.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredOrders]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">
            Fulfillment Hub
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Orders
          </h1>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredOrders.length === 0}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-all disabled:opacity-40"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {ORDER_STATUSES.map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              statusFilter === status
                ? 'bg-[#ba1f3d] text-white shadow-lg'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <span>{status}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
              statusFilter === status ? 'bg-white/20 text-white' : 'bg-white text-gray-500'
            }`}>
              {statusCounts[status] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by order ID, customer name or email..."
          value={searchRaw}
          onChange={e => setSearchRaw(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-xs font-bold focus:bg-white focus:border-[#ba1f3d] outline-none transition-all placeholder:text-gray-300"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl">
        <AsyncContent
          loading={loading}
          error={error}
          data={filteredOrders}
          onRetry={refetch}
          empty={
            <div className="p-16 text-center">
              <Package size={32} className="mx-auto text-gray-200 mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-300">
                {searchTerm || statusFilter !== 'All' ? 'No orders match filters' : 'No orders yet'}
              </p>
            </div>
          }
        >
          <OrderTable
            externalOrders={filteredOrders}
            loading={false}
            onStatusUpdated={refetch}
            onViewDetail={setSelectedOrder}
          />
        </AsyncContent>

        <div className="px-6 py-4 border-t border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
            {filteredOrders.length} of {orders.length} orders
            {updating && ' · Updating...'}
          </p>
        </div>
      </div>

      {/* Order Details Modal */}
      <OrderDetails
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusUpdated={refetch}
      />
    </div>
  );
};

export default AdminOrders;