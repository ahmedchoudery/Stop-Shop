import React, { useState, useEffect } from 'react';
import { X, Printer, Package, Truck, User, MapPin, CreditCard, Calendar, ShoppingBag, Clock, ShieldCheck, RefreshCcw, Loader, ArrowRight, Ban } from 'lucide-react';
import { apiUrl } from '../config/api';

const OrderDetails = ({ order, isOpen, onClose, onStatusUpdated }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showCourierForm, setShowCourierForm] = useState(false);
  const [courier, setCourier] = useState('TCS Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [customCourier, setCustomCourier] = useState('');

  // Reset courier states when order changes
  useEffect(() => {
    if (order) {
      setCourier(order.courier && ['TCS Express', 'Leopards Courier', 'PostEx', 'Trax'].includes(order.courier) ? order.courier : (order.courier ? 'Custom' : 'TCS Express'));
      setCustomCourier(order.courier && !['TCS Express', 'Leopards Courier', 'PostEx', 'Trax'].includes(order.courier) ? order.courier : '');
      setTrackingNumber(order.trackingNumber || '');
      setShowCourierForm(false);
    }
  }, [order]);

  // Lock parent page body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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

  const triggerMockShipment = async () => {
    setIsUpdating(true);
    try {
      const courierList = ['TCS Express', 'Leopards Courier', 'PostEx', 'Trax'];
      const randomCourier = courierList[Math.floor(Math.random() * courierList.length)];
      const randomTracking = Math.floor(100000000000 + Math.random() * 900000000000).toString();

      const response = await fetch(apiUrl(`/api/orders/${order._id}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Shipped',
          courier: randomCourier,
          trackingNumber: randomTracking
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to update mock shipment');
      }

      setCourier(randomCourier);
      setTrackingNumber(randomTracking);
      setShowCourierForm(false);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
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
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[4px] border border-gray-150 relative print:border-none print:max-h-none print:overflow-visible print:w-full">
        
        {/* Header - Hidden on Print */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center z-10 print:hidden">
          <div className="flex items-center space-x-2.5">
            <Package className="text-black" size={20} />
            <h2 className="text-base font-black uppercase tracking-tight text-gray-900">Order Management</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-[4px] transition-all text-gray-400 hover:text-black"
          >
            <X size={20} />
          </button>
        </div>
 
        {/* Content Section */}
        <div className="p-8 sm:p-12 print:p-0">
          
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start mb-12 border-b-2 border-black pb-8">
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-black font-serif">Stop & Shop</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-1">International Logistics • Pakistan Edition</p>
              <div className="mt-6 space-y-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                <p>Building 42C, DHA Phase 6</p>
                <p>Karachi, Pakistan 75500</p>
                <p>order@stopshop.pk</p>
              </div>
            </div>
            <div className="mt-8 sm:mt-0 text-right">
              <h2 className="text-5xl font-black text-gray-100 uppercase tracking-tighter absolute right-12 opacity-50 print:opacity-20 translate-y-[-10px] hidden sm:block">Invoice</h2>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-mono">Order Reference</p>
                <p className="text-2xl font-black text-black font-mono mt-1">{order.orderID || order._id}</p>
                <div className="flex items-center justify-end space-x-2 mt-4 text-[9px] font-black uppercase tracking-widest text-gray-400 italic">
                  <Calendar size={11} />
                  <span>Issued: {new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Banner if manual transaction ID is pending */}
          {hasManualTid && paymentStatus === 'Pending' && (
            <div className="mb-10 p-5 bg-[#FAF9F5] border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#956400] mb-1">Manual Payment Pending Verification</p>
                <p className="text-xs font-bold text-gray-700">Transaction ID: <span className="font-mono text-black font-black">{order.paymentDetails?.transactionID}</span></p>
              </div>
              <button
                onClick={handleVerifyManualPayment}
                disabled={isVerifying}
                className="flex items-center space-x-2 bg-black text-white px-5 py-3 text-[9px] font-black uppercase tracking-widest rounded-[4px] hover:bg-black/90 transition-all disabled:opacity-50"
              >
                {isVerifying ? <Loader size={12} className="animate-spin" /> : <ShieldCheck size={14} />}
                <span>Verify & Mark Paid</span>
              </button>
            </div>
          )}

          {/* REDESIGNED CONTROLS SECTION - Hidden on Print */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 print:hidden">
            
            {/* Status Change Dropdown Card + Workflow Shortcuts */}
            <div className="bg-gray-50 p-6 rounded-[4px] border border-gray-150 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-[4px] border ${order.status === 'Delivered' || order.status === 'Paid' ? 'bg-[#EDF3EC] border-[#D0E2CE] text-[#346538]' : 'bg-[#FBF3DB] border-[#ECD5A5] text-[#956400]'}`}>
                    {order.status === 'Delivered' || order.status === 'Paid' ? <Truck size={16} /> : <Clock size={16} />}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Order Status</p>
                    <p className="text-xs font-black uppercase tracking-tight text-gray-900 mt-0.5">{order.status}</p>
                  </div>
                </div>
                
                {/* Manual Dropdown Override */}
                <select
                  value={order.status}
                  disabled={isUpdating}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    if (nextVal === 'Shipped') {
                      setShowCourierForm(true);
                    } else {
                      handleStatusChange(nextVal);
                    }
                  }}
                  className="bg-white border border-gray-200 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-[4px] focus:border-black outline-none cursor-pointer"
                >
                  {validStatuses.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Workflow Shortcut Buttons */}
              <div className="border-t border-gray-200/60 pt-3">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Workflow Helper Actions</p>
                <div className="flex flex-wrap gap-2">
                  {order.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('Confirmed')}
                        disabled={isUpdating}
                        className="flex items-center space-x-1.5 bg-black text-white px-3 py-2 text-[8px] font-black uppercase tracking-widest rounded-[3px] hover:bg-black/90 transition-all"
                      >
                        <ShieldCheck size={10} />
                        <span>Confirm Order</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange('Cancelled')}
                        disabled={isUpdating}
                        className="flex items-center space-x-1.5 bg-white border border-[#F9CFCF] text-[#9F2F2D] px-3 py-2 text-[8px] font-black uppercase tracking-widest rounded-[3px] hover:bg-[#FDEBEC] transition-all"
                      >
                        <Ban size={10} />
                        <span>Cancel Order</span>
                      </button>
                    </>
                  )}

                  {((isCod && order.status === 'Confirmed') || order.status === 'Processing' || (isCod && order.status === 'Pending')) && (
                    <button
                      onClick={() => setShowCourierForm(true)}
                      disabled={isUpdating}
                      className="flex items-center space-x-1.5 bg-black text-white px-3 py-2 text-[8px] font-black uppercase tracking-widest rounded-[3px] hover:bg-black/90 transition-all"
                    >
                      <Truck size={10} />
                      <span>Ship Shipment</span>
                    </button>
                  )}

                  {order.status === 'Shipped' && (
                    <button
                      onClick={() => handleStatusChange('Delivered')}
                      disabled={isUpdating}
                      className="flex items-center space-x-1.5 bg-black text-white px-3 py-2 text-[8px] font-black uppercase tracking-widest rounded-[3px] hover:bg-black/90 transition-all"
                    >
                      <ShieldCheck size={10} />
                      <span>Deliver Package</span>
                    </button>
                  )}

                  {['Delivered', 'Cancelled', 'Refunded', 'Paid'].includes(order.status) && (
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 italic">✓ No pending workflow state</p>
                  )}
                </div>
              </div>
            </div>
 
            {/* Quick Actions & Print Card */}
            <div className="bg-gray-50 p-6 rounded-[4px] border border-gray-150 flex flex-col justify-between space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-[4px] border bg-white border-gray-200 text-gray-700">
                  <Printer size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Logistics Controls</p>
                  <p className="text-xs font-black uppercase tracking-tight text-gray-900 mt-0.5">Admin Utilities</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200/60 w-full">
                {isCod && paymentStatus === 'Pending' && (
                  <button
                    onClick={handleMarkCodPaid}
                    disabled={isUpdating}
                    className="flex-1 bg-black text-white px-4 py-2.5 text-[8px] font-black uppercase tracking-widest rounded-[4px] hover:bg-black/90 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <CreditCard size={11} />
                    <span>Receive COD Paid</span>
                  </button>
                )}
                {!isCod && paymentStatus === 'Paid' && order.status !== 'Refunded' && (
                  <button
                    onClick={handleRefund}
                    disabled={isRefunding}
                    className="flex-1 bg-[#FDEBEC] border border-[#F9CFCF] text-[#9F2F2D] px-4 py-2.5 text-[8px] font-black uppercase tracking-widest rounded-[4px] hover:brightness-110 transition-all flex items-center justify-center space-x-1.5"
                  >
                    {isRefunding ? <Loader size={11} className="animate-spin" /> : <RefreshCcw size={11} />}
                    <span>Refund Payment</span>
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="flex-1 border border-gray-250 text-gray-700 bg-white px-4 py-2.5 text-[8px] font-black uppercase tracking-widest rounded-[4px] hover:border-black hover:text-black transition-all flex items-center justify-center space-x-1.5"
                >
                  <Printer size={11} />
                  <span>Print Invoice</span>
                </button>
              </div>
            </div>
          </div>

          {/* Courier Form */}
          {showCourierForm && (
            <div className="mb-10 p-6 bg-gray-50 border border-gray-150 rounded-[4px] print:hidden animate-scale-in">
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Shipment Dispatch Details</p>
                
                {/* 1-CLICK AUTOFILL MOCK SHIPMENT AND SAVE */}
                <button
                  type="button"
                  onClick={triggerMockShipment}
                  disabled={isUpdating}
                  className="px-3 py-1.5 bg-black text-white hover:bg-black/90 transition-all text-[8px] font-black uppercase tracking-widest rounded-[3px] flex items-center space-x-1.5"
                >
                  <ArrowRight size={10} />
                  <span>1-Click Auto-Ship Order</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">Select Courier</label>
                  <select
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className="w-full bg-white border border-gray-200 px-3 py-2 text-xs font-bold focus:border-black outline-none cursor-pointer rounded-[3px]"
                  >
                    <option value="TCS Express">TCS Express</option>
                    <option value="Leopards Courier">Leopards Courier</option>
                    <option value="PostEx">PostEx</option>
                    <option value="Trax">Trax</option>
                    <option value="Custom">Custom Courier</option>
                  </select>
                </div>
                {courier === 'Custom' && (
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">Custom Courier Name</label>
                    <input
                      type="text"
                      placeholder="Enter courier name"
                      value={customCourier}
                      onChange={(e) => setCustomCourier(e.target.value)}
                      className="w-full bg-white border border-gray-200 px-3 py-2 text-xs font-bold focus:border-black outline-none rounded-[3px]"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">Tracking Number</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Tracking reference number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full bg-white border border-gray-200 px-3 py-2 text-xs font-bold focus:border-black outline-none font-mono rounded-[3px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const rand = Math.floor(100000000000 + Math.random() * 900000000000);
                        setTrackingNumber(rand.toString());
                      }}
                      className="px-3 py-2 border border-gray-200 bg-white hover:border-black hover:text-black transition-all text-[8px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap rounded-[3px]"
                    >
                      Generate Mock
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 border-t border-gray-150 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCourierForm(false);
                    // Reset to current order details
                    setCourier(order.courier && ['TCS Express', 'Leopards Courier', 'PostEx', 'Trax'].includes(order.courier) ? order.courier : (order.courier ? 'Custom' : 'TCS Express'));
                    setCustomCourier(order.courier && !['TCS Express', 'Leopards Courier', 'PostEx', 'Trax'].includes(order.courier) ? order.courier : '');
                    setTrackingNumber(order.trackingNumber || '');
                  }}
                  className="px-4 py-2.5 border border-gray-250 text-gray-500 bg-white hover:border-black hover:text-black transition-all text-[9px] font-black uppercase tracking-widest rounded-[4px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const finalCourier = courier === 'Custom' ? customCourier : courier;
                    if (!finalCourier.trim()) {
                      alert('Please specify a courier service.');
                      return;
                    }
                    if (!trackingNumber.trim()) {
                      alert('Please enter a tracking number.');
                      return;
                    }
                    setIsUpdating(true);
                    try {
                      const response = await fetch(apiUrl(`/api/orders/${order._id}`), {
                        method: 'PATCH',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          status: 'Shipped',
                          courier: finalCourier.trim(),
                          trackingNumber: trackingNumber.trim()
                        }),
                      });
                      if (!response.ok) {
                        const data = await response.json().catch(() => ({}));
                        throw new Error(data.error ?? 'Failed to update status');
                      }
                      setShowCourierForm(false);
                      if (onStatusUpdated) onStatusUpdated();
                    } catch (err) {
                      alert('Error: ' + err.message);
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                  disabled={isUpdating}
                  className="px-4 py-2.5 bg-black text-white hover:bg-black/95 transition-all text-[9px] font-black uppercase tracking-widest rounded-[4px] disabled:opacity-50"
                >
                  Save &amp; Ship
                </button>
              </div>
            </div>
          )}

          {/* Shipment Info Display */}
          {order.status === 'Shipped' && order.courier && order.trackingNumber && !showCourierForm && (
            <div className="mb-10 p-6 bg-[#FAF9F5] border border-gray-150 rounded-[4px] flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400 mb-1">Shipment Dispatch Details</p>
                <p className="text-xs font-bold text-gray-700">Courier: <span className="font-black text-black uppercase tracking-wide">{order.courier}</span></p>
                <p className="text-xs font-bold text-gray-700 mt-1">Tracking Number: <span className="font-mono text-black font-black">{order.trackingNumber}</span></p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCourier(order.courier && ['TCS Express', 'Leopards Courier', 'PostEx', 'Trax'].includes(order.courier) ? order.courier : 'Custom');
                  setCustomCourier(order.courier && !['TCS Express', 'Leopards Courier', 'PostEx', 'Trax'].includes(order.courier) ? order.courier : '');
                  setTrackingNumber(order.trackingNumber);
                  setShowCourierForm(true);
                }}
                className="flex items-center space-x-2 border border-gray-200 bg-white px-5 py-3 text-[9px] font-black uppercase tracking-widest rounded-[4px] hover:border-black hover:text-black transition-all"
              >
                <span>Edit Tracking Info</span>
              </button>
            </div>
          )}

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {/* Customer Info */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 border-b border-gray-150 pb-2">
                <User size={14} className="text-black" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-450">Customer Details</h3>
              </div>
              <div className="text-sm">
                <p className="font-black uppercase tracking-tight text-base text-gray-900">{order.customer.name}</p>
                <p className="text-gray-500 font-bold mt-1 lowercase">{order.customer.email}</p>
                <p className="text-gray-550 font-bold mt-1 uppercase tracking-wider font-mono text-[10px]">Phone: {order.customer.phone || 'N/A'}</p>
              </div>
              
              <div className="flex items-center space-x-2 border-b border-gray-150 pb-2 pt-4">
                <MapPin size={14} className="text-black" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-455">Shipping Destination</h3>
              </div>
              <div className="text-xs font-bold text-gray-600 space-y-1.5 uppercase tracking-wider leading-relaxed">
                <p>{order.customer.address}</p>
                <p>{order.customer.city}, {order.customer.zip}</p>
                <p>Pakistan</p>
              </div>
            </div>
 
            {/* Payment & Summary Info */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 border-b border-gray-150 pb-2">
                <CreditCard size={14} className="text-black" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-450">Transaction Details</h3>
              </div>
              <div className="bg-gray-50 p-5 border-l-2 border-black space-y-2 uppercase tracking-wide text-[9px] font-bold text-gray-500 rounded-r-[4px]">
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
                    <p className="text-xs font-black text-black mt-0.5 font-mono">
                      {order.paymentDetails.paymentAccount}
                      {order.paymentDetails.cardBrand ? ` (${order.paymentDetails.cardBrand})` : ''}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[8px] font-black text-gray-400">Payment Status</p>
                  <span className={`inline-block px-2.5 py-0.5 text-[8px] font-black text-white mt-1.5 rounded-[2px] ${
                    paymentStatus === 'Paid' ? 'bg-[#346538]' :
                    paymentStatus === 'Refunded' ? 'bg-[#9F2F2D]' :
                    paymentStatus === 'Failed' ? 'bg-black' : 'bg-amber-600'
                  }`}>
                    {paymentStatus}
                  </span>
                </div>
              </div>
              
              <div className="bg-black text-white p-6 rounded-[4px] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-2 relative z-10 font-mono">Total Amount Due</p>
                <p className="text-3xl font-black relative z-10 font-mono">PKR {Number(order.total ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* Itemized list */}
          <div className="mt-12">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-450 mb-6 flex items-center space-x-2">
              <ShoppingBag size={13} className="text-black" />
              <span>Itemized Consumption</span>
            </h3>
            <div className="border border-gray-150 rounded-[4px] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                    <th className="p-4">SKU/ID</th>
                    <th className="p-4">Product Specification</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4 text-right">Unit Price</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <tr key={item.id} className="text-xs">
                      {/* Product SKU */}
                      <td className="p-4 font-mono text-[10px] font-bold text-gray-500">#{item.id}</td>
                      
                      {/* Image + Description spec details */}
                      <td className="p-4">
                        <div className="flex items-center">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-9 h-9 object-cover rounded-[3px] border border-gray-150 mr-3 flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-[3px] border border-gray-150 bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 font-mono mr-3 flex-shrink-0">
                              {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-black uppercase tracking-tight text-gray-900">{item.name}</span>
                            {(item.selectedColor || item.selectedSize) && (
                              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                {item.selectedColor && `Color: ${item.selectedColor.includes('|') ? item.selectedColor.split('|')[1] : item.selectedColor}`}
                                {item.selectedColor && item.selectedSize && ' · '}
                                {item.selectedSize && `Size: ${item.selectedSize}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold text-gray-400 font-mono">{item.quantity || 1}</td>
                      <td className="p-4 text-right font-bold text-gray-400 font-mono">PKR {Number(item.price ?? 0).toLocaleString('en-PK')}</td>
                      <td className="p-4 text-right font-black text-gray-900 font-mono">PKR {Number(item.price * (item.quantity || 1)).toLocaleString('en-PK')}</td>
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
