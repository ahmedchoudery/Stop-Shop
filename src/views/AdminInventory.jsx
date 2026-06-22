/**
 * @fileoverview AdminInventory — Stock management page
 * Fix: replaced require('animejs') with ESM import — success flash and stock indicators now animate correctly
 * Applies: react-ui-patterns (inline edit, optimistic update feedback),
 *          design-spells (success flash, stock level color coding, search with debounce)
 */

import React, { useState, useEffect, useCallback } from 'react';
import anime from 'animejs';
import { Search, Package, AlertTriangle, X, Filter } from 'lucide-react';
import { AsyncContent } from '../components/ErrorBoundary.tsx';
import InventoryHealthChart from '../components/InventoryHealthChart.jsx';
import { authFetch, handleAuthError } from '../lib/auth.js';
import { apiUrl } from '../config/api.js';
import { useDebounce, useTimeout } from '../hooks/useUtils.js';
import { EASING } from '../hooks/useAnime.js';

const getBackgroundStyle = (color) => {
  if (!color) return {};
  if (color.includes('|')) {
    const parts = color.split('|');
    const part0 = parts[0].trim();
    const part1 = parts[1].trim();
    const isHex = (str) => /^#([0-9A-F]{3}){1,2}$/i.test(str);
    if (isHex(part0) && !isHex(part1)) {
      return { backgroundColor: part0 };
    } else {
      return { background: `linear-gradient(135deg, ${part0} 50%, ${part1} 50%)` };
    }
  }
  return { backgroundColor: color };
};

const getColorName = (color) => {
  if (!color) return '';
  if (color.includes('|')) {
    const parts = color.split('|');
    const part0 = parts[0].trim();
    const part1 = parts[1].trim();
    const isHex = (str) => /^#([0-9A-F]{3}){1,2}$/i.test(str);
    if (isHex(part0) && !isHex(part1)) {
      return part1;
    } else {
      return parts.join(' / ');
    }
  }
  return color;
};

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchRaw, setSearchRaw] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [savedIds, setSavedIds] = useState(new Set());
  const [expandedIds, setExpandedIds] = useState(new Set());
  
  const searchTerm = useDebounce(searchRaw, 250);
  const flashTimeout = useTimeout();

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

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

  const filtered = products.filter(p => {
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

                        {/* Price */}
                        <td className="p-4">
                          <input
                            type="number" step="0.01"
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
                                              <span className="font-bold text-gray-700">{colorName}</span>
                                            </td>
                                            {product.sizes.map(sz => {
                                              const key = `${col}|${sz}`;
                                              const matrixVal = product.variantMatrix instanceof Map
                                                ? (product.variantMatrix.get(key) ?? 0)
                                                : (product.variantMatrix?.[key] ?? 0);
                                              return (
                                                <td key={sz} className="p-1 text-center">
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    value={matrixVal}
                                                    onChange={e => handleVariantMatrixChange(product.id, key, e.target.value)}
                                                    onBlur={() => handleVariantMatrixSave(product.id)}
                                                    onKeyDown={e => e.key === 'Enter' && handleVariantMatrixSave(product.id)}
                                                    className="w-16 text-center bg-gray-50 border-b border-transparent focus:border-black focus:bg-white outline-none py-1.5 text-[10px] font-black font-mono transition-all rounded-[2px]"
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

                              {/* Size Only Editor (Sizes exist, but no Colors) */}
                              {!hasMatrix && hasSizes && (
                                <div className="flex flex-wrap gap-5 py-2">
                                  {product.sizes.map(sz => {
                                    const sizeVal = product.sizeStock instanceof Map
                                      ? (product.sizeStock.get(sz) ?? 0)
                                      : (product.sizeStock?.[sz] ?? 0);
                                    return (
                                      <div key={sz} className="flex flex-col space-y-1.5">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Size {sz}</label>
                                        <input
                                          type="number"
                                          min="0"
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
                                          className="w-20 bg-gray-50 border-b border-transparent focus:border-black focus:bg-white outline-none py-2 px-3 text-center text-xs font-black font-mono transition-all rounded-[2px]"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Color Only Editor (Colors exist, but no Sizes) */}
                              {!hasMatrix && hasColors && (
                                <div className="flex flex-wrap gap-5 py-2">
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
    </div>
  );
};

export default AdminInventory;
