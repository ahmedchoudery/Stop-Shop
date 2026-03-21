import React, { useState } from 'react';
import { X, Printer, Package, Truck, User, MapPin, CreditCard, Calendar } from 'lucide-react';

const OrderDetails = ({ order, isOpen, onClose, onStatusUpdated }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !order) return null;

  const handleStatusToggle = async () => {
    const newStatus = order.status === 'Pending' ? 'Shipped' : 'Pending';
    const token = localStorage.getItem('adminToken');
    
    setIsUpdating(true);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/60 backdrop-blur-sm print:static print:bg-white print:p-0">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl relative print:shadow-none print:max-h-none print:overflow-visible print:w-full">
        
        {/* Header - Hidden on Print */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10 print:hidden">
          <div className="flex items-center space-x-3">
            <Package className="text-red-600" size={24} />
            <h2 className="text-xl font-black uppercase tracking-tighter">Order Details</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-8 sm:p-12 print:p-0">
          
          {/* Invoice Header (Brand Focus) */}
          <div className="flex flex-col sm:flex-row justify-between items-start mb-12 border-b-4 border-red-600 pb-8">
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-red-600">Stop & Shop</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-1">International Logistics • Gujarat Business</p>
              <div className="mt-6 space-y-1 text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                <p>123 Business Hub, SG Highway</p>
                <p>Ahmedabad, Gujarat 380054</p>
                <p>contact@stop-shop.in</p>
              </div>
            </div>
            <div className="mt-8 sm:mt-0 text-right">
              <h2 className="text-5xl font-black text-gray-100 uppercase tracking-tighter absolute right-12 opacity-50 print:opacity-20 translate-y-[-10px] hidden sm:block">Invoice</h2>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Reference</p>
                <p className="text-2xl font-black text-red-600 font-mono mt-1">{order.orderID}</p>
                <div className="flex items-center justify-end space-x-2 mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
                  <Calendar size={12} />
                  <span>Issued: {new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Controls - Hidden on Print */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 print:hidden">
            {/* Status Toggle Card */}
            <div className="bg-gray-50 p-6 rounded-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${order.status === 'Shipped' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {order.status === 'Shipped' ? <Truck size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Status</p>
                  <p className="text-sm font-black uppercase tracking-tight">{order.status}</p>
                </div>
              </div>
              <button
                onClick={handleStatusToggle}
                disabled={isUpdating}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all shadow-md ${
                  order.status === 'Shipped' 
                    ? 'bg-gray-200 text-gray-600 hover:bg-yellow-400 hover:text-red-950' 
                    : 'bg-red-600 text-white hover:brightness-110'
                }`}
              >
                {isUpdating ? 'Updating...' : order.status === 'Shipped' ? 'Mark Pending' : 'Mark Shipped'}
              </button>
            </div>

            {/* Print Card */}
            <div className="bg-red-50 p-6 rounded-sm border border-red-100 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-red-600">
                <Printer size={24} />
                <p className="text-sm font-black uppercase tracking-widest">Printer-Friendly Version</p>
              </div>
              <button
                onClick={handlePrint}
                className="bg-red-600 text-white px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm hover:brightness-110 transition-all shadow-lg"
              >
                Print Invoice
              </button>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {/* Customer Info */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                <User size={16} className="text-red-600" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Customer Details</h3>
              </div>
              <div className="text-sm">
                <p className="font-black uppercase tracking-tight text-lg text-gray-900">{order.customer.name}</p>
                <p className="text-gray-500 font-bold mt-1 lowercase">{order.customer.email}</p>
              </div>
              
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2 pt-4">
                <MapPin size={16} className="text-red-600" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Shipping Destination</h3>
              </div>
              <div className="text-xs font-bold text-gray-600 space-y-1 uppercase tracking-wider leading-relaxed">
                <p>{order.customer.address}</p>
                <p>{order.customer.city}, {order.customer.zip}</p>
                <p>Gujarat, India</p>
              </div>
            </div>

            {/* Payment & Summary Info */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                <CreditCard size={16} className="text-red-600" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Transaction Details</h3>
              </div>
              <div className="bg-gray-50 p-4 border-l-4 border-red-600">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Method</p>
                <p className="text-sm font-black uppercase tracking-tight mt-1">{order.paymentMethod || 'Credit Card (Stripe)'}</p>
              </div>
              
              <div className="bg-red-900 text-white p-6 rounded-sm shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-200 mb-2 relative z-10">Total Amount Paid</p>
                <p className="text-4xl font-black relative z-10 font-mono">${order.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-12">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center space-x-2">
              <ShoppingBag size={14} className="text-red-600" />
              <span>Itemized Consumption</span>
            </h3>
            <div className="border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <th className="p-4">SKU/ID</th>
                    <th className="p-4">Product Specification</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <tr key={item.id} className="text-sm">
                      <td className="p-4 font-mono text-[10px] font-bold text-red-600">{item.id}</td>
                      <td className="p-4 font-black uppercase tracking-tight text-gray-900">{item.name}</td>
                      <td className="p-4 text-center font-bold text-gray-400">{item.quantity || 1}</td>
                      <td className="p-4 text-right font-black text-gray-900">${item.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Branding - Visible on Print */}
          <div className="mt-20 pt-12 border-t border-gray-100 text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="h-1 w-12 bg-red-600"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600">Authentic Supply Chain</p>
              <div className="h-1 w-12 bg-red-600"></div>
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
