import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Package, Truck, User, MapPin, CreditCard, Calendar, ShoppingBag, Clock, ShieldCheck, RefreshCcw, Loader, ArrowRight, Ban } from 'lucide-react';
import { apiUrl } from '../config/api';

const OrderDetails = ({ order, isOpen, onClose, onStatusUpdated, isStatic }) => {
  const [mounted, setMounted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showCourierForm, setShowCourierForm] = useState(false);
  const [courier, setCourier] = useState('TCS Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [customCourier, setCustomCourier] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

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
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen || !order) return null;

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

  // Determine valid statuses
  const isCod = order.paymentMethod === 'COD';
  const validStatuses = ['Pending', 'Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Paid', 'Failed', 'Refunded'];

  const paymentStatus = order.paymentDetails?.status || 'Pending';
  const hasManualTid = !isCod && order.paymentDetails?.transactionID && !order.paymentDetails.transactionID.startsWith('EP-DIR') && !order.paymentDetails.transactionID.startsWith('TXN-CARD');

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

  return createPortal(
    <>
      {/* Frosted Glass Backdrop — blurs/hides orders page behind sidebar, blocks actions/scrolling */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md print:hidden animate-fade-in cursor-pointer"
        style={{ willChange: 'opacity, backdrop-filter' }}
      />

      {/* Spacious Order Details Center Panel Wrapper */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 pointer-events-none print:static print:bg-white print:p-0">
        <div 
          className="w-full max-w-7xl h-[88vh] bg-white border border-gray-150 rounded-[8px] shadow-2xl flex flex-col pointer-events-auto print:static print:border-none print:w-full print:shadow-none animate-scale-in"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Sticky Header - Hidden on Print */}
          <div className="flex-shrink-0 flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-white z-10 print:hidden">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-[4px] bg-black text-white flex items-center justify-center">
                <Package size={16} />
              </div>
              <div>
                <h2 className="text-base font-black uppercase tracking-tight text-gray-900">Order Management & Fulfillment</h2>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Control console & invoice details center</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-[4px] transition-all text-gray-450 hover:text-black active:scale-95 border border-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Body Content Section */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 print:p-0 bg-gray-50/20">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT COLUMN: Order Management Form (print:hidden) */}
          <div className="lg:col-span-5 space-y-6 print:hidden">
            
            {/* Order Status & Actions Form Card */}
            <div className="bg-gray-50 p-6 rounded-[4px] border border-gray-150 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-black" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Status & Actions</h3>
                </div>
                
                {/* Status Dropdown */}
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

              {/* Status Indicator */}
              <div className="flex items-center justify-between bg-white border border-gray-150 p-3 rounded-[3px]">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Order Status</span>
                <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest ${statusColors[order.status] || 'bg-gray-50 border-gray-200 text-gray-650'}`}>
                  {order.status}
                </span>
              </div>

              {/* Workflow Actions */}
              <div className="border-t border-gray-200/60 pt-3">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Workflow Actions</p>
                <div className="flex flex-wrap gap-2">
                  {order.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('Confirmed')}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center space-x-1.5 bg-black text-white px-3 py-2 text-[8px] font-black uppercase tracking-widest rounded-[3px] hover:bg-black/90 transition-all"
                      >
                        <ShieldCheck size={10} />
                        <span>Confirm Order</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange('Cancelled')}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center space-x-1.5 bg-white border border-[#F9CFCF] text-[#9F2F2D] px-3 py-2 text-[8px] font-black uppercase tracking-widest rounded-[3px] hover:bg-[#FDEBEC] transition-all"
                      >
                        <Ban size={10} />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}

                  {((isCod && order.status === 'Confirmed') || order.status === 'Processing' || (isCod && order.status === 'Pending')) && (
                    <button
                      onClick={() => setShowCourierForm(true)}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center space-x-1.5 bg-black text-white px-3 py-2.5 text-[8px] font-black uppercase tracking-widest rounded-[3px] hover:bg-black/90 transition-all"
                    >
                      <Truck size={10} />
                      <span>Ship Shipment</span>
                    </button>
                  )}

                  {order.status === 'Shipped' && (
                    <button
                      onClick={() => handleStatusChange('Delivered')}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center space-x-1.5 bg-black text-white px-3 py-2.5 text-[8px] font-black uppercase tracking-widest rounded-[3px] hover:bg-black/90 transition-all"
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

              {/* Quick Action Buttons */}
              <div className="flex gap-2 border-t border-gray-200/60 pt-3 w-full">
                {isCod && paymentStatus === 'Pending' && (
                  <button
                    onClick={handleMarkCodPaid}
                    disabled={isUpdating}
                    className="flex-1 bg-black text-white px-3 py-2 text-[8px] font-black uppercase tracking-widest rounded-[3px] hover:bg-black/90 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <CreditCard size={10} />
                    <span>COD Paid</span>
                  </button>
                )}
                {!isCod && paymentStatus === 'Paid' && order.status !== 'Refunded' && (
                  <button
                    onClick={handleRefund}
                    disabled={isRefunding}
                    className="flex-1 bg-[#FDEBEC] border border-[#F9CFCF] text-[#9F2F2D] px-3 py-2 text-[8px] font-black uppercase tracking-widest rounded-[3px] hover:brightness-110 transition-all flex items-center justify-center space-x-1.5"
                  >
                    {isRefunding ? <Loader size={10} className="animate-spin" /> : <RefreshCcw size={10} />}
                    <span>Refund</span>
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="flex-1 border border-gray-255 text-gray-700 bg-white px-3 py-2 text-[8px] font-black uppercase tracking-widest rounded-[3px] hover:border-black hover:text-black transition-all flex items-center justify-center space-x-1.5"
                >
                  <Printer size={10} />
                  <span>Print Invoice</span>
                </button>
              </div>
            </div>

            {/* Courier Form */}
            {showCourierForm && (
              <div className="p-6 bg-gray-50 border border-gray-150 rounded-[4px] animate-scale-in space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-black">Dispatch Details</p>
                  
                  <button
                    type="button"
                    onClick={triggerMockShipment}
                    disabled={isUpdating}
                    className="px-2 py-1 bg-black text-white hover:bg-black/90 transition-all text-[8px] font-black uppercase tracking-widest rounded-[3px] flex items-center space-x-1"
                  >
                    <ArrowRight size={9} />
                    <span>Auto-Ship</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Select Courier</label>
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
                      <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Custom Courier Name</label>
                      <input
                        type="text"
                        placeholder="Courier name"
                        value={customCourier}
                        onChange={(e) => setCustomCourier(e.target.value)}
                        className="w-full bg-white border border-gray-200 px-3 py-2 text-xs font-bold focus:border-black outline-none rounded-[3px]"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Tracking Number</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Tracking reference"
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
                        className="px-2.5 py-2 border border-gray-200 bg-white hover:border-black hover:text-black transition-all text-[8px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap rounded-[3px]"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 border-t border-gray-150 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCourierForm(false);
                      setCourier(order.courier && ['TCS Express', 'Leopards Courier', 'PostEx', 'Trax'].includes(order.courier) ? order.courier : (order.courier ? 'Custom' : 'TCS Express'));
                      setCustomCourier(order.courier && !['TCS Express', 'Leopards Courier', 'PostEx', 'Trax'].includes(order.courier) ? order.courier : '');
                      setTrackingNumber(order.trackingNumber || '');
                    }}
                    className="px-3 py-2 border border-gray-255 text-gray-500 bg-white hover:border-black hover:text-black transition-all text-[8px] font-black uppercase tracking-widest rounded-[3px]"
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
                    className="px-3 py-2 bg-black text-white hover:bg-black/95 transition-all text-[8px] font-black uppercase tracking-widest rounded-[3px] disabled:opacity-50"
                  >
                    Save &amp; Ship
                  </button>
                </div>
              </div>
            )}

            {/* Shipment Info Display */}
            {order.status === 'Shipped' && order.courier && order.trackingNumber && !showCourierForm && (
              <div className="p-6 bg-[#FAF9F5] border border-gray-150 rounded-[4px] flex flex-col sm:flex-row items-center justify-between gap-4">
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
                  className="flex items-center space-x-2 border border-gray-200 bg-white px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-[3px] hover:border-black hover:text-black transition-all"
                >
                  <span>Edit Info</span>
                </button>
              </div>
            )}

            {/* Verification Banner if manual transaction ID is pending */}
            {hasManualTid && paymentStatus === 'Pending' && (
              <div className="p-6 bg-[#FAF9F5] border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#956400] mb-1">Manual Payment Pending Verification</p>
                  <p className="text-xs font-bold text-gray-700">Transaction ID: <span className="font-mono text-black font-black">{order.paymentDetails?.transactionID}</span></p>
                </div>
                <button
                  onClick={handleVerifyManualPayment}
                  disabled={isVerifying}
                  className="flex items-center space-x-2 bg-black text-white px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-[3px] hover:bg-black/90 transition-all disabled:opacity-50"
                >
                  {isVerifying ? <Loader size={12} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>Verify Paid</span>
                </button>
              </div>
            )}

            {/* Customer Details Card */}
            <div className="bg-gray-50 p-6 rounded-[4px] border border-gray-150 space-y-4">
              <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
                <User size={14} className="text-black" />
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-450">Customer Details</h3>
              </div>
              <div className="text-xs space-y-1">
                <p className="font-black uppercase tracking-tight text-gray-900 text-sm">{order.customer.name}</p>
                <p className="text-gray-550 font-bold mt-1 lowercase">{order.customer.email}</p>
                <p className="text-gray-550 font-bold uppercase tracking-wider font-mono text-[9px]">Phone: {order.customer.phone || 'N/A'}</p>
              </div>
              
              <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 pt-2">
                <MapPin size={14} className="text-black" />
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-455">Shipping Destination</h3>
              </div>
              <div className="text-xs font-bold text-gray-600 space-y-1 uppercase tracking-wider leading-relaxed">
                <p>{order.customer.address}</p>
                <p>{order.customer.city}, {order.customer.zip}</p>
                <p>Pakistan</p>
              </div>
            </div>

          </div>
          
          {/* RIGHT COLUMN: Invoice View (full width on print) */}
          <div className="lg:col-span-7 space-y-8 print:w-full">
            
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8 border-b-2 border-black pb-8">
              <div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-black font-serif">Stop & Shop</h1>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mt-1">International Logistics • Pakistan Edition</p>
                <div className="mt-4 space-y-0.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-normal">
                  <p>Glorious Shopping Mall, GT Rd</p>
                  <p>Gujrat, Pakistan 50700</p>
                  <p>order@stopshop.pk</p>
                </div>
              </div>
              <div className="mt-6 sm:mt-0 text-right">
                <div className="relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 font-mono">Order Reference</p>
                  <p className="text-xl font-black text-black font-mono mt-0.5">{order.orderID || order._id}</p>
                  <div className="flex items-center justify-end space-x-1.5 mt-3 text-[9px] font-black uppercase tracking-widest text-gray-400 italic">
                    <Calendar size={10} />
                    <span>Issued: {new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction details & Total Amount Due */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 border-l-2 border-black space-y-2 uppercase tracking-wide text-[9px] font-bold text-gray-500 rounded-r-[3px]">
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

              <div className="bg-black text-white p-6 rounded-[4px] flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mb-1 relative z-10 font-mono">Total Amount Due</p>
                <p className="text-2xl font-black relative z-10 font-mono">PKR {Number(order.total ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Itemized List Table */}
            <div className="mt-8">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-450 mb-4 flex items-center space-x-2">
                <ShoppingBag size={12} className="text-black" />
                <span>Itemized Consumption</span>
              </h3>
              <div className="border border-gray-150 rounded-[4px] overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                      <th className="p-3 pl-4">SKU/ID</th>
                      <th className="p-3">Product Specification</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right pr-4">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item) => (
                      <tr key={item.id} className="text-xs">
                        <td className="p-3 pl-4 font-mono text-[10px] font-bold text-gray-500">#{item.id}</td>
                        <td className="p-3">
                          <div className="flex items-center">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded-[3px] border border-gray-150 mr-3 flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-[3px] border border-gray-150 bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 font-mono mr-3 flex-shrink-0">
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
                        <td className="p-3 text-center font-bold text-gray-400 font-mono">{item.quantity || 1}</td>
                        <td className="p-3 text-right font-bold text-gray-400 font-mono">PKR {Number(item.price ?? 0).toLocaleString('en-PK')}</td>
                        <td className="p-3 text-right font-black text-gray-900 font-mono pr-4">PKR {Number(item.price * (item.quantity || 1)).toLocaleString('en-PK')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Branding */}
            <div className="pt-8 border-t border-gray-150 text-center space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="h-[1px] w-8 bg-black"></div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black">Authentic Supply Chain</p>
                <div className="h-[1px] w-8 bg-black"></div>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Thank you for choosing Stop & Shop. This is a computer-generated invoice.
              </p>
            </div>

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
      </div>
    </>
  , document.body);
};


export default OrderDetails;
