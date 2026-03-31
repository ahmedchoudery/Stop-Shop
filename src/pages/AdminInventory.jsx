/**
 * @fileoverview AdminInventory — Stock management page
 * Applies: react-ui-patterns (inline edit, optimistic update feedback),
 *          design-spells (success flash, stock level color coding, search with debounce)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Package, AlertTriangle, X, Filter } from 'lucide-react';
import { AsyncContent } from '../components/ErrorBoundary.jsx';
import InventoryHealthChart from '../components/InventoryHealthChart.jsx';
import { authFetch, handleAuthError } from '../lib/auth.js';
import { apiUrl } from '../config/api.js';
import { useDebounce } from '../hooks/useUtils.js';
import { EASING } from '../hooks/useAnime.js';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchRaw, setSearchRaw] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [savedIds, setSavedIds] = useState(new Set());
  const searchTerm = useDebounce(searchRaw, 250);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(apiUrl('/api/admin/products'));
      if (handleAuthError(res.status)) return;
      if (!res.ok) throw new Error('Failed to fetch inventory');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleUpdate = useCallback(async (productId, field, value) => {
    const parsed = field === 'quantity' ? parseInt(value) || 0 : parseFloat(value) || 0;
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
      setTimeout(() => {
        setSavedIds(prev => { const n = new Set(prev); n.delete(productId); return n; });
      }, 2000);

      // Spring bounce on the saved indicator
      let anime;
      try { anime = require('animejs').default ?? require('animejs'); } catch { return; }
      const el = document.querySelector(`[data-saved="${productId}"]`);
      if (el) anime({ targets: el, scale: [0, 1.2, 1], opacity: [0, 1], duration: 400, easing: EASING.SPRING });

    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  }, []);

  const handleLocalChange = (id, field, value) => {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const filtered = products.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || p.name.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q);
    const matchStock =
      stockFilter === 'all' ? true :
      stockFilter === 'out' ? p.quantity === 0 :
      stockFilter === 'low' ? p.quantity > 0 && p.quantity < 5 :
      p.quantity >= 5;
    return matchSearch && matchStock;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">Stock Control</p>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Inventory</h1>
      </div>

      {/* Chart */}
      <div className="mb-8">
        <InventoryHealthChart products={products} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchRaw}
            onChange={e => setSearchRaw(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-10 text-xs font-bold focus:bg-white focus:border-[#ba1f3d] outline-none transition-all placeholder:text-gray-300"
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
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                stockFilter === opt.value
                  ? 'bg-[#ba1f3d] text-white shadow-md'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl">
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
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['SKU', 'Product', 'Price (PKR)', 'Stock', 'Status'].map(h => (
                    <th key={h} className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(product => {
                  const outOfStock = product.quantity === 0;
                  const lowStock = product.quantity > 0 && product.quantity < 5;
                  const saved = savedIds.has(product.id);

                  return (
                    <tr
                      key={product.id}
                      className={`group transition-colors duration-200 ${outOfStock ? 'bg-red-50/40' : 'hover:bg-gray-50/60'}`}
                    >
                      <td className="p-4 font-mono text-[10px] font-bold text-gray-400">#{product.id}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {product.image && (
                            <img src={product.image} alt={product.name} className="w-8 h-8 object-cover rounded-lg" loading="lazy" />
                          )}
                          <span className="text-sm font-black uppercase tracking-tight text-gray-900">{product.name}</span>
                          {outOfStock && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
                        </div>
                      </td>
                      <td className="p-4">
                        <input
                          type="number" step="0.01"
                          value={product.price}
                          onChange={e => handleLocalChange(product.id, 'price', e.target.value)}
                          onBlur={e => handleUpdate(product.id, 'price', e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleUpdate(product.id, 'price', e.target.value)}
                          className="w-24 bg-transparent border-b-2 border-transparent focus:border-[#ba1f3d] outline-none py-1 text-sm font-black transition-all"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={e => handleLocalChange(product.id, 'quantity', e.target.value)}
                            onBlur={e => handleUpdate(product.id, 'quantity', e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpdate(product.id, 'quantity', e.target.value)}
                            className={`w-20 bg-transparent border-b-2 border-transparent focus:border-[#ba1f3d] outline-none py-1 text-sm font-black transition-all ${lowStock ? 'text-orange-600' : outOfStock ? 'text-red-600' : ''}`}
                          />
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
                      <td className="p-4">
                        <span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          outOfStock
                            ? 'bg-red-600 text-white'
                            : lowStock
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                        }`}>
                          {outOfStock ? 'Sold Out' : lowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AsyncContent>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
            {filtered.length} of {products.length} products
          </p>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">
            Tip: Click any price or quantity to edit inline
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminInventory;