/**
 * @fileoverview AdminProducts.jsx — Product Management Page
 *
 * Every action here writes directly to MongoDB:
 *   CREATE  → POST   /api/admin/products        → products + inventories created
 *   UPDATE  → PATCH  /api/admin/products/:id    → products + inventories updated
 *   DELETE  → DELETE /api/admin/products/:id    → products deleted + inventories removed
 *
 * Applies: react-patterns, react-ui-patterns, design-spells
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, Edit3, Search, Package,
  RefreshCw, AlertTriangle, CheckCircle, X,
  ChevronDown, Filter
} from 'lucide-react';
import { AsyncContent } from '../components/ErrorBoundary.jsx';
import ProductForm from '../components/ProductForm.jsx';
import ProductTable from '../components/ProductTable.jsx';
import ProductFilters from '../components/ProductFilters.jsx';
import { authFetch, handleAuthError } from '../lib/auth.js';
import { apiUrl } from '../config/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { useDebounce } from '../hooks/useUtils.js';

// ─────────────────────────────────────────────────────────────────
// DEFAULT FORM STATE
// ─────────────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  id:             '',
  name:           '',
  price:          '',
  quantity:       0,
  stock:          0,
  image:          '',
  mediaType:      'url',
  embedCode:      '',
  rating:         5,
  bucket:         'Tops',
  subCategory:    'General',
  specs:          [],
  colors:         [],
  sizes:          [],
  sizeStock:      {},
  lifestyleImage: '',
  variantImages:  {},
  gallery:        [],
};

// ─────────────────────────────────────────────────────────────────
// TOAST HELPER
// ─────────────────────────────────────────────────────────────────

const useToast = () => {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return { toast, show };
};

// ─────────────────────────────────────────────────────────────────
// DELETE CONFIRMATION MODAL
// ─────────────────────────────────────────────────────────────────

const DeleteConfirmModal = ({ product, onConfirm, onCancel, deleting }) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-sm shadow-2xl w-full max-w-md animate-scale-in overflow-hidden">
        {/* Red top accent */}
        <div className="h-1 bg-[#ba1f3d] w-full" />

        <div className="p-8">
          {/* Icon */}
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto">
            <AlertTriangle size={24} className="text-[#ba1f3d]" />
          </div>

          {/* Text */}
          <div className="text-center mb-8">
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-2">
              Delete Product?
            </h3>
            <p className="text-sm text-gray-500 font-bold">
              You are about to permanently delete
            </p>
            <p className="text-sm font-black text-gray-900 mt-1 uppercase tracking-tight">
              "{product.name}"
            </p>
            <p className="text-xs text-gray-400 mt-3 font-bold">
              This will also remove it from the Inventory collection.<br />
              This action <span className="text-[#ba1f3d]">cannot be undone</span>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              disabled={deleting}
              className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-sm hover:border-gray-400 transition-all disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 px-5 py-3 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 size={12} />
                  <span>Delete Permanently</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────

const AdminProducts = () => {
  // ── UI state ────────────────────────────────────────────────────
  const [showForm, setShowForm]         = useState(false);
  const [editingProduct, setEditing]    = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);

  // ── Filter state ─────────────────────────────────────────────────
  const [searchRaw, setSearchRaw]           = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter]       = useState('all');
  const searchTerm = useDebounce(searchRaw, 250);

  // ── Form state ───────────────────────────────────────────────────
  const [form, setForm]           = useState(DEFAULT_FORM);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput]   = useState('');
  const [galleryUrl, setGalleryUrl] = useState('');
  const [embedCopied, setEmbedCopied] = useState(false);

  const { toast, show: showToast } = useToast();

  // ── Data fetching ─────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    const res = await authFetch(apiUrl('/api/admin/products'));
    if (handleAuthError(res.status)) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  }, []);

  const [{ data: products, loading, error }, { execute: refetch, setData: setProducts }] =
    useAsync(fetchProducts, { initialData: [] });

  React.useEffect(() => { refetch(); }, [refetch]);

  // ── Derived: categories + filtered products ───────────────────────

  const categories = useMemo(() => {
    if (!products?.length) return [];
    return [...new Set(products.map(p => p.bucket).filter(Boolean))].sort();
  }, [products]);

  const filtered = useMemo(() => {
    if (!products?.length) return [];
    const q = searchTerm.toLowerCase();

    return products.filter(p => {
      const matchSearch = !searchTerm
        || p.name?.toLowerCase().includes(q)
        || p.id?.toLowerCase().includes(q)
        || p.subCategory?.toLowerCase().includes(q);

      const matchCategory = categoryFilter === 'all' || p.bucket === categoryFilter;

      const matchStock =
        stockFilter === 'all'          ? true :
        stockFilter === 'in-stock'     ? p.quantity > 4 :
        stockFilter === 'low-stock'    ? p.quantity > 0 && p.quantity < 5 :
        stockFilter === 'out-of-stock' ? p.quantity === 0 : true;

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  // ── Open form for CREATE ──────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setColorInput('');
    setSizeInput('');
    setGalleryUrl('');
    setShowForm(true);
  };

  // ── Open form for EDIT ────────────────────────────────────────────

  const handleOpenEdit = (product) => {
    setEditing(product);
    setForm({
      id:             product.id             ?? '',
      name:           product.name           ?? '',
      price:          product.price          ?? '',
      quantity:       product.quantity       ?? 0,
      stock:          product.stock          ?? 0,
      image:          product.image          ?? '',
      mediaType:      product.mediaType      ?? 'url',
      embedCode:      product.embedCode      ?? '',
      rating:         product.rating         ?? 5,
      bucket:         product.bucket         ?? 'Tops',
      subCategory:    product.subCategory    ?? 'General',
      specs:          product.specs          ?? [],
      colors:         product.colors         ?? [],
      sizes:          product.sizes          ?? [],
      sizeStock:      product.sizeStock instanceof Map
                        ? Object.fromEntries(product.sizeStock)
                        : (product.sizeStock ?? {}),
      lifestyleImage: product.lifestyleImage ?? '',
      variantImages:  product.variantImages instanceof Map
                        ? Object.fromEntries(product.variantImages)
                        : (product.variantImages ?? {}),
      gallery:        product.gallery        ?? [],
    });
    setColorInput('');
    setSizeInput('');
    setGalleryUrl('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(DEFAULT_FORM);
  };

  // ─────────────────────────────────────────────────────────────────
  // CREATE / UPDATE → MongoDB
  // ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name?.trim()) return showToast('Product name is required.', 'error');
    if (!form.price || isNaN(parseFloat(form.price))) return showToast('Valid price is required.', 'error');

    setSaving(true);
    try {
      const payload = {
        ...form,
        price:    parseFloat(form.price),
        quantity: parseInt(form.quantity) || 0,
        stock:    parseInt(form.quantity) || 0,
        // Ensure sizeStock values are numbers
        sizeStock: Object.fromEntries(
          Object.entries(form.sizeStock ?? {}).map(([k, v]) => [k, parseInt(v) || 0])
        ),
      };

      const isEditing = !!editingProduct;
      const url    = isEditing
        ? apiUrl(`/api/admin/products/${editingProduct.id ?? editingProduct._id}`)
        : apiUrl('/api/admin/products');
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? data.error ?? `Failed to ${isEditing ? 'update' : 'create'} product`);
      }

      const saved = await res.json();

      // Optimistic UI update — no full refetch needed
      setProducts(prev => {
        if (isEditing) {
          return (prev ?? []).map(p =>
            (p.id === saved.id || p._id === saved._id) ? saved : p
          );
        }
        return [saved, ...(prev ?? [])];
      });

      showToast(
        isEditing
          ? `"${saved.name}" updated in MongoDB ✓`
          : `"${saved.name}" added to MongoDB ✓`,
        'success'
      );

      handleCloseForm();

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // DELETE → MongoDB
  // ─────────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const productId = deleteTarget.id ?? deleteTarget._id;
      const res = await authFetch(apiUrl(`/api/admin/products/${productId}`), {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? data.error ?? 'Failed to delete product');
      }

      // Remove from local state immediately
      setProducts(prev => (prev ?? []).filter(p =>
        p.id !== deleteTarget.id && p._id !== deleteTarget._id
      ));

      showToast(`"${deleteTarget.name}" permanently deleted from MongoDB ✓`, 'success');
      setDeleteTarget(null);

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  return (
    <div>

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">
            Catalogue
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Products
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {/* Refresh */}
          <button
            onClick={() => refetch()}
            disabled={loading}
            title="Refresh from MongoDB"
            className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Add Product */}
          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-6 py-3 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-900 transition-all duration-300 shadow-xl shadow-red-200/40"
          >
            <Plus size={14} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────── */}
      {toast && (
        <div
          key={toast.id}
          className={`mb-6 p-4 rounded-xl flex items-center space-x-3 animate-slide-up border ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}
        >
          {toast.type === 'error'
            ? <AlertTriangle size={14} />
            : <CheckCircle size={14} />
          }
          <p className="text-xs font-bold flex-grow">{toast.message}</p>
          <button
            onClick={() => {}}
            className="opacity-50 hover:opacity-100"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────── */}
      <ProductFilters
        searchTerm={searchRaw}
        onSearchChange={setSearchRaw}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        stockFilter={stockFilter}
        onStockChange={setStockFilter}
        categories={categories}
      />

      {/* ── Products Table ─────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl">
        <AsyncContent
          loading={loading}
          error={error}
          data={filtered}
          onRetry={refetch}
          empty={
            <div className="p-20 text-center">
              <Package size={36} className="mx-auto text-gray-200 mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-300">
                {searchTerm || categoryFilter !== 'all' || stockFilter !== 'all'
                  ? 'No products match your filters'
                  : 'No products yet — add your first product'}
              </p>
              {!searchTerm && categoryFilter === 'all' && stockFilter === 'all' && (
                <button
                  onClick={handleOpenCreate}
                  className="mt-6 flex items-center space-x-2 mx-auto px-6 py-3 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 transition-all"
                >
                  <Plus size={12} />
                  <span>Add First Product</span>
                </button>
              )}
            </div>
          }
        >
          <ProductTable
            products={filtered}
            onEdit={handleOpenEdit}
            onDelete={(product) => setDeleteTarget(product)}
          />
        </AsyncContent>

        {/* Footer bar */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
            {filtered.length} of {(products ?? []).length} products
          </p>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">
            MongoDB · stopshop.products
          </p>
        </div>
      </div>

      {/* ── Product Form (Create / Edit) ────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-start justify-end overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseForm}
          />

          {/* Slide-in panel */}
          <div className="relative h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slide-in flex flex-col">

            {/* Panel header */}
            <div className="sticky top-0 z-10 bg-gray-900 text-white px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 mb-1">
                  {editingProduct ? 'Editing Product' : 'New Product'}
                </p>
                <h2 className="text-base font-black uppercase tracking-tight">
                  {editingProduct ? editingProduct.name : 'Add to Catalogue'}
                </h2>
              </div>
              <button
                onClick={handleCloseForm}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form body */}
            <div className="flex-grow p-6">
              <ProductForm
                form={form}
                setForm={setForm}
                saving={saving}
                onSave={handleSave}
                onClose={handleCloseForm}
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
            </div>

            {/* Sticky save bar */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center space-x-3 flex-shrink-0">
              <button
                onClick={handleCloseForm}
                className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-sm hover:border-gray-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-5 py-3 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-red-200/40"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={13} />
                    <span>{editingProduct ? 'Save Changes' : 'Add to MongoDB'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────── */}
      <DeleteConfirmModal
        product={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        deleting={deleting}
      />
    </div>
  );
};

export default AdminProducts;