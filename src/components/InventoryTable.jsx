import React, { useState, useEffect } from 'react';
import { Package, Edit3, Save, X, AlertTriangle, Search, Filter } from 'lucide-react';
import { apiUrl } from '../config/api';

const InventoryTable = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successIds, setSuccessIds] = useState(new Set());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await fetch(apiUrl('/api/admin/products'), {
        credentials: 'include'
      });
      if (response.status === 401 || response.status === 403) {
        window.location.href = '/login';
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Connection Refused: Is the backend server running on port 5000?');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleQuickUpdate = async (productId, field, value) => {
    try {
      const updateData = field === 'quantity' ? { quantity: parseInt(value) } : { price: parseFloat(value) };
      
      const response = await fetch(apiUrl(`/api/admin/products/${productId}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error('Update failed');
      
      const updatedProduct = await response.json();
      setProducts(products.map(p => p.id === productId ? updatedProduct : p));
      
      // Visual feedback
      setSuccessIds(prev => new Set(prev).add(productId));
      setTimeout(() => {
        setSuccessIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }, 2000);

    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleLocalChange = (productId, field, value) => {
    setProducts(products.map(p => 
      p.id === productId ? { ...p, [field === 'quantity' ? 'quantity' : 'price']: value } : p
    ));
  };

  // Filter Logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStockFilter = showOutOfStockOnly ? product.quantity === 0 : true;
    return matchesSearch && matchesStockFilter;
  });

  if (loading) return <div className="p-10 text-center font-black uppercase tracking-widest text-gray-400">Syncing Inventory...</div>;
  if (error) return <div className="p-10 text-center text-[#ba1f3d] font-bold uppercase tracking-widest border-2 border-dashed border-gray-50">{error}</div>;

  return (
    <div className="w-full">
      {/* Top Bar - Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-sm py-3 pl-10 pr-4 text-xs font-bold focus:bg-white focus:border-[#ba1f3d] outline-none transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center space-x-6">
          <label className="flex items-center cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={showOutOfStockOnly}
                onChange={() => setShowOutOfStockOnly(!showOutOfStockOnly)}
              />
              <div className={`w-10 h-5 bg-gray-200 rounded-full transition-colors ${showOutOfStockOnly ? 'bg-[#ba1f3d]' : ''}`}></div>
              <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform ${showOutOfStockOnly ? 'translate-x-5' : ''}`}></div>
            </div>
            <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-[#ba1f3d] transition-colors italic">Out of Stock Only</span>
          </label>
        </div>
      </div>

      <div className="bg-white border border-gray-100 shadow-2xl overflow-hidden rounded-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">SKU / ID</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Description</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Unit Price (PKR)</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Count</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Status Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.quantity === 0;
                const isLowStock = product.quantity < 5 && product.quantity > 0;
                const isSaved = successIds.has(product.id);

                return (
                  <tr 
                    key={product.id} 
                    className={`transition-colors group ${isOutOfStock ? 'bg-red-100/50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="p-4 font-mono text-[10px] font-bold text-gray-400">
                      #{product.id}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-black uppercase tracking-tight text-gray-900">{product.name}</span>
                        {isOutOfStock && <AlertTriangle size={14} className="text-red-600" />}
                      </div>
                    </td>
                    <td className="p-4">
                      <input 
                        type="number"
                        step="0.01"
                        value={product.price}
                        onChange={(e) => handleLocalChange(product.id, 'price', e.target.value)}
                        onBlur={(e) => handleQuickUpdate(product.id, 'price', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickUpdate(product.id, 'price', e.target.value)}
                        className="w-24 bg-transparent border-b-2 border-transparent focus:border-red-600 outline-none p-1 text-sm font-black transition-all hover:bg-white/50"
                      />
                    </td>
                    <td className={`p-4 ${isLowStock ? 'bg-yellow-100/40' : ''}`}>
                      <div className="flex items-center space-x-3">
                        <input 
                          type="number"
                          value={product.quantity}
                          onChange={(e) => handleLocalChange(product.id, 'quantity', e.target.value)}
                          onBlur={(e) => handleQuickUpdate(product.id, 'quantity', e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleQuickUpdate(product.id, 'quantity', e.target.value)}
                          className={`w-20 bg-transparent border-b-2 border-transparent focus:border-red-600 outline-none p-1 text-sm font-black transition-all ${isLowStock ? 'text-red-800' : ''}`}
                        />
                        {isSaved && <span className="text-green-600 animate-bounce">✅</span>}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        {isOutOfStock ? (
                          <span className="px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-600 text-white shadow-xl shadow-red-100">
                            Sold Out
                          </span>
                        ) : (
                          <span className="px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-100 text-green-700">
                            In Stock
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
          Showing {filteredProducts.length} of {products.length} Products
        </p>
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">
          Sync Status: <span className="text-green-500">Encrypted Cloud Connection</span>
        </p>
      </div>
    </div>
  );
};

export default InventoryTable;
