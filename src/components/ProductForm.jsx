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
        variantImages: { ...(f.variantImages || {}), [color]: f.variantImages?.[color] || '' },
        colorStock: { ...(f.colorStock || {}), [color]: f.colorStock?.[color] ?? 0 },
        // If sizes exist, add matrix entries for this color × all sizes
        variantMatrix: f.sizes?.length > 0
          ? f.sizes.reduce((m, size) => ({ ...m, [`${color}|${size}`]: f.variantMatrix?.[`${color}|${size}`] ?? 0 }), { ...(f.variantMatrix || {}) })
          : (f.variantMatrix || {}),
      }));
    }
  };

  const removeColor = (c) => setForm(f => {
    const nextImages = { ...(f.variantImages || {}) };
    delete nextImages[c];
    const nextColorStock = { ...(f.colorStock || {}) };
    delete nextColorStock[c];
    // Remove all matrix entries for this color
    const nextMatrix = Object.fromEntries(
      Object.entries(f.variantMatrix || {}).filter(([k]) => !k.startsWith(`${c}|`))
    );
    return { ...f, colors: f.colors.filter(x => x !== c), variantImages: nextImages, colorStock: nextColorStock, variantMatrix: nextMatrix };
  });

  const setColorStock = (color, qty) => {
    const val = qty === '' ? '' : Math.max(0, parseInt(qty) || 0);
    setForm(f => ({ ...f, colorStock: { ...(f.colorStock || {}), [color]: val } }));
  };

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
        sizeStock: { ...f.sizeStock, [normalized]: f.sizeStock?.[normalized] ?? 0 },
        // If colors exist, add matrix entries for all colors × this size
        variantMatrix: f.colors?.length > 0
          ? f.colors.reduce((m, color) => ({ ...m, [`${color}|${normalized}`]: f.variantMatrix?.[`${color}|${normalized}`] ?? 0 }), { ...(f.variantMatrix || {}) })
          : (f.variantMatrix || {}),
      }));
    }
    setSizeInput('');
  };

  const removeSize = (size) => setForm(f => {
    const nextSizeStock = { ...(f.sizeStock || {}) };
    delete nextSizeStock[size];
    // Remove all matrix entries for this size
    const nextMatrix = Object.fromEntries(
      Object.entries(f.variantMatrix || {}).filter(([k]) => !k.endsWith(`|${size}`))
    );
    return { ...f, sizes: f.sizes.filter(s => s !== size), sizeStock: nextSizeStock, variantMatrix: nextMatrix };
  });

  const setSizeStock = (size, qty) => {
    const val = qty === '' ? '' : Math.max(0, parseInt(qty) || 0);
    setForm(f => ({ ...f, sizeStock: { ...(f.sizeStock || {}), [size]: val } }));
  };

  // Matrix mode: set quantity for a specific color+size combination
  const setMatrixStock = (color, size, qty) => {
    const val = qty === '' ? '' : Math.max(0, parseInt(qty) || 0);
    const key = `${color}|${size}`;
    setForm(f => ({ ...f, variantMatrix: { ...(f.variantMatrix || {}), [key]: val } }));
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
        onSetColorStock={setColorStock}
        uploading={uploading}
        hasSizes={form.sizes?.length > 0}
      />

      <SizesSection
        form={form}
        sizeInput={sizeInput}
        setSizeInput={setSizeInput}
        onAddSize={addSize}
        onRemoveSize={removeSize}
        onSetSizeStock={setSizeStock}
        hasColors={form.colors?.length > 0}
      />

      {/* Color × Size stock matrix — shown when BOTH colors AND sizes are defined */}
      {form.colors?.length > 0 && form.sizes?.length > 0 && (
        <VariantMatrixSection
          form={form}
          onSetMatrixStock={setMatrixStock}
        />
      )}

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
  const hasColors = form.colors?.length > 0;
  const hasMatrix = hasSizes && hasColors;   // both = matrix mode
  const hasVariants = hasSizes || hasColors;
  const isAttitude = form.featuredSection === 'attitude';
  
  // Compute total stock from the correct source
  let calculatedQty = parseInt(form.quantity) || 0;
  if (hasMatrix) {
    // Matrix mode: sum all color|size cells
    calculatedQty = Object.values(form.variantMatrix || {}).reduce((sum, q) => sum + (parseInt(q) || 0), 0);
  } else if (hasColors) {
    calculatedQty = Object.values(form.colorStock || {}).reduce((sum, q) => sum + (parseInt(q) || 0), 0);
  } else if (hasSizes) {
    calculatedQty = Object.values(form.sizeStock || {}).reduce((sum, q) => sum + (parseInt(q) || 0), 0);
  }

  // Sync total back to form
  useEffect(() => {
    if (hasVariants && form.quantity !== calculatedQty) {
      setForm(f => ({ ...f, quantity: calculatedQty, stock: calculatedQty }));
    }
  }, [hasVariants, calculatedQty, form.quantity, setForm]);

  // Attitude mode: force Outfit category
  useEffect(() => {
    if (isAttitude) {
      if (form.bucket !== 'Outfit' || form.subCategory !== 'Outfit') {
        setForm(f => ({ ...f, bucket: 'Outfit', subCategory: 'Outfit' }));
      }
    }
  }, [isAttitude, form.bucket, form.subCategory, setForm]);

  const stockLabel = hasMatrix
    ? 'Total Stock (color × size matrix)'
    : hasColors
      ? 'Total Stock (from colors)'
      : hasSizes
        ? 'Total Stock (from sizes)'
        : 'Base Stock Qty';

  const stockHint = hasMatrix
    ? '↓ Enter quantities in the Color × Size grid below'
    : hasColors
      ? '↑ Sum of all color quantities'
      : hasSizes
        ? '↑ Sum of all size quantities'
        : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4">
        <div>
          {hasVariants ? (
            <div className="w-full bg-gray-50 border border-gray-200 rounded-[4px] px-4 py-3 flex flex-col justify-center min-h-[46px]">
              <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-0.5">Total Quantity</span>
              <p className="text-sm font-black text-black">{calculatedQty}</p>
            </div>
          ) : (
            <>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                {stockLabel}
              </label>
              <input 
                type="number" 
                value={form.quantity ?? ''} 
                onChange={e => setForm(f => ({
                  ...f,
                  quantity: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0),
                  stock: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0)
                }))}
                placeholder="0"
                className="w-full border border-gray-200 rounded-[4px] px-4 py-3 text-sm font-bold focus:border-black outline-none transition-colors" 
              />
            </>
          )}
          {!hasVariants && stockHint && (
            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wide">
              {stockHint}
            </p>
          )}
        </div>
        {isAttitude ? (
          <div className="col-span-2 bg-gray-50 border border-gray-200 rounded-[4px] px-4 py-3 flex flex-col justify-center">
            <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Category &amp; Sub-Category</span>
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

const ColorsSection = memo(({ form, colorInput, setColorInput, onAddColor, onRemoveColor, onVariantImageUpload, onSetColorStock, uploading, hasSizes }) => (
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
          <div key={c} className={`grid grid-cols-1 items-center gap-3 bg-gray-50 border border-gray-200 rounded-[4px] p-2 ${
            hasSizes ? 'sm:grid-cols-[auto_1fr_auto]' : 'sm:grid-cols-[auto_130px_1fr_auto]'
          }`}>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0"
                style={c.includes('|') ? { background: `linear-gradient(to right, ${c.split('|')[0]} 50%, ${c.split('|')[1]} 50%)` } : { backgroundColor: c }} />
              <span className="text-[11px] font-mono font-bold text-gray-600 w-16 truncate">{c}</span>
            </div>
            
            {!hasSizes && (
              <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-[4px] border border-gray-150">
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Qty:</span>
                <input type="number" min="0" value={form.colorStock?.[c] ?? ''}
                  onChange={e => onSetColorStock(c, e.target.value)}
                  className="w-full border-0 focus:ring-0 p-0 text-[11px] font-black text-center outline-none" />
              </div>
            )}

            <div className="flex items-center space-x-2">
              {form.variantImages?.[c] && (
                <img src={form.variantImages[c]} alt="Variant" className="w-8 h-8 rounded object-cover border border-gray-200 flex-shrink-0" />
              )}
              <label className={`flex-grow flex items-center justify-center py-2 px-3 border border-dashed border-gray-300 rounded-[4px] cursor-pointer hover:bg-white transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={12} className="text-gray-400 mr-2" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={e => onVariantImageUpload(c, e.target.files[0])} disabled={uploading} />
              </label>
            </div>
            
            <button onClick={() => onRemoveColor(c)} className="text-gray-400 hover:text-red-500 p-1 self-center sm:justify-self-end"><X size={16} /></button>
          </div>
        ))}
      </div>
    )}
  </div>
));

ColorsSection.displayName = 'ColorsSection';

const SizesSection = memo(({ form, sizeInput, setSizeInput, onAddSize, onRemoveSize, onSetSizeStock, hasColors }) => (
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
            {!hasColors && (
              <input type="number" min="0" value={form.sizeStock?.[size] ?? ''}
                onChange={e => onSetSizeStock(size, e.target.value)}
                className="w-16 border border-gray-200 rounded-[4px] px-2 py-1 text-[11px] font-black text-center" />
            )}
            <button onClick={() => onRemoveSize(size)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
          </div>
        ))}
      </div>
    )}
  </div>
));

SizesSection.displayName = 'SizesSection';

/**
 * VariantMatrixSection — Color × Size Stock Matrix
 * Shown when a product has BOTH colors AND sizes.
 * Each cell = qty for that exact (color, size) pair.
 */
const VariantMatrixSection = memo(({ form, onSetMatrixStock }) => {
  const { colors = [], sizes = [], variantMatrix = {}, variantImages = {} } = form;

  const getColorName = (color) => {
    if (color.includes('|')) {
      const parts = color.split('|');
      const isHex = (s) => /^#([0-9A-F]{3,6})$/i.test(s);
      return isHex(parts[0]) && !isHex(parts[1]) ? parts[1] : parts.join('/');
    }
    return color;
  };

  const getColorStyle = (color) => {
    if (color.includes('|')) {
      const [a, b] = color.split('|');
      const isHex = (s) => /^#([0-9A-F]{3,6})$/i.test(s);
      if (isHex(a) && isHex(b)) return { background: `linear-gradient(135deg, ${a} 50%, ${b} 50%)` };
      if (isHex(a)) return { backgroundColor: a };
    }
    return { backgroundColor: color };
  };

  // Row totals per color
  const colorTotals = colors.reduce((acc, color) => {
    acc[color] = sizes.reduce((s, size) => s + (parseInt(variantMatrix[`${color}|${size}`]) || 0), 0);
    return acc;
  }, {});

  // Column totals per size
  const sizeTotals = sizes.reduce((acc, size) => {
    acc[size] = colors.reduce((s, color) => s + (parseInt(variantMatrix[`${color}|${size}`]) || 0), 0);
    return acc;
  }, {});

  const grandTotal = Object.values(colorTotals).reduce((s, n) => s + n, 0);

  return (
    <div className="border border-black/10 rounded-[4px] overflow-hidden">
      {/* Header */}
      <div className="bg-black px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/50 mb-0.5">Stock Matrix</p>
          <p className="text-sm font-black uppercase tracking-tight text-white">Color × Size Quantities</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Grand Total</p>
          <p className="text-lg font-black text-white tabular-nums">{grandTotal}</p>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {/* Color label column */}
              <th className="px-3 py-2.5 text-[8px] font-black uppercase tracking-widest text-gray-400 w-32">
                Color ↓ / Size →
              </th>
              {/* Size columns */}
              {sizes.map(size => (
                <th key={size} className="px-3 py-2.5 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">{size}</span>
                  <div className="text-[8px] font-bold text-gray-400 mt-0.5 tabular-nums">∑{sizeTotals[size]}</div>
                </th>
              ))}
              {/* Row total column */}
              <th className="px-3 py-2.5 text-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Total</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {colors.map((color, rowIdx) => (
              <tr key={color} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                {/* Color label */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                      style={getColorStyle(color)}
                    />
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-700 truncate max-w-[80px]">
                      {getColorName(color)}
                    </span>
                  </div>
                </td>
                {/* Qty cells */}
                {sizes.map(size => {
                  const key = `${color}|${size}`;
                  const val = variantMatrix[key] ?? '';
                  return (
                    <td key={size} className="px-2 py-1.5 text-center">
                      <input
                        type="number"
                        min="0"
                        value={val}
                        onChange={e => onSetMatrixStock(color, size, e.target.value)}
                        className={`w-14 border rounded-[4px] px-2 py-1.5 text-[11px] font-black text-center outline-none focus:border-black transition-colors tabular-nums ${
                          (parseInt(val) || 0) === 0 ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 bg-white text-gray-900'
                        }`}
                      />
                    </td>
                  );
                })}
                {/* Row total */}
                <td className="px-3 py-1.5 text-center">
                  <span className={`text-[11px] font-black tabular-nums ${colorTotals[color] === 0 ? 'text-red-500' : 'text-gray-700'}`}>
                    {colorTotals[color]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          {/* Footer totals row */}
          <tfoot>
            <tr className="bg-gray-100 border-t-2 border-gray-200">
              <td className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-500">Size Total</td>
              {sizes.map(size => (
                <td key={size} className="px-2 py-2 text-center">
                  <span className={`text-[11px] font-black tabular-nums ${sizeTotals[size] === 0 ? 'text-red-500' : 'text-gray-700'}`}>
                    {sizeTotals[size]}
                  </span>
                </td>
              ))}
              <td className="px-3 py-2 text-center">
                <span className="text-[12px] font-black text-black tabular-nums">{grandTotal}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
          ↑ Enter the exact number of units available for each color + size combination. Red cells = 0 stock.
        </p>
      </div>
    </div>
  );
});

VariantMatrixSection.displayName = 'VariantMatrixSection';

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
                  updates.subCategory = 'Shirts';
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
  id: '', name: '', price: '', quantity: 0,
  image: '', lifestyleImage: '', mediaType: 'upload', embedCode: '',
  gallery: [],
  bucket: 'Tops', subCategory: 'Shirts',
  rating: 5, stock: 0,
  specs: ['', '', ''],
  colors: [],
  variantImages: {},
  sizes: [],
  sizeStock: {},
  colorStock: {},
  featuredSection: 'collection',
  displayOrder: 0,
  discount: 0,
  description: '',
  careInstructions: '',
};

export { ProductForm };
export default ProductForm;
