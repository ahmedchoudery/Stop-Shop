/**
 * @fileoverview Admin Products Page
 * Applies: react-patterns (composition, custom hooks, single responsibility),
 *          react-ui-patterns (loading states, error handling, button disabled during ops),
 *          javascript-pro (async/await, clean error propagation)
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import ProductTable from '../components/ProductTable.jsx';
import ProductFilters from '../components/ProductFilters.jsx';
import { ProductForm, EMPTY_FORM } from '../components/ProductForm.jsx';
import ProductLightbox from '../components/ProductLightbox.jsx';
import { AsyncContent } from '../components/ErrorBoundary.jsx';
import { useProducts } from '../hooks/useDomain.js';
import { useDebounce } from '../hooks/useUtils.js';

// ─────────────────────────────────────────────────────────────────
// PRODUCT FORM STATE HOOK (extracted for single responsibility)
// ─────────────────────────────────────────────────────────────────

const useProductForm = (onSave) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [colorInput, setColorInput] = useState('#000000');
  const [sizeInput, setSizeInput] = useState('');
  const [galleryUrl, setGalleryUrl] = useState('');
  const [embedCopied, setEmbedCopied] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const openCreate = useCallback(() => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((product) => {
    setEditingProduct(product);
    setForm({
      ...EMPTY_FORM,
      ...product,
      price: product.price ?? '',
      quantity: product.quantity ?? '',
      specs: product.specs?.length ? product.specs.concat(['', '', '']).slice(0, 3) : ['', '', ''],
      colors: product.colors ?? [],
      sizes: product.sizes ?? [],
      sizeStock: product.sizeStock ?? {},
      variantImages: product.variantImages ?? {},
      gallery: product.gallery ?? [],
    });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleSave = useCallback(async () => {
    // Client-side validation
    if (!form.name?.trim()) {
      showToast('Product name is required', 'error');
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      showToast('Valid price is required', 'error');
      return;
    }

    const payload = {
      ...form,
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity) || 0,
      specs: form.specs.filter(s => s.trim()),
    };

    try {
      if (editingProduct) {
        await onSave.update({ id: editingProduct.id, data: payload });
        showToast('Product updated successfully');
      } else {
        await onSave.create(payload);
        showToast('Product created successfully');
      }
      close();
    } catch (err) {
      showToast(err.message ?? 'Save failed', 'error');
    }
  }, [form, editingProduct, onSave, close, showToast]);

  return {
    isOpen, form, setForm, editingProduct,
    colorInput, setColorInput,
    sizeInput, setSizeInput,
    galleryUrl, setGalleryUrl,
    embedCopied, setEmbedCopied,
    toast, openCreate, openEdit, close, handleSave,
  };
};

// ─────────────────────────────────────────────────────────────────
// LIGHTBOX STATE HOOK
// ─────────────────────────────────────────────────────────────────

const useLightbox = () => {
  const [lightboxState, setLightboxState] = useState({ open: false, images: [], startIndex: 0 });

  const openLightbox = useCallback((product) => {
    const images = [
      ...(product.image ? [{ src: product.image, alt: product.name, label: 'Main' }] : []),
      ...(product.lifestyleImage ? [{ src: product.lifestyleImage, alt: product.name, label: 'Lifestyle' }] : []),
      ...(product.gallery ?? []).map((src, i) => ({ src, alt: `${product.name} gallery ${i + 1}`, label: `Gallery ${i + 1}` })),
    ];
    setLightboxState({ open: true, images, startIndex: 0 });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxState(prev => ({ ...prev, open: false }));
  }, []);

  return { lightboxState, openLightbox, closeLightbox };
};

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────

const AdminProducts = () => {
  const {
    products, loading, error, creating, updating, deleting,
    createProduct, updateProduct, deleteProduct, refetch,
  } = useProducts();

  const formState = useProductForm({
    create: createProduct,
    update: updateProduct,
  });

  const { lightboxState, openLightbox, closeLightbox } = useLightbox();

  // ── Filters ──────────────────────────────────────────────────

  const [searchRaw, setSearchRaw] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  // ── Auto-clear toast after 3 seconds ──────────────────────
  useEffect(() => {
    if (!formState.toast) return;
    const timer = setTimeout(() => formState.setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [formState.toast]);

  // Debounce search to avoid filtering on every keystroke
  const searchTerm = useDebounce(searchRaw, 250);

  const categories = useMemo(
    () => [...new Set(products.map(p => p.bucket).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const lower = searchTerm.toLowerCase();

    return products.filter(p => {
      const matchesSearch = !searchTerm
        || p.name?.toLowerCase().includes(lower)
        || p.id?.toLowerCase().includes(lower);

      const matchesCategory = categoryFilter === 'all' 
        || p.bucket?.toLowerCase() === categoryFilter.toLowerCase();

      const matchesStock = stockFilter === 'all'
        || (stockFilter === 'in-stock' && p.quantity > 0)
        || (stockFilter === 'low-stock' && p.quantity > 0 && p.quantity < 5)
        || (stockFilter === 'out-of-stock' && p.quantity === 0);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  // ── Delete with confirmation ──────────────────────────────────

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await deleteProduct(id);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }, [deleteProduct]);

  const isMutating = creating || updating || deleting;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">
            Catalog Management
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Products
          </h1>
        </div>

        <button
          onClick={formState.openCreate}
          disabled={isMutating}
          className="flex items-center space-x-2 px-6 py-3 bg-[#ba1f3d] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 shadow-xl"
        >
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Toast notification */}
      {formState.toast && (
        <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
          formState.toast.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          <AlertCircle size={16} />
          <p className="text-xs font-bold">{formState.toast.message}</p>
        </div>
      )}

      {/* Filters */}
      <ProductFilters
        searchTerm={searchRaw}
        onSearchChange={setSearchRaw}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        stockFilter={stockFilter}
        onStockChange={setStockFilter}
        categories={categories}
      />

      {/* Product Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl">
        <AsyncContent
          loading={loading}
          error={error}
          data={filteredProducts}
          onRetry={refetch}
          empty={
            <div className="p-16 text-center">
              <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-300">
                {searchTerm ? 'No products match your search' : 'No products yet — add your first one'}
              </p>
            </div>
          }
        >
          <ProductTable
            products={filteredProducts}
            loading={false}
            onEdit={formState.openEdit}
            onDelete={handleDelete}
            onView={openLightbox}
          />
        </AsyncContent>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
            Showing {filteredProducts.length} of {products.length} products
          </p>
          {(deleting || creating || updating) && (
            <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-bold">
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {formState.isOpen && (
        <ProductForm
          form={formState.form}
          setForm={formState.setForm}
          saving={creating || updating}
          onSave={formState.handleSave}
          onClose={formState.close}
          editingProduct={formState.editingProduct}
          colorInput={formState.colorInput}
          setColorInput={formState.setColorInput}
          sizeInput={formState.sizeInput}
          setSizeInput={formState.setSizeInput}
          galleryUrl={formState.galleryUrl}
          setGalleryUrl={formState.setGalleryUrl}
          embedCopied={formState.embedCopied}
          setEmbedCopied={formState.setEmbedCopied}
        />
      )}

      {/* Lightbox */}
      <ProductLightbox
        images={lightboxState.images}
        startIndex={lightboxState.startIndex}
        isOpen={lightboxState.open}
        onClose={closeLightbox}
      />
    </div>
  );
};

export default AdminProducts;
