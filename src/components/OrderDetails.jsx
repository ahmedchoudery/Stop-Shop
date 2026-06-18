import React, { useState } from 'react';
import { X, Printer, Package, Truck, User, MapPin, CreditCard, Calendar } from 'lucide-react';
import { ShoppingBag, Clock, ShieldCheck, RefreshCcw, Loader } from 'lucide-react';
import { apiUrl } from '../config/api';

const OrderDetails = ({ order, isOpen, onClose, onStatusUpdated }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen || !order) return null;

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch(apiUrl(`/api/orders/${order._id}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to update status');
      }
      
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkCodPaid = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(apiUrl(`/api/orders/${order._id}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'Paid' }),
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to update payment status');
      }
      
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyManualPayment = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch(apiUrl(`/api/admin/orders/${order._id}/verify-payment`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to verify manual payment');
      }
      
      if (onStatusUpdated) onStatusUpdated();
      alert('Manual payment verified successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRefund = async () => {
    if (!window.confirm('Are you sure you want to process a refund for this order?')) return;
    setIsRefunding(true);
    try {
      const response = await fetch(apiUrl(`/api/orders/${order._id}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Refunded' }),
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to process refund');
      }
      
      if (onStatusUpdated) onStatusUpdated();
      alert('Order successfully refunded via gateway!');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsRefunding(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Determine valid statuses based on payment method
  const isCod = order.paymentMethod === 'COD';
  const validStatuses = isCod
    ? ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']
    : ['Pending', 'Paid', 'Failed', 'Refunded'];

  const paymentStatus = order.paymentDetails?.status || 'Pending';
  const hasManualTid = !isCod && order.paymentDetails?.transactionID && !order.paymentDetails.transactionID.startsWith('EP-DIR') && !order.paymentDetails.transactionID.startsWith('TXN-CARD');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white/60 backdrop-blur-sm print:static print:bg-white print:p-0">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-none border border-gray-150 relative print:border-none print:max-h-none print:overflow-visible print:w-full">
        
        {/* Header - Hidden on Print */}
        <div className="sticky top-0 bg-white border-b border-gray-150 p-6 flex justify-between items-center z-10 print:hidden">
          <div className="flex items-center space-x-3">
            <Package className="text-black" size={24} />
            <h2 className="text-xl font-black uppercase tracking-tighter">Order Details</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-none transition-colors text-gray-400 hover:text-black"
          >
            <X size={24} />
          </button>
        </div>
 
        {/* Content Section */}
        <div className="p-8 sm:p-12 print:p-0">
          
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start mb-12 border-b-2 border-black pb-8">
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-black font-serif">Stop & Shop</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-1">International Logistics • Pakistan Edition</p>
              <div className="mt-6 space-y-1 text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                <p>Building 42C, DHA Phase 6</p>
                <p>Karachi, Pakistan 75500</p>
                <p>order@stopshop.pk</p>
              </div>
            </div>
            <div className="mt-8 sm:mt-0 text-right">
              <h2 className="text-5xl font-black text-gray-100 uppercase tracking-tighter absolute right-12 opacity-50 print:opacity-20 translate-y-[-10px] hidden sm:block">Invoice</h2>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Reference</p>
                <p className="text-2xl font-black text-black font-mono mt-1">{order.orderID}</p>
                <div className="flex items-center justify-end space-x-2 mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
                  <Calendar size={12} />
                  <span>Issued: {new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Banner if manual transaction ID is pending */}
          {hasManualTid && paymentStatus === 'Pending' && (
            <div className="mb-10 p-5 bg-[#FAF9F5] border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 mb-1">Manual Payment Pending Verification</p>
                <p className="text-xs font-bold text-gray-700">Transaction ID: <span className="font-mono text-black font-black">{order.paymentDetails?.transactionID}</span></p>
              </div>
              <button
                onClick={handleVerifyManualPayment}
                disabled={isVerifying}
                className="flex items-center space-x-2 bg-black text-white px-5 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-black/90 transition-all disabled:opacity-50"
              >
                {isVerifying ? <Loader size={12} className="animate-spin" /> : <ShieldCheck size={14} />}
                <span>Verify & Mark Paid</span>
              </button>
            </div>
          )}

          {/* Quick Controls - Hidden on Print */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 print:hidden">
            {/* Status Change Dropdown Card */}
            <div className="bg-gray-50 p-6 rounded-none border border-gray-150 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-none border ${order.status === 'Delivered' || order.status === 'Paid' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-yellow-50 border-yellow-250 text-yellow-600'}`}>
                  {order.status === 'Delivered' || order.status === 'Paid' ? <Truck size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Status</p>
                  <p className="text-sm font-black uppercase tracking-tight">{order.status}</p>
                </div>
              </div>

              <div>
                <select
                  value={order.status}
                  disabled={isUpdating}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-white border border-gray-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest focus:border-black outline-none cursor-pointer"
                >
                  {validStatuses.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
 
            {/* Payment Actions / Print Card */}
            <div className="bg-gray-50 p-6 rounded-none border border-gray-150 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-black">
                <Printer size={24} />
                <p className="text-sm font-black uppercase tracking-widest">Controls</p>
              </div>
              <div className="flex space-x-2">
                {isCod && paymentStatus === 'Pending' && (
                  <button
                    onClick={handleMarkCodPaid}
                    disabled={isUpdating}
                    className="bg-black text-white px-4 py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-black/90 transition-all"
                  >
                    Receive COD Paid
                  </button>
                )}
                {!isCod && paymentStatus === 'Paid' && order.status !== 'Refunded' && (
                  <button
                    onClick={handleRefund}
                    disabled={isRefunding}
                    className="bg-cardinal text-white px-4 py-2.5 text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center space-x-1.5"
                  >
                    {isRefunding ? <Loader size={11} className="animate-spin" /> : <RefreshCcw size={11} />}
                    <span>Refund Payment</span>
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="border border-gray-200 text-gray-700 bg-white px-4 py-2.5 text-[9px] font-black uppercase tracking-widest hover:border-gray-900 transition-all"
                >
                  Print Invoice
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {/* Customer Info */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 border-b border-gray-150 pb-2">
                <User size={16} className="text-black" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Customer Details</h3>
              </div>
              <div className="text-sm">
                <p className="font-black uppercase tracking-tight text-lg text-gray-900">{order.customer.name}</p>
                <p className="text-gray-500 font-bold mt-1 lowercase">{order.customer.email}</p>
                <p className="text-gray-500 font-bold mt-1 uppercase tracking-wider font-mono">Phone: {order.customer.phone || 'N/A'}</p>
              </div>
              
              <div className="flex items-center space-x-2 border-b border-gray-150 pb-2 pt-4">
                <MapPin size={16} className="text-black" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Shipping Destination</h3>
              </div>
              <div className="text-xs font-bold text-gray-600 space-y-1 uppercase tracking-wider leading-relaxed">
                <p>{order.customer.address}</p>
                <p>{order.customer.city}, {order.customer.zip}</p>
                <p>Pakistan</p>
              </div>
            </div>
 
            {/* Payment & Summary Info */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 border-b border-gray-150 pb-2">
                <CreditCard size={16} className="text-black" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Transaction Details</h3>
              </div>
              <div className="bg-gray-50 p-5 border-l-2 border-black space-y-2 uppercase tracking-wide text-[9px] font-bold text-gray-500">
                <div>
                  <p className="text-[8px] font-black text-gray-400">Payment Channel</p>
                  <p className="text-xs font-black text-black mt-0.5">{order.paymentMethod}</p>
                </div>
                {order.paymentDetails?.transactionID && (
                  <div>
                    <p className="text-[8px] font-black text-gray-400">Gateway Transaction ID</p>
                    <p className="text-xs font-black text-black font-mono mt-0.5">{order.paymentDetails.transactionID}</p>
                  </div>
                )}
                {order.paymentDetails?.paymentAccount && (
                  <div>
                    <p className="text-[8px] font-black text-gray-400">Account details / Masked Card</p>
                    <p className="text-xs font-black text-black mt-0.5">
                      {order.paymentDetails.paymentAccount}
                      {order.paymentDetails.cardBrand ? ` (${order.paymentDetails.cardBrand})` : ''}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[8px] font-black text-gray-400">Payment Status</p>
                  <span className={`inline-block px-2 py-0.5 text-[8px] font-black text-white mt-1 ${
                    paymentStatus === 'Paid' ? 'bg-green-600' :
                    paymentStatus === 'Refunded' ? 'bg-cardinal' :
                    paymentStatus === 'Failed' ? 'bg-red-600' : 'bg-amber-500'
                  }`}>
                    {paymentStatus}
                  </span>
                </div>
              </div>
              
              <div className="bg-black text-white p-6 rounded-none relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-2 relative z-10">Total Amount Due</p>
                <p className="text-4xl font-black relative z-10 font-mono">PKR {order.total.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Itemized list */}
          <div className="mt-12">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center space-x-2">
              <ShoppingBag size={14} className="text-black" />
              <span>Itemized Consumption</span>
            </h3>
            <div className="border border-gray-150 rounded-none overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <th className="p-4">SKU/ID</th>
                    <th className="p-4">Product Specification</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4 text-right">Unit Price</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <tr key={item.id} className="text-sm">
                      <td className="p-4 font-mono text-[10px] font-bold text-black">{item.id}</td>
                      <td className="p-4 font-black uppercase tracking-tight text-gray-900">{item.name}</td>
                      <td className="p-4 text-center font-bold text-gray-400">{item.quantity || 1}</td>
                      <td className="p-4 text-right font-bold text-gray-400">PKR {item.price.toLocaleString()}</td>
                      <td className="p-4 text-right font-black text-black">PKR {(item.price * (item.quantity || 1)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
 
          {/* Footer Branding - Visible on Print */}
          <div className="mt-20 pt-12 border-t border-gray-150 text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="h-[1px] w-12 bg-black"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-black">Authentic Supply Chain</p>
              <div className="h-[1px] w-12 bg-black"></div>
            </div>
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
              Thank you for choosing Stop & Shop. This is a computer-generated invoice.
            </p>
          </div>
        </div>
      </div>

      {/* Global CSS for Print Overrides */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:static, .print\\:static * {
            visibility: visible;
          }
          .print\\:static {
            position: absolute;
            left: 0;
            top: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .bg-gray-50 {
            background-color: transparent !important;
          }
          .bg-red-900 {
            background-color: #7f1d1d !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
          }
          .text-red-600 {
            color: #dc2626 !important;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderDetails;
