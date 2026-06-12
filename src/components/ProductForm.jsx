import React, { useState, useEffect, memo } from 'react';
import {
  X, Save, Package, Image, DollarSign, Upload, Link2, Code2,
  Play, CheckCircle, Copy
} from 'lucide-react';
import { CATEGORIES, CATEGORY_MAP, getDefaultSubCategory } from '../utils/categories.js';
import { authFetch } from '../lib/auth.js';
import { apiUrl } from '../config/api.js';



const ProductForm = memo(({
  form, setForm,
  saving,
  onSave,
  onClose,
  editingProduct,
  colorInput, setColorInput,
  sizeInput, setSizeInput,
  galleryUrl, setGalleryUrl,
  embedCopied, setEmbedCopied,
  allProducts = [],
}) => {
  const [uploading, setUploading] = useState(false);

  const uploadFileToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await authFetch(apiUrl('/api/admin/upload'), {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Upload failed');
    }
    const data = await res.json();
    return data.url;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadFileToCloudinary(file);
      setForm(f => ({ ...f, image: url, mediaType: 'upload' }));
    } catch (err) {
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSecondaryMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadFileToCloudinary(file);
      setForm(f => ({ ...f, lifestyleImage: url }));
    } catch (err) {
      alert('Failed to upload lifestyle image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryItem = (item) => {
    setForm(f => ({ ...f, gallery: (f.gallery || []).filter(g => g !== item) }));
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadFileToCloudinary(file);
      setForm(f => ({ ...f, gallery: [...(f.gallery || []), url] }));
    } catch (err) {
      alert('Failed to upload gallery image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVariantImageUpload = async (color, file) => {
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadFileToCloudinary(file);
      setForm(f => ({
        ...f,
        variantImages: { ...(f.variantImages || {}), [color]: url }
      }));
    } catch (err) {
      alert('Failed to upload variant image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const addColor = () => {
    const color = colorInput.trim();
    if (!color) return;
    if (!form.colors.includes(color)) {
      setForm(f => ({
        ...f,
        colors: [...f.colors, color],
        variantImages: { ...(f.variantImages || {}), [color]: f.variantImages?.[color] || '' }
      }));
    }
  };

  const removeColor = (c) => setForm(f => {
    const nextImages = { ...(f.variantImages || {}) };
    delete nextImages[c];
    return { ...f, colors: f.colors.filter(x => x !== c), variantImages: nextImages };
  });

  const setVariantImageForColor = (color, value) => {
    setForm(f => ({ ...f, variantImages: { ...(f.variantImages || {}), [color]: value } }));
  };

  const addSize = () => {
    const normalized = sizeInput.trim().toUpperCase();
    if (!normalized) return;
    if (!form.sizes.includes(normalized)) {
      setForm(f => ({
        ...f,
        sizes: [...f.sizes, normalized],
        sizeStock: { ...f.sizeStock, [normalized]: f.sizeStock?.[normalized] ?? 0 }
      }));
    }
    setSizeInput('');
  };

  const removeSize = (size) => setForm(f => {
    const nextStock = { ...(f.sizeStock || {}) };
    delete nextStock[size];
    return { ...f, sizes: f.sizes.filter(s => s !== size), sizeStock: nextStock };
  });

  const setSizeStock = (size, qty) => {
    const parsed = Math.max(0, parseInt(qty) || 0);
    setForm(f => ({ ...f, sizeStock: { ...(f.sizeStock || {}), [size]: parsed } }));
  };

  return (
    <div className="space-y-7 text-left">
      <MediaSection
        form={form}
        onImageUpload={handleImageUpload}
        uploading={uploading}
      />

      <GallerySection
        form={form}
        onGalleryUpload={handleGalleryUpload}
        onRemoveGallery={removeGalleryItem}
        uploading={uploading}
      />

      <BasicInfoSection form={form} setForm={setForm} />

      <DescriptionSection form={form} setForm={setForm} />

      <StockCategorySection form={form} setForm={setForm} />

      <PlacementSection
        form={form}
        setForm={setForm}
        allProducts={allProducts}
        editingProduct={editingProduct}
      />

      <SpecsSection form={form} setForm={setForm} />

      <ColorsSection
        form={form}
        colorInput={colorInput}
        setColorInput={setColorInput}
        onAddColor={addColor}
        onRemoveColor={removeColor}
        onVariantImageUpload={handleVariantImageUpload}
        uploading={uploading}
      />

      <SizesSection
        form={form}
        sizeInput={sizeInput}
        setSizeInput={setSizeInput}
        onAddSize={addSize}
        onRemoveSize={removeSize}
        onSetSizeStock={setSizeStock}
      />

      <RatingSection form={form} setForm={setForm} />
    </div>
  );
});

ProductForm.displayName = 'ProductForm';

const MediaSection = memo(({ form, onImageUpload, uploading }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Product Media (Image or Video) *</label>
    
    <div className="flex items-start space-x-4">
      <div className="w-28 h-28 bg-gray-50 border border-dashed border-gray-200 rounded-[4px] overflow-hidden flex-shrink-0 relative">
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {form.image ? (
          form.image.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
            <video src={form.image} className="w-full h-full object-cover" autoPlay muted loop />
          ) : (
            <img src={form.image} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image size={28} className="text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex-grow">
        <label className={`flex flex-col items-center justify-center w-full py-4 px-6 border border-dashed border-gray-200 rounded-[4px] cursor-pointer hover:border-black hover:bg-black/5 transition-all text-center ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload size={20} className="text-gray-400 mb-2" />
          <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">
            {uploading ? 'Uploading to Cloudinary...' : 'Click to Upload Media'}
          </span>
          <div className="text-[9px] leading-relaxed text-gray-400 space-y-1">
            <p><span className="font-bold text-gray-500">Images:</span> WebP (Best), JPG, PNG, GIF, SVG</p>
            <p><span className="font-bold text-gray-500">Videos:</span> MP4, WebM, OGG (Short showcases)</p>
            <p><span className="font-bold text-gray-500">Limits:</span> Max 5MB | <span className="font-bold text-gray-500">Ratio:</span> 1:1 or 4:5 recommended</p>
          </div>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={onImageUpload} disabled={uploading} />
        </label>
      </div>
    </div>
  </div>
));

MediaSection.displayName = 'MediaSection';

const GallerySection = memo(({ form, onGalleryUpload, onRemoveGallery, uploading }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Gallery Images (optional)</label>
    <label className={`flex items-center justify-center w-full py-4 border border-dashed border-gray-200 rounded-[4px] cursor-pointer hover:border-black hover:bg-black/5 transition-all mb-3 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
      <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">
        {uploading ? 'Uploading...' : 'Click to Upload Gallery Image'}
      </span>
      <input type="file" accept="image/*" className="hidden" onChange={onGalleryUpload} disabled={uploading} />
    </label>
    {form.gallery?.length > 0 && (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {form.gallery.map((item, idx) => (
          <div key={`${item}-${idx}`} className="relative rounded-[4px] overflow-hidden border border-gray-200">
            <img src={item} alt={`Gallery ${idx + 1}`} className="w-full h-24 object-cover" />
            <button onClick={() => onRemoveGallery(item)} className="absolute top-1 right-1 bg-white/90 text-red-600 p-1 rounded-full text-xs">×</button>
          </div>
        ))}
      </div>
    )}
  </div>
));

GallerySection.displayName = 'GallerySection';

const BasicInfoSection = memo(({ form, setForm }) => (
  <div className="grid grid-cols-3 gap-4">
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Product Name *</label>
      <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        placeholder="e.g. Classic Red Polo"
        className="w-full border border-gray-200 rounded-[4px] px-4 py-3 text-sm font-bold focus:border-black outline-none transition-colors" />
    </div>
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Price (PKR) *</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Rs.</span>
        <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
          placeholder="0.00"
          className="w-full border border-gray-200 rounded-[4px] pl-10 pr-4 py-3 text-sm font-bold focus:border-black outline-none transition-colors" />
      </div>
    </div>
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Discount %</label>
      <input type="number" min="0" max="100" value={form.discount ?? 0} onChange={e => setForm(f => ({ ...f, discount: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
        placeholder="0"
        className="w-full border border-gray-200 rounded-[4px] px-4 py-3 text-sm font-bold focus:border-black outline-none transition-colors" />
    </div>
  </div>
));

BasicInfoSection.displayName = 'BasicInfoSection';

const DescriptionSection = memo(({ form, setForm }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
        {form.featuredSection === 'attitude' ? 'Short Description (Lookbook Editorial) *' : 'Product Description'}
      </label>
      <textarea
        value={form.description || ''}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder={form.featuredSection === 'attitude'
          ? "e.g. Lightweight linen shirt paired with pleated sand-colored trousers."
          : "Enter product description details..."}
        className="w-full border border-gray-200 rounded-[4px] px-4 py-3 text-sm font-bold focus:border-black outline-none transition-colors h-28 resize-none"
      />
    </div>
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
        Care Instructions (optional)
      </label>
      <textarea
        value={form.careInstructions || ''}
        onChange={e => setForm(f => ({ ...f, careInstructions: e.target.value }))}
        placeholder="e.g. Dry clean recommended. Machine wash cold with like colors."
        className="w-full border border-gray-200 rounded-[4px] px-4 py-3 text-sm font-bold focus:border-black outline-none transition-colors h-28 resize-none"
      />
    </div>
  </div>
));

DescriptionSection.displayName = 'DescriptionSection';

const StockCategorySection = memo(({ form, setForm }) => {
  const hasSizes = form.sizes?.length > 0;
  const isAttitude = form.featuredSection === 'attitude';
  
  // Calculate total stock from sizes if active
  const calculatedQty = hasSizes
    ? Object.values(form.sizeStock || {}).reduce((sum, q) => sum + (parseInt(q) || 0), 0)
    : form.quantity;

  // Sync calculated quantity back to form state if it differs
  useEffect(() => {
    if (hasSizes && form.quantity !== calculatedQty) {
      setForm(f => ({ ...f, quantity: calculatedQty }));
    }
  }, [hasSizes, calculatedQty, form.quantity, setForm]);

  // Automatically sync bucket and subCategory to 'Outfit' when featuredSection is 'attitude'
  useEffect(() => {
    if (isAttitude) {
      if (form.bucket !== 'Outfit' || form.subCategory !== 'Outfit') {
        setForm(f => ({ ...f, bucket: 'Outfit', subCategory: 'Outfit' }));
      }
    }
  }, [isAttitude, form.bucket, form.subCategory, setForm]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Stock Qty</label>
        <input 
          type="number" 
          value={calculatedQty} 
          onChange={e => !hasSizes && setForm(f => ({ ...f, quantity: e.target.value }))}
          disabled={hasSizes}
          placeholder="0"
          className={`w-full border border-gray-200 rounded-[4px] px-4 py-3 text-sm font-bold focus:border-black outline-none transition-colors ${
            hasSizes ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
          }`} 
        />
      </div>
      {isAttitude ? (
        <div className="col-span-2 bg-gray-50 border border-gray-200 rounded-[4px] px-4 py-3 flex flex-col justify-center">
          <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Category & Sub-Category</span>
          <p className="text-xs font-black uppercase tracking-wider text-black">Outfit</p>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Category</label>
            <select value={form.bucket} onChange={e => setForm(f => ({ ...f, bucket: e.target.value, subCategory: getDefaultSubCategory(e.target.value) }))}
              className="w-full border border-gray-200 rounded-[4px] px-4 py-3 text-sm font-bold focus:border-black outline-none bg-white">
              {CATEGORIES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Sub-Category</label>
            <select value={form.subCategory} onChange={e => setForm(f => ({ ...f, subCategory: e.target.value }))}
              className="w-full border border-gray-200 rounded-[4px] px-4 py-3 text-sm font-bold focus:border-black outline-none bg-white">
              {(CATEGORY_MAP[form.bucket] || []).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </>
      )}
    </div>
  );
});

StockCategorySection.displayName = 'StockCategorySection';

const SpecsSection = memo(({ form, setForm }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Product Specs (up to 3)</label>
    <div className="space-y-2">
      {form.specs.map((spec, i) => (
        <input key={i} type="text" value={spec}
          onChange={e => { const s = [...form.specs]; s[i] = e.target.value; setForm(f => ({ ...f, specs: s })); }}
          placeholder={`Spec ${i + 1} — e.g. 100% Cotton`}
          className="w-full border border-gray-200 rounded-[4px] px-4 py-2.5 text-sm font-bold focus:border-black outline-none transition-colors" />
      ))}
    </div>
  </div>
));

SpecsSection.displayName = 'SpecsSection';

const ColorsSection = memo(({ form, colorInput, setColorInput, onAddColor, onRemoveColor, onVariantImageUpload, uploading }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Color Variants</label>
    <div className="flex items-center space-x-3 mb-3">
      <input type="color" value={colorInput} onChange={e => setColorInput(e.target.value)}
        className="w-12 h-10 rounded-[4px] border border-gray-200 cursor-pointer" />
      <input type="text" value={colorInput} onChange={e => setColorInput(e.target.value)}
        placeholder="#FF0000"
        className="flex-grow border border-gray-200 rounded-[4px] px-4 py-2.5 text-sm font-mono font-bold focus:border-black outline-none" />
      <button onClick={onAddColor} className="px-4 py-2.5 bg-black text-white rounded-[4px] text-[11px] font-black uppercase tracking-widest hover:bg-black/90 transition-colors">Add</button>
    </div>
    {form.colors.length > 0 && (
      <div className="space-y-3">
        {form.colors.map(c => (
          <div key={c} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 bg-gray-50 border border-gray-200 rounded-[4px] p-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full border border-gray-300"
                style={c.includes('|') ? { background: `linear-gradient(to right, ${c.split('|')[0]} 50%, ${c.split('|')[1]} 50%)` } : { backgroundColor: c }} />
              <span className="text-[11px] font-mono font-bold text-gray-600 w-16 truncate">{c}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {form.variantImages?.[c] && (
                <img src={form.variantImages[c]} alt="Variant" className="w-8 h-8 rounded object-cover border border-gray-200" />
              )}
              <label className={`flex-grow flex items-center justify-center py-2 px-3 border border-dashed border-gray-300 rounded-[4px] cursor-pointer hover:bg-white transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={12} className="text-gray-400 mr-2" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={e => onVariantImageUpload(c, e.target.files[0])} disabled={uploading} />
              </label>
            </div>
            
            <button onClick={() => onRemoveColor(c)} className="text-gray-400 hover:text-red-500 p-1"><X size={16} /></button>
          </div>
        ))}
      </div>
    )}
  </div>
));

ColorsSection.displayName = 'ColorsSection';

const SizesSection = memo(({ form, sizeInput, setSizeInput, onAddSize, onRemoveSize, onSetSizeStock }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Size Variants</label>
    <div className="flex items-center space-x-3 mb-3">
      <input type="text" value={sizeInput} onChange={e => setSizeInput(e.target.value)}
        placeholder="e.g. M, L, XL"
        className="flex-grow border border-gray-200 rounded-[4px] px-4 py-2.5 text-sm font-black uppercase tracking-widest focus:border-black outline-none" />
      <button onClick={onAddSize} className="px-4 py-2.5 bg-black text-white rounded-[4px] text-[11px] font-black uppercase tracking-widest hover:bg-black/90 transition-colors">Add</button>
    </div>
    {form.sizes.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {form.sizes.map(size => (
          <div key={size} className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-[4px] px-3 py-1.5">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-700">{size}</span>
            <input type="number" min="0" value={form.sizeStock?.[size] ?? 0}
              onChange={e => onSetSizeStock(size, e.target.value)}
              className="w-16 border border-gray-200 rounded-[4px] px-2 py-1 text-[11px] font-black text-center" />
            <button onClick={() => onRemoveSize(size)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
          </div>
        ))}
      </div>
    )}
  </div>
));

SizesSection.displayName = 'SizesSection';

const RatingSection = memo(({ form, setForm }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Rating (1–5)</label>
    <div className="flex space-x-2">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => setForm(f => ({ ...f, rating: n }))}
          className={`w-10 h-10 rounded-[4px] border font-black text-sm transition-all ${form.rating >= n ? 'border-yellow-400 bg-yellow-50 text-yellow-600' : 'border-gray-200 text-gray-300'}`}>★</button>
      ))}
    </div>
  </div>
));

RatingSection.displayName = 'RatingSection';

const PlacementSection = memo(({ form, setForm, allProducts, editingProduct }) => {
  const sections = [
    { id: 'collection', name: "Collection", desc: "Standard Catalog only" },
    { id: 'drop', name: "The Drop", desc: "Hero/Featured section" },
    { id: 'attitude', name: "Defined by Attitude", desc: "Lookbook Editorial strip" },
    { id: 'pieces', name: "Pieces That Speak", desc: "Curated Highlights grid" },
  ];

  const selectedSection = form.featuredSection || 'collection';
  
  // Calculate products in the currently selected section
  const sectionProducts = (allProducts || []).filter(
    p => p.featuredSection === selectedSection && p.id !== (editingProduct?.id || editingProduct?._id)
  );

  const displayOrderVal = parseInt(form.displayOrder) || 0;

  // Check if this displayOrder is taken
  const conflictProduct = sectionProducts.find(p => (parseInt(p.displayOrder) || 0) === displayOrderVal);

  const showPositionInput = selectedSection !== 'collection';

  return (
    <div className="border border-gray-150 rounded-[4px] p-6 bg-gray-50/50 space-y-4 text-left">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">
          Storefront Placement *
        </label>
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
          Mandatory Selection
        </span>
      </div>

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {sections.map(s => {
          const isSelected = form.featuredSection === s.id;
          const count = (allProducts || []).filter(p => p.featuredSection === s.id).length;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setForm(f => {
                const nextSec = s.id;
                const updates = { featuredSection: nextSec };
                if (nextSec === 'attitude') {
                  updates.bucket = 'Outfit';
                  updates.subCategory = 'Outfit';
                } else if (f.featuredSection === 'attitude') {
                  updates.bucket = 'Tops';
                  updates.subCategory = 'Polo';
                }
                return { ...f, ...updates };
              })}
              className={`p-4 rounded-[4px] border text-left flex flex-col justify-between transition-all min-h-[110px] ${
                isSelected
                  ? 'border-black bg-black text-white shadow-sm'
                  : 'border-gray-250 bg-white hover:border-gray-400 text-black'
              }`}
            >
              <div>
                <p className="text-[11px] font-black uppercase tracking-tight leading-tight mb-1">{s.name}</p>
                <p className={`text-[9px] ${isSelected ? 'text-gray-300' : 'text-gray-450'} font-bold`}>{s.desc}</p>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider mt-3 ${isSelected ? 'text-white/60' : 'text-gray-500'}`}>
                {count} {count === 1 ? 'Product' : 'Products'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Display Order Selection */}
      {showPositionInput && (
        <div className="bg-white border border-gray-200 rounded-[4px] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-grow">
            <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
              Position inside Section
            </span>
            <p className="text-xs text-gray-600 font-bold">
              You have <span className="font-black text-black">{sectionProducts.length}</span> other products in this section.
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center space-x-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Position #</label>
            <input
              type="number"
              min="0"
              value={form.displayOrder ?? 0}
              onChange={e => setForm(f => ({ ...f, displayOrder: Math.max(0, parseInt(e.target.value) || 0) }))}
              className="w-20 border border-gray-255 rounded-[4px] px-3 py-2 text-sm font-black text-center focus:border-black outline-none"
            />
          </div>
        </div>
      )}

      {/* Conflict Warning */}
      {showPositionInput && conflictProduct && (
        <div className="bg-yellow-50 border border-yellow-250 text-yellow-800 rounded-[4px] p-3 text-xs flex items-center space-x-2">
          <span className="text-sm">⚠️</span>
          <p className="font-bold">
            Product <span className="font-black">"{conflictProduct.name}"</span> is already assigned to position <span className="font-black">#{displayOrderVal}</span> in this section.
          </p>
        </div>
      )}
    </div>
  );
});

PlacementSection.displayName = 'PlacementSection';

export const EMPTY_FORM = {
  id: '', name: '', price: '', quantity: '',
  image: '', lifestyleImage: '', mediaType: 'upload', embedCode: '',
  gallery: [],
  bucket: 'Tops', subCategory: 'Polo',
  rating: 5, stock: 10,
  specs: ['', '', ''],
  colors: [],
  variantImages: {},
  sizes: [],
  sizeStock: {},
  featuredSection: 'collection',
  displayOrder: 0,
  discount: 0,
  description: '',
  careInstructions: '',
};

export { ProductForm };
export default ProductForm;
