import React, { useState, useEffect, memo } from 'react';
import {
  Plus, Trash2, Edit3, Package, Search, Image, AlertTriangle,
} from 'lucide-react';
import { apiUrl } from '../config/api';
import { ProductForm, EMPTY_FORM } from '../components/ProductForm';

const ProductCard = memo(({ product, onEdit, onDelete }) => {
  const hasEmbed = product.mediaType === 'embed' && product.embedCode;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group">
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {product.image
          ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><Image size={32} className="text-gray-200" /></div>
        }
        {hasEmbed && (
          <div className="absolute top-2 left-2 flex items-center space-x-1 bg-black/70 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">
            <span>Video</span>
          </div>
        )}
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(product)} className="p-1.5 bg-white rounded-lg shadow-md text-gray-600 hover:text-blue-600 transition-colors"><Edit3 size={14} /></button>
          <button onClick={() => onDelete(product.id || product._id)} className="p-1.5 bg-white rounded-lg shadow-md text-gray-600 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
        </div>
        <div className="absolute bottom-2 left-2">
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${product.quantity === 0 ? 'bg-red-600 text-white'
              : product.quantity < 5 ? 'bg-yellow-400 text-black'
                : 'bg-green-100 text-green-700'
            }`}>
            {product.quantity === 0 ? 'Out of Stock' : `${product.quantity} in stock`}
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-black uppercase tracking-tight text-gray-900 line-clamp-1">{product.name}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm font-black text-red-600">PKR {parseFloat(product.price || 0).toFixed(2)}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase">{product.bucket}</p>
        </div>
        {product.colors?.length > 0 && (
          <div className="flex space-x-1 mt-2">
            {product.colors.slice(0, 5).map(c => (
              <div key={c} className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default function AdminProducts() {
  const FALLBACK_API_BASE = 'https://stop-shop-production.up.railway.app';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [colorInput, setColorInput] = useState('#000000');
  const [sizeInput, setSizeInput] = useState('M');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [galleryUrl, setGalleryUrl] = useState('');
  const [embedCopied, setEmbedCopied] = useState(false);

  const fetchOptions = { credentials: 'include' };
  const buildApiCandidates = (path) => {
    return [apiUrl(path)];
  };
  const readErrorText = async (res) => {
    const ct = res.headers.get('content-type') || '';
    try {
      return ct.includes('application/json') ? (await res.json()).error : (await res.text());
    } catch {
      return `HTTP ${res.status}`;
    }
  };

  const fetchProducts = async () => {
    try {
      const url = apiUrl('/api/admin/products');
      const res = await fetch(url, fetchOptions);
      if (res.status === 401 || res.status === 403) { window.location.href = '/login'; return; }
      if (!res.ok) {
        const errText = await readErrorText(res);
        throw new Error(errText || `Server error: ${res.status}`);
      }
      setProducts(await res.json());
    } catch (e) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
        const attemptedUrl = apiUrl('/api/admin/products');
        setError(`Failed to connect to API. URL attempted: ${attemptedUrl}. Please verify your backend is running and CORS is allowed.`);
      } else {
        setError(`${e.message} (Attempted: ${apiUrl('/api/admin/products')})`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const openAdd = () => {
    setEditingProduct(null);
    setForm({ ...EMPTY_FORM });
    setSizeInput('M');
    setGalleryUrl('');
    setIsModalOpen(true);
  };

  const openEdit = (p) => {
    setEditingProduct(p);
    const mt = p.mediaType || (p.embedCode ? 'embed' : 'upload');
    const rawBucket = p.bucket || 'Tops';
    const normalizedSubCategory = rawBucket === 'Bottoms'
      ? ((p.subCategory || '').toLowerCase() === 'pants' || (p.subCategory || '').toLowerCase() === 'chinos'
          ? 'Trousers'
          : (p.subCategory || 'Jeans'))
      : (p.subCategory || 'Polo');
    setForm({
      id: p.id || p._id, name: p.name || '', price: p.price || '',
      quantity: p.quantity ?? '', image: p.image || '', lifestyleImage: p.lifestyleImage || '',
      mediaType: mt, embedCode: p.embedCode || '',
      gallery: p.gallery || [],
      bucket: rawBucket, subCategory: normalizedSubCategory,
      rating: p.rating || 5, stock: p.stock ?? p.quantity ?? 10,
      specs: p.specs?.length ? [...p.specs, '', '', ''].slice(0, 3) : ['', '', ''],
      colors: p.colors || [],
      variantImages: p.variantImages ? { ...p.variantImages } : {},
      sizes: p.sizes || [],
      sizeStock: Object.fromEntries(Object.entries(p.sizeStock || {}).map(([k, v]) => [k, parseInt(v) || 0])),
    });
    setSizeInput(p.sizes?.[0] || 'M');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setSizeInput('M');
    setGalleryUrl('');
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Product name is required');
    if (!form.price) return alert('Price is required');
    if (!form.image && !form.embedCode && (!form.gallery || form.gallery.length === 0)) return alert('Please add a product image, gallery image or embed code');
    setSaving(true);
    try {
      const payload = {
        id: editingProduct ? form.id : undefined, name: form.name.trim(), price: parseFloat(form.price),
        quantity: parseInt(form.quantity) || 0, stock: parseInt(form.quantity) || 0,
        image: form.image, lifestyleImage: form.lifestyleImage || '', mediaType: form.mediaType, embedCode: form.embedCode || '',
        gallery: form.gallery || [],
        variantImages: form.variantImages || {},
        bucket: form.bucket, subCategory: form.subCategory,
        rating: parseInt(form.rating) || 5,
        specs: form.specs.filter(s => s.trim()), colors: form.colors, sizes: form.sizes,
        sizeStock: Object.fromEntries(form.sizes.map(size => [size, Math.max(0, parseInt(form.sizeStock?.[size]) || 0)])),
      };
      const path = editingProduct ? `/api/admin/products/${editingProduct.id || editingProduct._id}` : '/api/admin/products';
      let saved = false;
      let lastError = 'Save failed';
      for (const url of buildApiCandidates(path)) {
        try {
          const res = await fetch(url, { method: editingProduct ? 'PATCH' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (res.ok) {
            saved = true;
            break;
          }
          lastError = await readErrorText(res);
          if (res.status === 401 || res.status === 403) {
            window.location.href = '/login';
            return;
          }
        } catch (e) {
          lastError = e.message || 'Save failed';
        }
      }
      if (!saved) throw new Error(lastError || 'Save failed');
      await fetchProducts();
      closeModal();
    } catch (e) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (productId) => {
    try {
      let deleted = false;
      let lastError = 'Delete failed';
      for (const url of buildApiCandidates(`/api/admin/products/${productId}`)) {
        try {
          const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
          if (res.ok) {
            deleted = true;
            break;
          }
          lastError = await readErrorText(res);
        } catch (e) {
          lastError = e.message || 'Delete failed';
        }
      }
      if (!deleted) throw new Error(lastError || 'Delete failed');
      setProducts(prev => prev.filter(p => (p.id || p._id) !== productId));
    } catch (e) { alert('Error: ' + e.message); }
    setDeleteConfirm(null);
  };

  const filtered = products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900 border-l-8 border-red-600 pl-6">Products</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2 ml-6">
            {products.length} product{products.length !== 1 ? 's' : ''} in catalogue
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center space-x-3 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl shadow-xl transition-all group">
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-widest">Add Product</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:border-red-600 outline-none transition-all" />
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 font-bold text-sm">{error}</div>}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-2xl">
          <Package size={48} className="text-gray-200 mb-4" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No products yet</p>
          <button onClick={openAdd} className="mt-4 text-[11px] font-black uppercase tracking-widest text-red-600 border-b border-red-200 hover:border-red-600 transition-colors">Add your first product</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => <ProductCard key={p._id || p.id} product={p} onEdit={openEdit} onDelete={(id) => setDeleteConfirm(id)} />)}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-6 mx-auto"><AlertTriangle size={28} className="text-red-600" /></div>
            <h3 className="text-xl font-black uppercase tracking-tight text-center mb-2">Delete Product?</h3>
            <p className="text-sm text-gray-500 text-center mb-8">This cannot be undone.</p>
            <div className="flex space-x-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-black uppercase text-xs tracking-widest hover:border-gray-400 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ProductForm
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={handleSave}
          onClose={closeModal}
          editingProduct={editingProduct}
          colorInput={colorInput}
          setColorInput={setColorInput}
          sizeInput={sizeInput}
          setSizeInput={setSizeInput}
          galleryUrl={galleryUrl}
          setGalleryUrl={setGalleryUrl}
          embedCopied={embedCopied}
          setEmbedCopied={setEmbedCopied}
        />
      )}
    </div>
  );
}
