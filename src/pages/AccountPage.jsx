/**
 * @fileoverview AccountPage.jsx
 * Route: /account
 * Protected — redirects to /account/login if not logged in.
 *
 * Tabs:
 *  - Orders     → full order history with status badges
 *  - Profile    → edit name, phone
 *  - Address    → saved delivery address
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Package, MapPin, LogOut, ChevronRight,
  Edit3, Check, X, Loader, ShoppingBag, Clock,
  Truck, CheckCircle, AlertCircle, ArrowLeft,
  Star, RefreshCw
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';

// ─────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  Pending:    { icon: Clock,         cls: 'bg-amber-50 text-amber-600 border-amber-200'   },
  Processing: { icon: Package,       cls: 'bg-blue-50 text-blue-600 border-blue-200'     },
  Shipped:    { icon: Truck,         cls: 'bg-purple-50 text-purple-700 border-purple-200'},
  Delivered:  { icon: CheckCircle,   cls: 'bg-green-50 text-green-700 border-green-200'  },
  Cancelled:  { icon: AlertCircle,   cls: 'bg-red-50 text-red-500 border-red-200'        },
};

const StatusBadge = ({ status }) => {
  const cfg    = STATUS_MAP[status] ?? STATUS_MAP.Pending;
  const Icon   = cfg.icon;
  return (
    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${cfg.cls}`}>
      <Icon size={10} />
      <span>{status}</span>
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────
// ORDERS TAB
// ─────────────────────────────────────────────────────────────────

const OrdersTab = () => {
  const { fetchOrders } = useCustomer();
  const { formatPrice }  = useCurrency();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [fetchOrders]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader size={24} className="animate-spin text-[#ba1f3d]" />
    </div>
  );

  if (!orders.length) return (
    <div className="text-center py-20">
      <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
      <p className="font-black uppercase tracking-tight text-gray-900 mb-2">No orders yet</p>
      <p className="text-sm text-gray-400 font-bold mb-8">Your order history will appear here after your first purchase.</p>
      <Link
        to="/"
        className="inline-flex items-center space-x-2 px-8 py-4 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
      >
        <span>Start Shopping</span>
      </Link>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">
          {orders.length} order{orders.length !== 1 ? 's' : ''} total
        </p>
        <button onClick={load} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
          <RefreshCw size={13} />
        </button>
      </div>

      {orders.map(order => {
        const isOpen = expanded === order._id;
        return (
          <div key={order._id} className="border border-gray-100 rounded-sm overflow-hidden hover:border-gray-200 transition-colors">
            {/* Order row */}
            <button
              onClick={() => setExpanded(isOpen ? null : order._id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-mono text-xs font-bold text-[#ba1f3d]">
                    {order.orderID || order._id?.toString().slice(-8).toUpperCase()}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'
                    }
                    {' · '}
                    {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <StatusBadge status={order.status} />
                <p className="text-sm font-black text-gray-900">
                  {formatPrice(order.total ?? 0)}
                </p>
                <ChevronRight
                  size={14}
                  className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
                />
              </div>
            </button>

            {/* Expanded items */}
            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50 animate-fade-up">
                <div className="space-y-3 mb-4">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-10 h-12 bg-gray-200 flex-shrink-0 overflow-hidden rounded-sm">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-black uppercase tracking-tight text-gray-900 truncate">{item.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                          {item.selectedSize && `Size: ${item.selectedSize}`}
                          {item.selectedSize && item.selectedColor && ' · '}
                          {item.selectedColor && `Color: ${item.selectedColor.split('|').pop()}`}
                          {' · Qty: '}{item.quantity ?? 1}
                        </p>
                      </div>
                      <p className="text-xs font-black text-gray-900 flex-shrink-0">
                        {formatPrice((item.price ?? 0) * (item.quantity ?? 1))}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest space-y-0.5">
                    <p>Payment: {order.paymentMethod ?? '—'}</p>
                    <p>Deliver to: {order.customer?.city ?? '—'}</p>
                  </div>
                  <Link
                    to={`/track?orderID=${order.orderID || order._id}`}
                    className="flex items-center space-x-1 px-4 py-2 border border-gray-900 text-gray-900 text-[9px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all"
                  >
                    <span>Track Order</span>
                    <ChevronRight size={11} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// PROFILE TAB
// ─────────────────────────────────────────────────────────────────

const ProfileTab = () => {
  const { customer, updateProfile } = useCustomer();
  const [form,    setForm]    = useState({ name: customer?.name ?? '', phone: customer?.phone ?? '' });
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await updateProfile({ name: form.name.trim(), phone: form.phone.trim() });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border-b-2 border-gray-200 focus:border-[#ba1f3d] py-3 text-sm font-bold bg-transparent outline-none transition-all placeholder:text-gray-300';

  return (
    <div className="max-w-lg space-y-8">
      {/* Avatar */}
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-[#ba1f3d] rounded-full flex items-center justify-center text-white text-xl font-black flex-shrink-0">
          {(customer?.name ?? 'C').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-black uppercase tracking-tight text-gray-900 text-lg">{customer?.name}</p>
          <p className="text-sm font-bold text-gray-400">{customer?.email}</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-5">
        <div>
          <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 block mb-1">Full Name</label>
          {editing ? (
            <input
              type="text"
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError(''); }}
              className={inputCls}
              autoFocus
            />
          ) : (
            <p className="text-sm font-bold text-gray-900 py-3 border-b-2 border-gray-100">{customer?.name || '—'}</p>
          )}
        </div>

        <div>
          <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 block mb-1">Email</label>
          <p className="text-sm font-bold text-gray-400 py-3 border-b-2 border-gray-100">{customer?.email} <span className="text-[9px] text-gray-300">(cannot change)</span></p>
        </div>

        <div>
          <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 block mb-1">Phone</label>
          {editing ? (
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="0300-0000000"
              className={inputCls}
            />
          ) : (
            <p className="text-sm font-bold text-gray-900 py-3 border-b-2 border-gray-100">{customer?.phone || 'Not set'}</p>
          )}
        </div>
      </div>

      {error && <p className="text-xs font-bold text-[#ba1f3d]">{error}</p>}

      <div className="flex space-x-3">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? <Loader size={13} className="animate-spin" /> : <Check size={13} />}
              <span>Save Changes</span>
            </button>
            <button onClick={() => { setEditing(false); setError(''); setForm({ name: customer?.name ?? '', phone: customer?.phone ?? '' }); }}
              className="px-6 py-3 border-2 border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:border-gray-900 transition-all">
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className={`flex items-center space-x-2 px-6 py-3 border-2 border-gray-900 text-gray-900 text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all ${saved ? 'border-green-600 text-green-600' : ''}`}
          >
            {saved ? <Check size={13} /> : <Edit3 size={13} />}
            <span>{saved ? 'Saved!' : 'Edit Profile'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// ADDRESS TAB
// ─────────────────────────────────────────────────────────────────

const AddressTab = () => {
  const { customer, updateProfile } = useCustomer();
  const [form,    setForm]    = useState({
    address: customer?.address ?? '',
    city:    customer?.city    ?? '',
    zip:     customer?.zip     ?? '',
  });
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  const hasAddress = customer?.address || customer?.city;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateProfile(form);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border-b-2 border-gray-200 focus:border-[#ba1f3d] py-3 text-sm font-bold bg-transparent outline-none transition-all placeholder:text-gray-300';

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">Saved Address</p>
        <p className="text-sm text-gray-500 font-bold">
          Your saved address is auto-filled at checkout.
        </p>
      </div>

      {!editing && (
        <div className="p-5 bg-gray-50 border border-gray-100 rounded-sm">
          {hasAddress ? (
            <div className="flex items-start space-x-3">
              <MapPin size={16} className="text-[#ba1f3d] mt-0.5 flex-shrink-0" />
              <div className="text-sm font-bold text-gray-700 space-y-0.5">
                <p>{customer.address}</p>
                <p>{[customer.city, customer.zip].filter(Boolean).join(', ')}</p>
                <p className="text-gray-400">Pakistan</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-gray-400">
              <MapPin size={16} />
              <p className="text-sm font-bold">No address saved yet</p>
            </div>
          )}
        </div>
      )}

      {editing && (
        <div className="space-y-5 animate-fade-up">
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 block mb-1">Street Address</label>
            <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="House #, Street, Area" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 block mb-1">City</label>
              <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Lahore" className={inputCls} />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 block mb-1">ZIP Code</label>
              <input type="text" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))}
                placeholder="54000" className={inputCls} />
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs font-bold text-[#ba1f3d]">{error}</p>}

      <div className="flex space-x-3">
        {editing ? (
          <>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50">
              {saving ? <Loader size={13} className="animate-spin" /> : <Check size={13} />}
              <span>Save Address</span>
            </button>
            <button onClick={() => setEditing(false)}
              className="px-6 py-3 border-2 border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:border-gray-900 transition-all">
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)}
            className={`flex items-center space-x-2 px-6 py-3 border-2 border-gray-900 text-gray-900 text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all ${saved ? 'border-green-600 text-green-600' : ''}`}>
            {saved ? <Check size={13} /> : <Edit3 size={13} />}
            <span>{saved ? 'Saved!' : (hasAddress ? 'Edit Address' : 'Add Address')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'orders',  label: 'My Orders',  icon: Package },
  { id: 'profile', label: 'Profile',    icon: User    },
  { id: 'address', label: 'Address',    icon: MapPin  },
];

const AccountPage = () => {
  const { customer, isLoggedIn, logout } = useCustomer();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    if (!isLoggedIn) navigate('/account/login', { replace: true });
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors mb-6 text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft size={13} />
            <span>Continue Shopping</span>
          </button>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">My Account</p>
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            Welcome, {customer?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-400 font-bold text-sm mt-1">{customer?.email}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row gap-8">

          {/* Sidebar Nav */}
          <aside className="sm:w-48 flex-shrink-0">
            <nav className="space-y-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-left transition-all rounded-sm ${
                    activeTab === id
                      ? 'bg-[#ba1f3d] text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}

              <div className="h-px bg-gray-100 my-3" />

              <button
                onClick={() => { logout(); navigate('/'); }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#ba1f3d] hover:bg-red-50 transition-all text-left rounded-sm"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-grow min-w-0">
            {activeTab === 'orders'  && <OrdersTab  />}
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'address' && <AddressTab />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;