/**
 * @fileoverview AdminInventory — Stock management page
 * Fix: replaced require('animejs') with ESM import — success flash and stock indicators now animate correctly
 * Applies: react-ui-patterns (inline edit, optimistic update feedback),
 *          design-spells (success flash, stock level color coding, search with debounce)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import anime from 'animejs';
import { Search, Package, AlertTriangle, X, Filter } from 'lucide-react';
import { AsyncContent } from '../components/ErrorBoundary.tsx';
import InventoryHealthChart from '../components/InventoryHealthChart.jsx';
import { authFetch, handleAuthError } from '../lib/auth.js';
import { apiUrl } from '../config/api.js';
import { useDebounce, useTimeout } from '../hooks/useUtils.js';
import { EASING } from '../hooks/useAnime.js';
import { getColorName, getBackgroundStyle } from '../utils/color-namer.js';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchRaw, setSearchRaw] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [savedIds, setSavedIds] = useState(new Set());
  const [expandedIds, setExpandedIds] = useState(new Set());
  
  // Low stock alert states
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('inventory'); // 'inventory' | 'alerts'
  const [globalThreshold, setGlobalThreshold] = useState(5);
  const [restockInput, setRestockInput] = useState({});
  const [restockModalAlert, setRestockModalAlert] = useState(null);
  const [multiRestockMatrix, setMultiRestockMatrix] = useState({});
  const [restockColor, setRestockColor] = useState('');
  const [restockSize, setRestockSize] = useState('');
  const [restockQty, setRestockQty] = useState(50);
  
  const searchTerm = useDebounce(searchRaw, 250);
  const flashTimeout = useTimeout();

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await authFetch(apiUrl('/api/admin/inventory?type=alerts'));
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err.message);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(apiUrl('/api/admin/products'));
      if (handleAuthError(res.status)) return;
      if (!res.ok) throw new Error('Failed to fetch inventory');
      const data = await res.json();
      setProducts(data);

      const settingsRes = await authFetch(apiUrl('/api/v1/public/settings'));
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setGlobalThreshold(settingsData?.lowStockThreshold ?? 5);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchAlerts();
  }, [fetchProducts, fetchAlerts]);

  const handleSnooze = async (alertId) => {
    try {
      const res = await authFetch(apiUrl('/api/admin/inventory'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'snooze', alertId }),
      });
      if (res.ok) {
        alert('Alert successfully snoozed for 7 days!');
        fetchAlerts();
        fetchProducts();
      }
    } catch (err) {
      alert('Snooze failed: ' + err.message);
    }
  };

  const handleUnsnooze = async (alertId) => {
    try {
      const res = await authFetch(apiUrl('/api/admin/inventory'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsnooze', alertId }),
      });
      if (res.ok) {
        alert('Alert unsnoozed successfully!');
        fetchAlerts();
        fetchProducts();
      }
    } catch (err) {
      alert('Unsnooze failed: ' + err.message);
    }
  };

  const handleRestock = async (alertId, customQty = 50) => {
    try {
      const res = await authFetch(apiUrl('/api/admin/inventory'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restock', alertId, quantity: customQty }),
      });
      if (res.ok) {
        alert(`Successfully restocked +${customQty} units!`);
        fetchAlerts();
        fetchProducts();
      }
    } catch (err) {
      alert('Restock failed: ' + err.message);
    }
  };

  const openRestockModal = (alert) => {
    setRestockModalAlert(alert);
    const initial = {};
    if (alert.colors?.length > 0 && alert.sizes?.length > 0) {
      alert.colors.forEach(c => alert.sizes.forEach(s => { initial[`${c}|${s}`] = 0; }));
    } else if (alert.colors?.length > 0) {
      alert.colors.forEach(c => { initial[`${c}|`] = 0; });
    } else if (alert.sizes?.length > 0) {
      alert.sizes.forEach(s => { initial[`|${s}`] = 0; });
    } else {
      initial['default'] = 50;
    }
    setMultiRestockMatrix(initial);
  };

  const handleConfirmMultiRestock = async (alertId) => {
    const items = [];
    Object.entries(multiRestockMatrix).forEach(([key, qtyVal]) => {
      const qty = parseInt(qtyVal) || 0;
      if (qty <= 0) return;
      if (key === 'default') {
        items.push({ quantity: qty });
      } else if (key.includes('|')) {
        const [color, size] = key.split('|');
        items.push({ color: color || undefined, size: size || undefined, quantity: qty });
      }
    });

    if (items.length === 0) {
      alert('Please enter a quantity greater than 0 for at least one variant!');
      return;
    }

    try {
      const res = await authFetch(apiUrl('/api/admin/inventory'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restock', alertId, items }),
      });
      if (res.ok) {
        alert('Successfully restocked selected variants!');
        setRestockModalAlert(null);
        setMultiRestockMatrix({});
        fetchAlerts();
        fetchProducts();
      }
    } catch (err) {
      alert('Restock failed: ' + err.message);
    }
  };

  const handleRestockDetailed = async ({ alertId, color, size, quantity }) => {
    try {
      const res = await authFetch(apiUrl('/api/admin/inventory'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restock', alertId, color, size, quantity: parseInt(quantity) || 50 }),
      });
      if (res.ok) {
        alert(`Successfully restocked +${quantity} units!`);
        setRestockModalAlert(null);
        fetchAlerts();
        fetchProducts();
      }
    } catch (err) {
      alert('Restock failed: ' + err.message);
    }
  };

  const handleSaveThreshold = async (sku, thresholdVal) => {
    try {
      const res = await authFetch(apiUrl('/api/admin/inventory'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'threshold', sku, threshold: parseInt(thresholdVal) || 0 }),
      });
      if (res.ok) {
        alert(`Successfully set low stock threshold to ${thresholdVal} units!`);
        fetchAlerts();
        fetchProducts();
      }
    } catch (err) {
      alert('Failed to save threshold: ' + err.message);
    }
  };

  const handleSaveGlobalThreshold = async (thresholdVal) => {
    try {
      const res = await authFetch(apiUrl('/api/admin/inventory'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'global-threshold', threshold: parseInt(thresholdVal) || 0 }),
      });
      if (res.ok) {
        alert(`Successfully set global low stock threshold to ${thresholdVal} units!`);
        fetchAlerts();
        fetchProducts();
      }
    } catch (err) {
      alert('Failed to save global threshold: ' + err.message);
    }
  };

  const toggleExpanded = (productId) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleUpdate = useCallback(async (productId, field, value) => {
    let parsed = value;
    if (field === 'quantity' || field === 'discount') {
      parsed = parseInt(value) || 0;
    } else if (field === 'price') {
      parsed = parseFloat(value) || 0;
    }
    
    try {
      const res = await authFetch(apiUrl(`/api/admin/products/${productId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: parsed }),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setProducts(prev => prev.map(p => p.id === productId ? updated : p));

      // Flash success — design spell
      setSavedIds(prev => new Set(prev).add(productId));
      flashTimeout(() => {
        setSavedIds(new Set());
      }, 2000);

      // Spring bounce on the saved indicator
      const el = document.querySelector(`[data-saved="${productId}"]`);
      if (el) anime({ targets: el, scale: [0, 1.2, 1], opacity: [0, 1], duration: 400, easing: EASING.SPRING });

    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  }, [flashTimeout]);

  const handleVariantMatrixChange = (productId, key, val) => {
    const parsedVal = Math.max(0, parseInt(val) || 0);
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const matrix = p.variantMatrix instanceof Map ? Object.fromEntries(p.variantMatrix) : { ...(p.variantMatrix ?? {}) };
        matrix[key] = parsedVal;
        return { ...p, variantMatrix: matrix };
      }
      return p;
    }));
  };

  const handleVariantMatrixSave = async (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const matrix = product.variantMatrix instanceof Map ? Object.fromEntries(product.variantMatrix) : (product.variantMatrix ?? {});
    await handleUpdate(productId, 'variantMatrix', matrix);
  };

  const handleLocalChange = (id, field, value) => {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const inventoryProducts = products.filter(p => p.featuredSection !== 'attitude' && p.bucket !== 'Outfit');

  const filtered = inventoryProducts.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !searchTerm 
      || p.name?.toLowerCase().includes(q) 
      || p.id?.toLowerCase().includes(q);
    
    const matchStock =
      stockFilter === 'all' ? true :
      stockFilter === 'out' ? (p.quantity === 0) :
      stockFilter === 'low' ? (p.quantity > 0 && p.quantity < 5) :
      (p.quantity >= 5);
    return matchSearch && matchStock;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-black mb-2">Stock Control</p>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-gray-900">Inventory</h1>
      </div>

      {/* Chart */}
      <div className="mb-8">
        <InventoryHealthChart products={inventoryProducts} />
      </div>

      {/* View Switcher Tabs */}
      <div className="flex space-x-6 mb-6 border-b border-gray-200 pb-3">
        <button
          onClick={() => setViewMode('inventory')}
          className={`pb-2 px-1 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
            viewMode === 'inventory' ? 'border-black text-black font-black' : 'border-transparent text-gray-400 hover:text-black'
          }`}
        >
          Product Inventory
        </button>
        <button
          onClick={() => { setViewMode('alerts'); fetchAlerts(); }}
          className={`pb-2 px-1 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center space-x-1.5 ${
            viewMode === 'alerts' ? 'border-black text-black font-black' : 'border-transparent text-gray-400 hover:text-black'
          }`}
        >
          <span>Low-Stock Alerts</span>
          {alerts.filter(a => a.status === 'active').length > 0 && (
            <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[8px] font-black tracking-normal">
              {alerts.filter(a => a.status === 'active').length}
            </span>
          )}
        </button>
      </div>

      {viewMode === 'alerts' ? (
        <div className="bg-white border border-gray-200 rounded-[4px] overflow-hidden">
          <div className="p-4 border-b border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50/50 gap-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Active Low Stock Alerts</h3>
            <div className="flex items-center space-x-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Global Default Threshold:</label>
              <input
                type="number"
                id="inventory-global-threshold"
                name="globalThreshold"
                value={globalThreshold}
                onChange={e => setGlobalThreshold(parseInt(e.target.value) || 0)}
                onBlur={e => handleSaveGlobalThreshold(e.target.value)}
                className="w-16 bg-white border border-gray-300 rounded px-2 py-1 text-xs font-bold font-mono text-center outline-none focus:border-black transition-all"
              />
            </div>
          </div>
          <AsyncContent loading={alertsLoading} error={null} data={alerts} onRetry={fetchAlerts}
            empty={
              <div className="p-16 text-center">
                <Package size={28} className="mx-auto text-gray-200 mb-3" />
                <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-300">
                  No active low stock alerts
                </p>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150">
                    {['Product', 'SKU', 'Variant', 'Stock', 'Threshold', '7-Day Sales', 'Status', 'Actions'].map(h => (
                      <th key={h} className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alerts.map(alert => {
                    const isActive = alert.status === 'active';
                    const isSnoozed = alert.status === 'snoozed';
                    const isRestocked = alert.status === 'restocked';

                    // Compute total stock across all variants
                    const computeTotalStock = () => {
                      const vm = alert.variantMatrix || {};
                      const vmKeys = Object.keys(vm);
                      if (vmKeys.length > 0) return vmKeys.reduce((sum, k) => sum + (parseInt(vm[k]) || 0), 0);
                      const cs = alert.colorStock || {};
                      const csKeys = Object.keys(cs);
                      if (csKeys.length > 0) return csKeys.reduce((sum, k) => sum + (parseInt(cs[k]) || 0), 0);
                      const ss = alert.sizeStock || {};
                      const ssKeys = Object.keys(ss);
                      if (ssKeys.length > 0) return ssKeys.reduce((sum, k) => sum + (parseInt(ss[k]) || 0), 0);
                      return alert.totalProductStock ?? alert.currentStock ?? 0;
                    };
                    const totalStock = computeTotalStock();

                    return (
                      <tr key={alert._id} className={`hover:bg-gray-50/60 transition-colors ${
                        isActive && totalStock === 0 ? 'bg-red-50/30' :
                        isActive ? 'bg-amber-50/20' :
                        isSnoozed ? 'bg-yellow-50/15' :
                        ''
                      }`}>
                        {/* PRODUCT — Name + Image */}
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            {alert.productImage ? (
                              <img
                                src={alert.productImage}
                                alt={alert.productName || 'Product'}
                                className="w-11 h-11 object-cover rounded-[4px] border border-gray-200 flex-shrink-0 shadow-sm"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-11 h-11 bg-gray-100 rounded-[4px] border border-gray-200 flex items-center justify-center flex-shrink-0">
                                <Package size={16} className="text-gray-300" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-[11px] font-black uppercase tracking-tight text-gray-900 block truncate max-w-[180px]" title={alert.productName}>
                                {alert.productName || 'Unnamed Product'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="p-4">
                          <span className="font-mono text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-150">#{alert.sku}</span>
                        </td>

                        {/* VARIANT — Show all colors & sizes this product has */}
                        <td className="p-4">
                          <div className="space-y-1.5 min-w-[140px]">
                            {alert.colors?.length > 0 ? (
                              <div className="space-y-1">
                                {alert.colors.map(col => (
                                  <div key={col} className="flex items-center space-x-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full border border-gray-300 flex-shrink-0" style={getBackgroundStyle(col)} />
                                    <span className="text-[10px] font-bold text-gray-800">{getColorName(col)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            {alert.sizes?.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {alert.sizes.map(sz => (
                                  <span key={sz} className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-black font-mono text-gray-600">{sz}</span>
                                ))}
                              </div>
                            ) : null}
                            {!alert.colors?.length && !alert.sizes?.length && (
                              <span className="text-[10px] font-mono text-gray-400 font-bold">Single variant</span>
                            )}
                          </div>
                        </td>

                        {/* STOCK — Real-time per-color/per-size matrix */}
                        <td className="p-4">
                          <div className="min-w-[180px]">
                            {alert.colors?.length > 0 && alert.sizes?.length > 0 ? (
                              /* Color × Size matrix */
                              <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 space-y-2">
                                {alert.colors.map(col => {
                                  const colName = getColorName(col);
                                  return (
                                    <div key={col}>
                                      <span className="text-[10px] font-extrabold text-gray-900 uppercase block border-b border-gray-200 pb-0.5 mb-1">{colName}:</span>
                                      <div className="flex flex-wrap gap-1">
                                        {alert.sizes.map(sz => {
                                          const qty = parseInt(alert.variantMatrix?.[`${col}|${sz}`]) || 0;
                                          return (
                                            <span key={sz} className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                              qty === 0
                                                ? 'bg-red-100 text-red-700 border border-red-200'
                                                : qty <= (alert.threshold || 5)
                                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                  : 'bg-white border border-gray-200 text-gray-900'
                                            }`}>
                                              {sz}:{qty}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                                <div className="border-t border-gray-200 pt-1 mt-1">
                                  <span className={`text-[10px] font-black font-mono ${
                                    totalStock === 0 ? 'text-red-600' : totalStock <= (alert.threshold || 5) ? 'text-amber-700' : 'text-gray-700'
                                  }`}>Total: {totalStock} units</span>
                                </div>
                              </div>
                            ) : alert.colors?.length > 0 ? (
                              /* Colors only */
                              <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 space-y-1.5">
                                {alert.colors.map(col => {
                                  const colName = getColorName(col);
                                  const qty = parseInt(alert.colorStock?.[col]) || 0;
                                  return (
                                    <div key={col} className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-gray-800">{colName}</span>
                                      <span className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded ${
                                        qty === 0 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-white border border-gray-200 text-gray-900'
                                      }`}>{qty}</span>
                                    </div>
                                  );
                                })}
                                <div className="border-t border-gray-200 pt-1">
                                  <span className="text-[10px] font-black font-mono text-gray-700">Total: {totalStock} units</span>
                                </div>
                              </div>
                            ) : alert.sizes?.length > 0 ? (
                              /* Sizes only */
                              <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5">
                                <div className="flex flex-wrap gap-1.5">
                                  {alert.sizes.map(sz => {
                                    const qty = parseInt(alert.sizeStock?.[sz]) || 0;
                                    return (
                                      <span key={sz} className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                        qty === 0 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-white border border-gray-200 text-gray-900'
                                      }`}>
                                        {sz}:{qty}
                                      </span>
                                    );
                                  })}
                                </div>
                                <div className="border-t border-gray-200 pt-1 mt-1.5">
                                  <span className="text-[10px] font-black font-mono text-gray-700">Total: {totalStock} units</span>
                                </div>
                              </div>
                            ) : (
                              /* No variants — simple stock badge */
                              <span className={`px-2.5 py-1 rounded text-xs font-black font-mono tracking-wide inline-block ${
                                totalStock === 0
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : totalStock <= (alert.threshold || 5)
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-green-100 text-green-800 border border-green-200'
                              }`}>
                                {totalStock} units
                              </span>
                            )}
                          </div>
                        </td>

                        {/* THRESHOLD */}
                        <td className="p-4">
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              id={`threshold-${alert._id || alert.sku}`}
                              name={`threshold-${alert.sku}`}
                              value={alert.threshold}
                              onChange={e => {
                                const val = parseInt(e.target.value) || 0;
                                setAlerts(prev => prev.map(a => a._id === alert._id ? { ...a, threshold: val } : a));
                              }}
                              onBlur={e => handleSaveThreshold(alert.sku, e.target.value)}
                              className="w-14 bg-white border border-gray-200 rounded px-2 py-1 text-xs font-black font-mono text-center outline-none focus:border-black transition-all shadow-2xs"
                            />
                            <span className="text-[9px] font-bold text-gray-400">units</span>
                          </div>
                        </td>

                        {/* 7-DAY SALES */}
                        <td className="p-4">
                          <span className="font-mono text-xs font-bold text-gray-600">{alert.salesVelocity ?? 0}</span>
                          <span className="text-[9px] text-gray-400 font-bold ml-1">units</span>
                        </td>

                        {/* STATUS */}
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-[3px] text-[8px] font-black uppercase tracking-widest ${
                            isActive && totalStock === 0 ? 'bg-red-600 text-white' :
                            isActive ? 'bg-red-100 text-red-700 border border-red-200' :
                            isSnoozed ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                            isRestocked ? 'bg-green-100 text-green-700 border border-green-200' :
                            'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {isActive && totalStock === 0 ? 'SOLD OUT' : alert.status}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openRestockModal(alert)}
                              className="px-3 py-1.5 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-[3px] hover:bg-gray-800 transition-all cursor-pointer shadow-sm whitespace-nowrap"
                            >
                              Restock
                            </button>
                            {isSnoozed ? (
                              <button
                                onClick={() => handleUnsnooze(alert._id)}
                                className="px-3 py-1.5 bg-yellow-100 border border-yellow-300 text-yellow-800 text-[9px] font-black uppercase tracking-widest rounded-[3px] hover:bg-yellow-200 transition-all cursor-pointer shadow-sm whitespace-nowrap"
                                title="Click to reactivate this alert"
                              >
                                Snoozed
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSnooze(alert._id)}
                                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-[9px] font-black uppercase tracking-widest rounded-[3px] hover:border-black hover:text-black transition-all cursor-pointer shadow-sm whitespace-nowrap"
                                title="Snooze this alert for 7 days"
                              >
                                Snooze 7d
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AsyncContent>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                id="inventory-search"
                name="inventorySearch"
                placeholder="Search by name or SKU..."
                value={searchRaw}
                onChange={e => setSearchRaw(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-[4px] py-3 pl-10 pr-10 text-xs font-bold focus:bg-white focus:border-black outline-none transition-all placeholder:text-gray-300"
              />
              {searchRaw && (
                <button onClick={() => setSearchRaw('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Filter size={14} className="text-gray-400" />
              {[
                { value: 'all', label: 'All' },
                { value: 'out', label: 'Sold Out' },
                { value: 'low', label: 'Low Stock' },
                { value: 'in', label: 'In Stock' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStockFilter(opt.value)}
                  className={`px-3 py-2 rounded-[4px] text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                    stockFilter === opt.value
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-[4px] overflow-hidden">
            <AsyncContent loading={loading} error={error} data={filtered} onRetry={fetchProducts}
              empty={
                <div className="p-16 text-center">
                  <Package size={28} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-300">
                    {searchTerm ? 'No products match your search' : 'No products in inventory'}
                  </p>
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150">
                      {['SKU', 'Product', 'Price (PKR)', '% Off', 'Stock', 'Status'].map(h => (
                        <th key={h} className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(product => {
                      const outOfStock = product.quantity === 0;
                      const lowStock = product.quantity > 0 && product.quantity < 5;
                      const saved = savedIds.has(product.id);
                      const isExpanded = expandedIds.has(product.id);
                      
                      const hasMatrix = product.variantMatrix && (
                        product.variantMatrix instanceof Map 
                          ? product.variantMatrix.size > 0 
                          : Object.keys(product.variantMatrix).length > 0
                      );
                      const hasSizes = product.sizes && product.sizes.length > 0;
                      const hasColors = product.colors && product.colors.length > 0;
                      const isVariant = hasMatrix || hasSizes || hasColors;

                      return (
                        <React.Fragment key={product.id}>
                          <tr
                            className={`group transition-colors duration-200 ${outOfStock ? 'bg-red-50/40' : 'hover:bg-gray-50/60'} ${isExpanded ? 'bg-gray-50/30' : ''}`}
                          >
                            {/* SKU */}
                            <td className="p-4 font-mono text-[10px] font-bold text-gray-400">#{product.id}</td>
                            
                            {/* Product details + expand button */}
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                {product.image && (
                                  <img src={product.image} alt={product.name} className="w-9 h-9 object-cover rounded-[4px] border border-gray-150 flex-shrink-0" loading="lazy" />
                                )}
                                <div className="flex flex-col">
                                  <div className="flex items-center">
                                    <span className="text-sm font-black uppercase tracking-tight text-gray-900">{product.name}</span>
                                    {isVariant && (
                                      <button
                                        onClick={() => toggleExpanded(product.id)}
                                        className={`ml-3 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-[3px] border transition-all ${
                                          isExpanded 
                                            ? 'bg-black border-black text-white' 
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-black hover:text-black'
                                        }`}
                                      >
                                        {isExpanded ? 'Hide Matrix' : 'Edit Matrix'}
                                      </button>
                                    )}
                                  </div>
                                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                    {product.bucket || 'General'} · {product.subCategory || 'General'}
                                  </span>
                                </div>
                                {outOfStock && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
                              </div>
                            </td>

                                                        <td className="p-4">
                              <input
                                type="number" step="0.01"
                                id={`price-${product.id}`}
                                name={`price-${product.id}`}
                                value={product.price}
                                onChange={e => handleLocalChange(product.id, 'price', e.target.value)}
                                onBlur={e => handleUpdate(product.id, 'price', e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleUpdate(product.id, 'price', e.target.value)}
                                className="w-24 bg-transparent border-b border-transparent focus:border-black outline-none py-1 text-sm font-black transition-all font-mono"
                              />
                            </td>

                            {/* Discount */}
                            <td className="p-4">
                              <input
                                type="number" min="0" max="100"
                                id={`discount-${product.id}`}
                                name={`discount-${product.id}`}
                                value={product.discount ?? 0}
                                onChange={e => handleLocalChange(product.id, 'discount', e.target.value)}
                                onBlur={e => handleUpdate(product.id, 'discount', e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleUpdate(product.id, 'discount', e.target.value)}
                                className="w-16 bg-transparent border-b border-transparent focus:border-black outline-none py-1 text-sm font-black transition-all font-mono"
                              />
                            </td>

                            {/* Quantity (Stock) */}
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="number"
                                  id={`quantity-${product.id}`}
                                  name={`quantity-${product.id}`}
                                  value={product.quantity}
                                  disabled={isVariant}
                                  onChange={e => handleLocalChange(product.id, 'quantity', e.target.value)}
                                  onBlur={e => handleUpdate(product.id, 'quantity', e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleUpdate(product.id, 'quantity', e.target.value)}
                                  className={`w-20 bg-transparent border-b border-transparent focus:border-black outline-none py-1 text-sm font-black transition-all font-mono ${
                                    isVariant ? 'text-gray-400 cursor-not-allowed border-none' : ''
                                  }`}
                                />
                                {isVariant && (
                                  <span className="text-[7px] font-black uppercase tracking-widest text-gray-450 bg-gray-100 border border-gray-150 px-1.5 py-0.5 rounded-[2px]" title="Determined by variant stocks below">
                                    Synced
                                  </span>
                                )}
                                {saved && (
                                  <span
                                    data-saved={product.id}
                                    className="text-green-500 text-base font-black"
                                    style={{ opacity: 0 }}
                                  >
                                    ✓
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-[4px] text-[8px] font-black uppercase tracking-widest border ${
                                outOfStock
                                  ? 'bg-black border-black text-white'
                                  : lowStock
                                    ? 'bg-[#FDFBEC] border-[#F9CFCF] text-[#9F2F2D]'
                                    : 'bg-[#EDF3EC] border-[#D0E2CE] text-[#346538]'
                              }`}>
                                {outOfStock ? 'Sold Out' : lowStock ? 'Low Stock' : 'In Stock'}
                              </span>
                            </td>
                          </tr>

                          {/* Expandable Variant editor sub-row */}
                          {isExpanded && isVariant && (
                            <tr className="bg-gray-50/50">
                              <td colSpan={6} className="p-6 border-b border-gray-150">
                                <div className="bg-white border border-gray-150 rounded-[4px] p-6 max-w-3xl animate-scale-in">
                                  <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                                    <div>
                                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">
                                        Variant Stock Matrix
                                      </h4>
                                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        Edit quantities below. Changes save to MongoDB automatically on blur or Enter.
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => toggleExpanded(product.id)}
                                      className="p-1 hover:bg-gray-100 rounded-[3px] text-gray-400 hover:text-black transition-all"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>

                                  {/* Matrix Editor: Both colors AND sizes exist */}
                                  {hasMatrix && hasColors && hasSizes && (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left text-[9px] uppercase tracking-wider font-mono">
                                        <thead>
                                          <tr className="border-b border-gray-150 bg-gray-50/60">
                                            <th className="p-2.5 font-black text-gray-900">Color Variant</th>
                                            {product.sizes.map(sz => (
                                              <th key={sz} className="p-2.5 font-black text-gray-900 text-center">{sz}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {product.colors.map(col => {
                                            const colorName = getColorName(col);
                                            return (
                                              <tr key={col} className="border-b border-gray-50 hover:bg-gray-50/30">
                                                <td className="p-2 flex items-center space-x-2">
                                                  <span className="w-2.5 h-2.5 rounded-full border border-gray-250 flex-shrink-0" style={getBackgroundStyle(col)} />
                                                  <span>{colorName}</span>
                                                </td>
                                                {product.sizes.map(sz => {
                                                  const key = `${col}|${sz}`;
                                                  const matrixValue = product.variantMatrix instanceof Map 
                                                    ? (product.variantMatrix.get(key) ?? 0)
                                                    : (product.variantMatrix?.[key] ?? 0);
                                                  return (
                                                    <td key={sz} className="p-2 text-center">
                                                      <input
                                                        type="number"
                                                        min="0"
                                                        id={`matrix-${product.id}-${key.replace(/[^a-zA-Z0-9-]/g, '_')}`}
                                                        name={`matrix-${product.id}-${key.replace(/[^a-zA-Z0-9-]/g, '_')}`}
                                                        value={matrixValue}
                                                        onChange={e => handleVariantMatrixChange(product.id, key, e.target.value)}
                                                        onBlur={() => handleVariantMatrixSave(product.id)}
                                                        onKeyDown={e => e.key === 'Enter' && handleVariantMatrixSave(product.id)}
                                                        className="w-16 bg-gray-50 border-b border-transparent focus:border-black focus:bg-white outline-none py-1 text-center font-black transition-all rounded-[2px]"
                                                      />
                                                    </td>
                                                  );
                                                })}
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {/* Sizes only editor */}
                                  {!hasMatrix && hasSizes && (
                                    <div className="flex flex-wrap gap-6 font-mono text-[9px]">
                                      {product.sizes.map(sz => {
                                        const sizeVal = product.sizeStock instanceof Map
                                          ? (product.sizeStock.get(sz) ?? 0)
                                          : (product.sizeStock?.[sz] ?? 0);
                                        return (
                                          <div key={sz} className="flex flex-col space-y-1.5">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                                              Size {sz}
                                            </label>
                                            <input
                                              type="number"
                                              min="0"
                                              id={`sizeStock-${product.id}-${sz}`}
                                              name={`sizeStock-${product.id}-${sz}`}
                                              value={sizeVal}
                                              onChange={e => {
                                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                                setProducts(prev => prev.map(p => {
                                                  if (p.id === product.id) {
                                                    const stock = p.sizeStock instanceof Map ? Object.fromEntries(p.sizeStock) : { ...(p.sizeStock ?? {}) };
                                                    stock[sz] = val;
                                                    return { ...p, sizeStock: stock };
                                                  }
                                                  return p;
                                                }));
                                              }}
                                              onBlur={() => {
                                                const p = products.find(p => p.id === product.id);
                                                const stock = p?.sizeStock instanceof Map ? Object.fromEntries(p.sizeStock) : (p?.sizeStock ?? {});
                                                handleUpdate(product.id, 'sizeStock', stock);
                                              }}
                                              onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                  const p = products.find(p => p.id === product.id);
                                                  const stock = p?.sizeStock instanceof Map ? Object.fromEntries(p.sizeStock) : (p?.sizeStock ?? {});
                                                  handleUpdate(product.id, 'sizeStock', stock);
                                                }
                                              }}
                                              className="w-24 bg-gray-50 border-b border-transparent focus:border-black focus:bg-white outline-none py-2 px-3 text-center text-xs font-black font-mono transition-all rounded-[2px]"
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Colors only editor */}
                                  {!hasMatrix && hasColors && (
                                    <div className="flex flex-wrap gap-6 font-mono text-[9px]">
                                      {product.colors.map(col => {
                                        const colorVal = product.colorStock instanceof Map
                                          ? (product.colorStock.get(col) ?? 0)
                                          : (product.colorStock?.[col] ?? 0);
                                        return (
                                          <div key={col} className="flex flex-col space-y-1.5">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-1.5">
                                              <span className="w-2 h-2 rounded-full border border-gray-250" style={getBackgroundStyle(col)} />
                                              <span>{getColorName(col)}</span>
                                            </label>
                                            <input
                                              type="number"
                                              min="0"
                                              id={`colorStock-${product.id}-${col.replace(/[^a-zA-Z0-9-]/g, '_')}`}
                                              name={`colorStock-${product.id}-${col.replace(/[^a-zA-Z0-9-]/g, '_')}`}
                                              value={colorVal}
                                              onChange={e => {
                                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                                setProducts(prev => prev.map(p => {
                                                  if (p.id === product.id) {
                                                    const stock = p.colorStock instanceof Map ? Object.fromEntries(p.colorStock) : { ...(p.colorStock ?? {}) };
                                                    stock[col] = val;
                                                    return { ...p, colorStock: stock };
                                                  }
                                                  return p;
                                                }));
                                              }}
                                              onBlur={() => {
                                                const p = products.find(p => p.id === product.id);
                                                const stock = p?.colorStock instanceof Map ? Object.fromEntries(p.colorStock) : (p?.colorStock ?? {});
                                                handleUpdate(product.id, 'colorStock', stock);
                                              }}
                                              onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                  const p = products.find(p => p.id === product.id);
                                                  const stock = p?.colorStock instanceof Map ? Object.fromEntries(p.colorStock) : (p?.colorStock ?? {});
                                                  handleUpdate(product.id, 'colorStock', stock);
                                                }
                                              }}
                                              className="w-24 bg-gray-50 border-b border-transparent focus:border-black focus:bg-white outline-none py-2 px-3 text-center text-xs font-black font-mono transition-all rounded-[2px]"
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </AsyncContent>

            <div className="px-6 py-4 border-t border-gray-150 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
                {filtered.length} of {products.length} products
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">
                Tip: Edit price directly inline. Click "Edit Matrix" on variant products to edit individual size/color stock.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Portaled Multi-Variant Restock Modal (Appears directly centered in viewport without scrolling) */}
      {restockModalAlert && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-gray-200 shadow-2xl max-w-xl w-full p-6 space-y-6 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-150 pb-4">
              <div className="flex items-center space-x-3">
                {restockModalAlert.productImage ? (
                  <img src={restockModalAlert.productImage} alt="" className="w-12 h-12 object-cover rounded border border-gray-200 shadow-2xs" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">IMG</div>
                )}
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-gray-900">{restockModalAlert.productName}</h4>
                  <p className="text-[11px] font-mono font-bold text-gray-400">SKU: #{restockModalAlert.sku}</p>
                </div>
              </div>
              <button onClick={() => setRestockModalAlert(null)} className="text-gray-400 hover:text-gray-900 text-xl font-bold p-1 cursor-pointer">✕</button>
            </div>

            {/* Multi-Variant Matrix Restock Form */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Restock Quantities per Variant</label>
                <button
                  type="button"
                  onClick={() => {
                    const newMatrix = {};
                    if (restockModalAlert.colors?.length > 0 && restockModalAlert.sizes?.length > 0) {
                      restockModalAlert.colors.forEach(c => restockModalAlert.sizes.forEach(s => { newMatrix[`${c}|${s}`] = 50; }));
                    } else if (restockModalAlert.colors?.length > 0) {
                      restockModalAlert.colors.forEach(c => { newMatrix[`${c}|`] = 50; });
                    } else if (restockModalAlert.sizes?.length > 0) {
                      restockModalAlert.sizes.forEach(s => { newMatrix[`|${s}`] = 50; });
                    } else {
                      newMatrix['default'] = 50;
                    }
                    setMultiRestockMatrix(newMatrix);
                  }}
                  className="text-[9px] font-black uppercase tracking-widest bg-gray-100 border border-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-black hover:text-white transition-all cursor-pointer shadow-2xs"
                >
                  +50 To All Variants
                </button>
              </div>

                {restockModalAlert.colors?.length > 0 && restockModalAlert.sizes?.length > 0 ? (
                <div className="space-y-3">
                  {restockModalAlert.colors.map(col => {
                    const colName = getColorName(col);
                    return (
                      <div key={col} className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
                        <div className="flex items-center space-x-2 border-b border-gray-200 pb-1">
                          <span className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" style={getBackgroundStyle(col)} />
                          <span className="font-extrabold text-xs text-gray-900 uppercase tracking-wide">{colName}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {restockModalAlert.sizes.map(sz => {
                            const key = `${col}|${sz}`;
                            const currentVal = multiRestockMatrix[key] ?? 0;
                            return (
                              <div key={sz} className="flex flex-col space-y-1 bg-white border border-gray-200 p-2 rounded">
                                <span className="text-[10px] font-black text-gray-500 font-mono">Size {sz}</span>
                                <input
                                  type="number"
                                  min="0"
                                  id={`restock-matrix-${sz}`}
                                  name={`restockMatrix_${sz}`}
                                  value={currentVal}
                                  onChange={e => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setMultiRestockMatrix(prev => ({ ...prev, [key]: val }));
                                  }}
                                  className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs font-black font-mono text-center outline-none focus:border-black"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : restockModalAlert.colors?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {restockModalAlert.colors.map(col => {
                    const colName = getColorName(col);
                    const key = `${col}|`;
                    const currentVal = multiRestockMatrix[key] ?? 0;
                    return (
                      <div key={col} className="bg-gray-50 border border-gray-200 p-3 rounded space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full border border-gray-300 flex-shrink-0" style={getBackgroundStyle(col)} />
                          <span className="text-[10px] font-black text-gray-700 uppercase tracking-wide">{colName}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          id={`restock-color-${col.replace(/[^a-zA-Z0-9-]/g, '_')}`}
                          name={`restockColor_${col.replace(/[^a-zA-Z0-9-]/g, '_')}`}
                          value={currentVal}
                          onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setMultiRestockMatrix(prev => ({ ...prev, [key]: val }));
                          }}
                          className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs font-black font-mono text-center outline-none focus:border-black"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : restockModalAlert.sizes?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {restockModalAlert.sizes.map(sz => {
                    const key = `|${sz}`;
                    const currentVal = multiRestockMatrix[key] ?? 0;
                    return (
                      <div key={sz} className="bg-gray-50 border border-gray-200 p-3 rounded space-y-1">
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-wide block">Size {sz}</span>
                        <input
                          type="number"
                          min="0"
                          id={`restock-size-${sz}`}
                          name={`restockSize_${sz}`}
                          value={currentVal}
                          onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setMultiRestockMatrix(prev => ({ ...prev, [key]: val }));
                          }}
                          className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs font-black font-mono text-center outline-none focus:border-black"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">General Restock Quantity</label>
                  <input
                    type="number"
                    min="1"
                    id="general-restock-qty"
                    name="generalRestockQty"
                    value={multiRestockMatrix['default'] ?? 50}
                    onChange={e => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      setMultiRestockMatrix({ default: val });
                    }}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm font-black font-mono outline-none focus:border-black"
                  />
                </div>
              )}
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-between border-t border-gray-150 pt-4">
              <p className="text-[10px] font-mono font-bold text-gray-500">
                Total Adding: <span className="text-black font-extrabold">{Object.values(multiRestockMatrix).reduce((a, b) => a + (parseInt(b) || 0), 0)} units</span>
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setRestockModalAlert(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-black uppercase tracking-widest rounded hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmMultiRestock(restockModalAlert._id)}
                  className="px-5 py-2 bg-black text-white text-xs font-black uppercase tracking-widest rounded hover:bg-gray-800 shadow-md cursor-pointer"
                >
                  Confirm Restock
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminInventory;
