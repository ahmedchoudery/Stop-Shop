import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Image as ImageIcon, 
  Type, 
  DollarSign, 
  Layers, 
  Package, 
  Star,
  CheckCircle,
  AlertCircle,
  Loader2,
  Filter
} from 'lucide-react';
import { apiUrl } from '../config/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: 0,
    bucket: 'Tops',
    subCategory: '',
    image: '',
    lifestyleImage: '',
    specs: '',
    colors: '',
    rating: 5
  });

  const fetchProducts = async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(apiUrl('/api/admin/products'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('System sync failed');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        bucket: product.bucket || 'Tops',
        subCategory: product.subCategory || '',
        image: product.image,
        lifestyleImage: product.lifestyleImage || '',
        specs: Array.isArray(product.specs) ? product.specs.join(', ') : '',
        colors: Array.isArray(product.colors) ? product.colors.join(', ') : '',
        rating: product.rating || 5
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        quantity: 0,
        bucket: 'Tops',
        subCategory: '',
        image: '',
        lifestyleImage: '',
        specs: '',
        colors: '',
        rating: 5
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('adminToken');
    
    const productPayload = {
      ...formData,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      stock: parseInt(formData.quantity),
      specs: formData.specs.split(',').map(s => s.trim()).filter(s => s),
      colors: formData.colors.split(',').map(c => c.trim()).filter(c => c),
      rating: parseInt(formData.rating)
    };

    try {
      const url = editingProduct 
        ? apiUrl(`/api/admin/products/${editingProduct.id}`)
        : apiUrl('/api/admin/products');
      
      const response = await fetch(url, {
        method: editingProduct ? 'PATCH' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productPayload)
      });

      if (!response.ok) throw new Error('Transaction failed');
      
      setSuccessMsg(`Product ${editingProduct ? 'updated' : 'created'} successfully!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('IRREVERSIBLE ACTION: Are you sure you want to delete this asset?')) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(apiUrl(`/api/admin/products/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Delete failed');
      setProducts(products.filter(p => p.id !== id));
      setSuccessMsg('Asset purged successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900 border-l-8 border-[#ba1f3d] pl-6">
            Product Logistics
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2 ml-6">
            Inventory Asset Management • Global Control
          </p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="bg-black text-white px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-sm shadow-2xl hover:bg-[#ba1f3d] transition-all flex items-center space-x-3 active:scale-95"
        >
          <Plus size={18} />
          <span>Deploy New Asset</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Assets', value: products.length, icon: Package, color: 'text-blue-600' },
          { label: 'Out of Stock', value: products.filter(p => p.quantity === 0).length, icon: AlertCircle, color: 'text-red-600' },
          { label: 'Cloud Sync', value: 'Active', icon: CheckCircle, color: 'text-green-600' },
          { label: 'Categories', value: new Set(products.map(p => p.bucket)).size, icon: Layers, color: 'text-[#ba1f3d]' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm flex items-center space-x-4">
            <div className={`p-3 bg-gray-50 rounded-lg ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
              <p className="text-xl font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 animate-in slide-in-from-top-4">
          <p className="text-xs font-black uppercase tracking-widest text-green-700">{successMsg}</p>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-gray-100 p-4 mb-8 flex items-center space-x-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID or Product Name..."
            className="w-full bg-gray-50 border-none rounded-none py-4 pl-12 pr-6 text-xs font-bold uppercase tracking-widest outline-none focus:ring-2 ring-[#ba1f3d]/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="p-4 text-gray-400 hover:text-black transition-colors">
          <Filter size={20} />
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-100 shadow-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Preview</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Asset Identity</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Valuation</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Status</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-20 text-center">
                  <Loader2 className="animate-spin mx-auto text-gray-300" size={48} />
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Syncing Master Database...</p>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-20 text-center">
                  <p className="text-sm font-black uppercase tracking-widest text-gray-300 italic">No assets detected matching query</p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="w-16 h-16 bg-gray-100 overflow-hidden border border-gray-100 group-hover:scale-110 transition-transform">
                      <img src={p.image} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                    </div>
                  </td>
                  <td className="p-6">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">#{p.id}</p>
                      <p className="text-sm font-black uppercase tracking-tighter text-gray-900">{p.name}</p>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-500 rounded-sm">
                      {p.bucket} / {p.subCategory}
                    </span>
                  </td>
                  <td className="p-6 font-black text-sm text-[#ba1f3d]">
                    PKR {p.price?.toLocaleString()}
                  </td>
                  <td className="p-6">
                    <div className="flex items-center space-x-3">
                      <span className={`w-2 h-2 rounded-full ${p.quantity === 0 ? 'bg-[#ba1f3d] animate-pulse' : 'bg-green-500'}`} />
                      <span className="text-xs font-black uppercase italic">{p.quantity} Units</span>
                    </div>
                  </td>
                  <td className="p-6 text-right space-x-2">
                    <button 
                      onClick={() => handleOpenModal(p)}
                      className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="p-3 text-gray-400 hover:text-red-700 hover:bg-red-50 transition-all rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-4xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900 italic">
                  {editingProduct ? 'Update Asset Index' : 'Register New Asset'}
                </h3>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mt-1">Stop & Shop Master Control</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-10 space-y-12">
              {/* Basic Info */}
              <section>
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-1 h-6 bg-[#ba1f3d]" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Primary Specifications</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                      <Type size={12} /> <span>Product Display Name</span>
                    </label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-gray-50 border-b-2 border-transparent focus:border-[#ba1f3d] outline-none p-4 font-black uppercase tracking-tight text-sm transition-all"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                        <DollarSign size={12} /> <span>Price</span>
                      </label>
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        className="w-full bg-gray-50 border-b-2 border-transparent focus:border-[#ba1f3d] outline-none p-4 font-black text-sm transition-all"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                        <Package size={12} /> <span>Units</span>
                      </label>
                      <input 
                        required
                        type="number" 
                        className="w-full bg-gray-50 border-b-2 border-transparent focus:border-[#ba1f3d] outline-none p-4 font-black text-sm transition-all"
                        value={formData.quantity}
                        onChange={e => setFormData({...formData, quantity: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Categorization */}
              <section>
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-1 h-6 bg-blue-600" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Asset Classification</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bucket Category</label>
                    <select 
                      className="w-full bg-gray-50 border-b-2 border-transparent focus:border-red-600 outline-none p-4 font-black uppercase tracking-widest text-xs transition-all cursor-pointer"
                      value={formData.bucket}
                      onChange={e => setFormData({...formData, bucket: e.target.value})}
                    >
                      <option value="Tops">Tops</option>
                      <option value="Bottoms">Bottoms</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sub-Category</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Polo, Jeans, Footwear"
                      className="w-full bg-gray-50 border-b-2 border-transparent focus:border-red-600 outline-none p-4 font-black uppercase tracking-widest text-xs transition-all"
                      value={formData.subCategory}
                      onChange={e => setFormData({...formData, subCategory: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                      <Star size={12} /> <span>Product Rating (1-5)</span>
                    </label>
                    <input 
                      type="number" 
                      min="1" max="5"
                      className="w-full bg-gray-50 border-b-2 border-transparent focus:border-red-600 outline-none p-4 font-black text-sm transition-all"
                      value={formData.rating}
                      onChange={e => setFormData({...formData, rating: e.target.value})}
                    />
                  </div>
                </div>
              </section>

              {/* Visual Assets */}
              <section>
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-1 h-6 bg-green-600" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Visual Assets (CDN Links)</h4>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                      <ImageIcon size={12} /> <span>Primary Showcase Image URL</span>
                    </label>
                    <input 
                      required
                      type="url" 
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-gray-50 border-b-2 border-transparent focus:border-red-600 outline-none p-4 font-bold text-xs transition-all"
                      value={formData.image}
                      onChange={e => setFormData({...formData, image: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                      <ImageIcon size={12} /> <span>Lifestyle / Experience Image URL</span>
                    </label>
                    <input 
                      type="url" 
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-gray-50 border-b-2 border-transparent focus:border-red-600 outline-none p-4 font-bold text-xs transition-all"
                      value={formData.lifestyleImage}
                      onChange={e => setFormData({...formData, lifestyleImage: e.target.value})}
                    />
                  </div>
                </div>
              </section>

              {/* Metadata */}
              <section>
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-1 h-6 bg-gray-900" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Technical Metadata</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product Specs (Comma Separated)</label>
                    <textarea 
                      rows="3"
                      placeholder="Premium Cotton, Athletic Fit, Signature Logo..."
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-red-600 outline-none p-4 font-bold text-xs transition-all resize-none"
                      value={formData.specs}
                      onChange={e => setFormData({...formData, specs: e.target.value})}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hex Colors (Comma Separated)</label>
                    <textarea 
                      rows="3"
                      placeholder="#F63049, #000000, #FFFFFF..."
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-red-600 outline-none p-4 font-bold text-xs transition-all resize-none"
                      value={formData.colors}
                      onChange={e => setFormData({...formData, colors: e.target.value})}
                    />
                  </div>
                </div>
              </section>
            </form>

            {/* Modal Footer */}
            <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-end items-center space-x-6">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                Cancel Procedure
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-[#ba1f3d] text-white px-12 py-5 text-[11px] font-black uppercase tracking-[0.3em] rounded-sm shadow-2xl hover:bg-black transition-all flex items-center space-x-3 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                <span>{editingProduct ? 'Update Index' : 'Authorize Deployment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
