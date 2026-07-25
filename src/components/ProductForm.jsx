import React, { useState, useEffect, memo } from 'react';
import { X, Image, Upload, Link2, Code2 } from 'lucide-react';
import { CATEGORIES, CATEGORY_MAP, getDefaultSubCategory } from '../utils/categories.js';
import { authFetch } from '../lib/auth.js';
import { apiUrl } from '../config/api.js';
import { getColorName } from '../utils/color-namer.js';



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

  // Push a new image URL into the variantImages array for the given color
  const handleVariantImageUpload = async (color, file) => {
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadFileToCloudinary(file);
      setForm(f => {
        const existing = Array.isArray(f.variantImages?.[color])
          ? f.variantImages[color]
          : (f.variantImages?.[color] ? [f.variantImages[color]] : []);
        return {
          ...f,
          variantImages: { ...(f.variantImages || {}), [color]: [...existing, url] }
        };
      });
    } catch (err) {
      alert('Failed to upload variant image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Remove one specific URL from a color's image array
  const removeVariantImage = (color, urlToRemove) => {
    setForm(f => {
      const existing = Array.isArray(f.variantImages?.[color]) ? f.variantImages[color] : [];
      return {
        ...f,
        variantImages: { ...(f.variantImages || {}), [color]: existing.filter(u => u !== urlToRemove) }
      };
    });
  };

  const addColor = () => {
    const color = colorInput.trim();
    if (!color) return;
    if (!form.colors.includes(color)) {
      setForm(f => {
        // Normalise any existing value for this color to an array
        const existing = f.variantImages?.[color];
        const normalised = Array.isArray(existing)
          ? existing
          : (existing && typeof existing === 'string' && existing.trim() ? [existing] : []);
        return {
          ...f,
          colors: [...f.colors, color],
          variantImages: { ...(f.variantImages || {}), [color]: normalised },
          colorStock: { ...(f.colorStock || {}), [color]: f.colorStock?.[color] ?? 0 },
          // If sizes exist, add matrix entries for this color × all sizes
          variantMatrix: f.sizes?.length > 0
            ? f.sizes.reduce((m, size) => ({ ...m, [`${color}|${size}`]: f.variantMatrix?.[`${color}|${size}`] ?? 0 }), { ...(f.variantMatrix || {}) })
            : (f.variantMatrix || {}),
        };
      });
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

  // Auto-clear size variants if Category is Accessories
  useEffect(() => {
    if (form.bucket === 'Accessories') {
      if ((form.sizes && form.sizes.length > 0) || (form.sizeStock && Object.keys(form.sizeStock).length > 0) || (form.variantMatrix && Object.keys(form.variantMatrix).length > 0)) {
        setForm(f => ({
          ...f,
          sizes: [],
          sizeStock: {},
          variantMatrix: {}
        }));
      }
    }
  }, [form.bucket, form.sizes, form.sizeStock, form.variantMatrix, setForm]);

  return (
    <div className="space-y-7 text-left">
      {/* ① Hero media */}
      <MediaSection
        form={form}
        setForm={setForm}
        onImageUpload={handleImageUpload}
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
        onSecondaryMediaUpload={handleSecondaryMediaUpload}
        uploading={uploading}
      />

      {/* Outfit Items selection for Defined by Attitude products */}
      {form.featuredSection === 'attitude' && (
        <OutfitItemsSection
          form={form}
          setForm={setForm}
          allProducts={allProducts}
        />
      )}

      {/* Standard Product Variant & Inventory sections (Hidden for Defined by Attitude outfits) */}
      {form.featuredSection !== 'attitude' && (
        <>
          <ColorsSection
            form={form}
            colorInput={colorInput}
            setColorInput={setColorInput}
            onAddColor={addColor}
            onRemoveColor={removeColor}
            onVariantImageUpload={handleVariantImageUpload}
            onRemoveVariantImage={removeVariantImage}
            onSetColorStock={setColorStock}
            uploading={uploading}
            hasSizes={form.sizes?.length > 0}
          />

          {form.colors?.length === 0 && (
            <GallerySection
              form={form}
              onGalleryUpload={handleGalleryUpload}
              onRemoveGallery={removeGalleryItem}
              uploading={uploading}
            />
          )}

          {form.bucket !== 'Accessories' && (
            <SizesSection
              form={form}
              sizeInput={sizeInput}
              setSizeInput={setSizeInput}
              onAddSize={addSize}
              onRemoveSize={removeSize}
              onSetSizeStock={setSizeStock}
              hasColors={form.colors?.length > 0}
              subCategory={form.subCategory}
            />
          )}

          {form.colors?.length > 0 && form.sizes?.length > 0 && (
            <VariantMatrixSection
              form={form}
              onSetMatrixStock={setMatrixStock}
            />
          )}

          <RatingSection form={form} setForm={setForm} />
        </>
      )}
    </div>
  );
});

ProductForm.displayName = 'ProductForm';

const MediaSection = memo(({ form, setForm, onImageUpload, uploading }) => {
  const mediaType = form.mediaType || 'upload';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">
          Product Media (Image or Video) *
        </label>
        <div className="flex space-x-1 border border-gray-200 rounded-[4px] p-0.5 bg-gray-50">
          {[
            { id: 'upload', label: 'Upload' },
            { id: 'url', label: 'URL' },
            { id: 'embed', label: 'Embed' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setForm(f => ({ ...f, mediaType: tab.id }))}
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-[2px] transition-all ${
                mediaType === tab.id
                  ? 'bg-black text-white'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-start space-x-4">
        <div className="w-28 h-28 bg-gray-50 border border-dashed border-gray-200 rounded-[4px] overflow-hidden flex-shrink-0 relative">
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {mediaType === 'embed' && form.embedCode ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-2 text-center">
              <Code2 size={20} className="text-gray-400 mb-1" />
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">
                Embed Code Ready
              </span>
            </div>
          ) : form.image ? (
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
          {mediaType === 'upload' && (
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
          )}

          {mediaType === 'url' && (
            <div className="space-y-2">
              <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400">
                Direct URL to Image or Video
              </span>
              <input
                type="text"
                value={form.image || ''}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="w-full border border-gray-200 rounded-[4px] px-4 py-3 text-sm font-bold focus:border-black outline-none transition-colors"
              />
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                Supports direct links to images or video formats (.mp4, .webm).
              </p>
            </div>
          )}

          {mediaType === 'embed' && (
            <div className="space-y-2">
              <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400">
                Embed HTML / Code
              </span>
              <textarea
                value={form.embedCode || ''}
                onChange={e => setForm(f => ({ ...f, embedCode: e.target.value }))}
                placeholder="Paste HTML embed code from YouTube, TikTok, Instagram, etc."
                className="w-full border border-gray-200 rounded-[4px] px-4 py-3 text-xs font-mono focus:border-black outline-none transition-colors h-20 resize-none"
              />
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                Supports iframe/video embed elements. Player will render inline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MediaSection.displayName = 'MediaSection';

/**
 * GallerySection
 * Only rendered when the product has NO color variants.
 * These images are shown in the product detail page carousel.
 */
const GallerySection = memo(({ form, onGalleryUpload, onRemoveGallery, uploading }) => (
  <div className="border border-dashed border-blue-200 bg-blue-50/40 rounded-[4px] p-4 space-y-3">
    {/* Header */}
    <div className="flex items-start justify-between gap-3">
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-blue-700 mb-0.5">
          Product Images
        </label>
        <p className="text-[9px] font-bold text-blue-500 leading-snug">
          Upload all photos shown on the product detail page.
          The first image is the main thumbnail in the product grid.
        </p>
      </div>
      <label className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-[4px] cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all ${
        uploading ? 'opacity-50 pointer-events-none' : ''
      }`}>
        <Upload size={12} className="text-blue-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
          {uploading ? 'Uploading...' : 'Add Image'}
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={onGalleryUpload} disabled={uploading} />
      </label>
    </div>

    {/* Thumbnails */}
    {form.gallery?.length > 0 ? (
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {form.gallery.map((item, idx) => (
          <div key={`${item}-${idx}`} className="relative group rounded-[4px] overflow-hidden border border-blue-100">
            <img src={item} alt={`Photo ${idx + 1}`} className="w-full h-20 object-cover" />
            {idx === 0 && (
              <span className="absolute bottom-0 inset-x-0 text-center text-[8px] font-black uppercase tracking-wider bg-blue-600/80 text-white py-0.5">
                Thumbnail
              </span>
            )}
            <button
              onClick={() => onRemoveGallery(item)}
              className="absolute top-1 right-1 bg-white/90 text-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-[10px] font-bold text-blue-400 text-center py-3">
        No images uploaded yet — click &ldquo;Add Image&rdquo; above.
      </p>
    )}
  </div>
));

GallerySection.displayName = 'GallerySection';


const BasicInfoSection = memo(({ form, setForm }) => {
  const isAttitude = form.featuredSection === 'attitude';

  if (isAttitude) {
    return (
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Outfit Title / Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Summer Linen & Pleated Trousers Outfit"
          className="w-full border border-gray-200 rounded-[4px] px-4 py-3 text-sm font-bold focus:border-black outline-none transition-colors"
        />
        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
          Defined by Attitude outfits display individual item cards on client page (No outfit price/variants required).
        </p>
      </div>
    );
  }

  return (
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
  );
});

BasicInfoSection.displayName = 'BasicInfoSection';

const DescriptionSection = memo(({ form, setForm }) => {
  const isAttitude = form.featuredSection === 'attitude';

  if (isAttitude) {
    return (
      <div className="bg-gray-50/50 border border-gray-200/80 rounded-xl p-5 space-y-3">
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-700 mb-1">
          Outfit Description / Editorial Overview
        </label>
        <textarea
          value={form.description || ''}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="e.g. Lightweight linen shirt paired with pleated sand-colored trousers."
          className="w-full border border-gray-200 rounded-lg px-3.5 py-3 text-xs font-semibold focus:border-black outline-none transition-all h-28 resize-none bg-white leading-relaxed"
        />
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
          Shown on outfit page above the items list.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 border border-gray-200/80 rounded-xl p-5 space-y-4">
      <div className="flex items-center space-x-2 border-b border-gray-200/60 pb-3">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-900">
          Editorial Tabs (Description, Materials, Care)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={form.description || ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Enter custom product description..."
            className="w-full border border-gray-200 rounded-lg px-3.5 py-3 text-xs font-semibold focus:border-black outline-none transition-all h-28 resize-none bg-white leading-relaxed"
          />
          <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
            Tab: Description
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-700 mb-2">
            Materials & Composition
          </label>
          <textarea
            value={form.materials || ''}
            onChange={e => setForm(f => ({ ...f, materials: e.target.value }))}
            placeholder="e.g. 100% Organic Heavyweight Cotton / 18K Gold Plated"
            className="w-full border border-gray-200 rounded-lg px-3.5 py-3 text-xs font-semibold focus:border-black outline-none transition-all h-28 resize-none bg-white leading-relaxed"
          />
          <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
            Tab: Materials
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-700 mb-2">
            Care Instructions
          </label>
          <textarea
            value={form.careInstructions || ''}
            onChange={e => setForm(f => ({ ...f, careInstructions: e.target.value }))}
            placeholder="e.g. Machine wash cold with like colors. Do not tumble dry."
            className="w-full border border-gray-200 rounded-lg px-3.5 py-3 text-xs font-semibold focus:border-black outline-none transition-all h-28 resize-none bg-white leading-relaxed"
          />
          <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
            Tab: Care
          </p>
        </div>
      </div>
    </div>
  );
});

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



/**
 * ColorsSection
 * Each color gets its own dedicated image gallery.
 * - First image = thumbnail shown in product grid & card.
 * - All images = gallery shown on product detail page when that color is selected.
 * - Admin can upload as many images as they want per color.
 */
const ColorsSection = memo(({ form, colorInput, setColorInput, onAddColor, onRemoveColor, onVariantImageUpload, onRemoveVariantImage, onSetColorStock, uploading, hasSizes }) => {
  const getColorImages = (color) => {
    const raw = form.variantImages?.[color];
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'string' && raw.trim()) return [raw]; // backward compat
    return [];
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          Color Variants
        </label>
        {form.colors.length > 0 && (
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
            {form.colors.length} color{form.colors.length > 1 ? 's' : ''} added
          </span>
        )}
      </div>

      {/* Color picker row */}
      <div className="flex items-center space-x-3 mb-4">
        <input
          type="color"
          value={colorInput.includes('|') ? colorInput.split('|')[0] : (colorInput || '#000000')}
          onChange={e => {
            const hex = e.target.value;
            const name = getColorName(hex);
            setColorInput(`${hex}|${name}`);
          }}
          className="w-12 h-10 rounded-[4px] border border-gray-200 cursor-pointer"
        />
        <input type="text" value={colorInput} onChange={e => setColorInput(e.target.value)}
          placeholder="#FF0000 or #FF0000|ColorName"
          className="flex-grow border border-gray-200 rounded-[4px] px-4 py-2.5 text-sm font-mono font-bold focus:border-black outline-none" />
        <button onClick={onAddColor} className="px-4 py-2.5 bg-black text-white rounded-[4px] text-[11px] font-black uppercase tracking-widest hover:bg-black/90 transition-colors">
          Add Color
        </button>
      </div>

      {/* Per-color image gallery cards */}
      {form.colors.length > 0 && (
        <div className="space-y-4">
          {form.colors.map(c => {
            const colorImages = getColorImages(c);
            return (
              <div key={c} className="border border-gray-200 rounded-[4px] overflow-hidden">
                {/* Color card header */}
                <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full border-2 border-white ring-1 ring-gray-300 flex-shrink-0"
                      style={
                        c.includes('|')
                          ? { background: `linear-gradient(135deg, ${c.split('|')[0]} 50%, ${c.split('|')[1]} 50%)` }
                          : { backgroundColor: c }
                      }
                    />
                    <div>
                      <p className="text-[11px] font-black font-mono text-gray-800 leading-none">
                        {c.includes('|') && !c.split('|')[0].startsWith('#') ? c : c.split('|')[1] || c}
                      </p>
                      <p className="text-[9px] text-gray-400 font-mono mt-0.5">{c}</p>
                    </div>
                    {!hasSizes && (
                      <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-[4px] px-2.5 py-1 ml-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Stock:</span>
                        <input
                          type="number" min="0"
                          value={form.colorStock?.[c] ?? ''}
                          onChange={e => onSetColorStock(c, e.target.value)}
                          className="w-14 border-0 focus:ring-0 p-0 text-[11px] font-black text-center outline-none"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveColor(c)}
                    className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                    title="Remove color"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Image gallery area */}
                <div className="p-3 bg-white">
                  {/* Instruction */}
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Images for this color
                    <span className="normal-case font-normal ml-1 text-gray-400">
                      — first image is the thumbnail shown in the product grid
                    </span>
                  </p>

                  {/* Uploaded images grid */}
                  {colorImages.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-2">
                      {colorImages.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="relative group rounded-[4px] overflow-hidden border border-gray-200">
                          <img src={url} alt={`${c} photo ${idx + 1}`} className="w-full h-16 object-cover" />
                          {idx === 0 && (
                            <span className="absolute bottom-0 inset-x-0 text-center text-[7px] font-black uppercase tracking-wider bg-black/70 text-white py-0.5">
                              Thumbnail
                            </span>
                          )}
                          <button
                            onClick={() => onRemoveVariantImage(c, url)}
                            className="absolute top-0.5 right-0.5 bg-white/90 text-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove"
                          >
                            <X size={9} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  <label className={`flex items-center justify-center gap-2 w-full py-2.5 border border-dashed border-gray-300 rounded-[4px] cursor-pointer hover:border-black hover:bg-gray-50 transition-all ${
                    uploading ? 'opacity-50 pointer-events-none' : ''
                  }`}>
                    <Upload size={12} className="text-gray-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {uploading ? 'Uploading...' : colorImages.length === 0 ? 'Upload First Image (Thumbnail)' : 'Add Another Image'}
                    </span>
                    <input
                      type="file" accept="image/*" className="hidden"
                      onChange={e => onVariantImageUpload(c, e.target.files[0])}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

ColorsSection.displayName = 'ColorsSection';

const SizesSection = memo(({ form, sizeInput, setSizeInput, onAddSize, onRemoveSize, onSetSizeStock, hasColors, subCategory }) => {
  const isJeans = subCategory === 'Jeans';
  const isFootwear = subCategory === 'Shoes' || subCategory === 'Slippers';
  
  const presets = isJeans
    ? ['28', '30', '32', '34', '36', '38']
    : isFootwear
      ? ['7', '8', '9', '10', '11']
      : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const addPreset = (size) => {
    if (!form.sizes.includes(size)) {
      // Reuse the same addSize logic by briefly setting sizeInput + calling onAddSize
      // We do it directly here to avoid state timing issues
      const normalized = size.trim().toUpperCase();
      if (!form.sizes.includes(normalized)) {
        // Call through the parent's addSize handler via a synthetic approach
        // We set sizeInput then call onAddSize — but since state is async, we trigger directly
      }
    }
  };

  const handlePresetClick = (size) => {
    setSizeInput(size);
    // Schedule the actual add after the state settles
    setTimeout(onAddSize, 0);
  };

  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Size Variants</label>

      {/* Smart preset pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 self-center mr-1">
          {isJeans ? 'Waist:' : isFootwear ? 'Shoe Size:' : 'Quick add:'}
        </span>
        {presets.map(preset => {
          const alreadyAdded = form.sizes.includes(preset);
          return (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              disabled={alreadyAdded}
              className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-[4px] border transition-all duration-150 ${
                alreadyAdded
                  ? 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 text-gray-600 hover:border-black hover:text-black hover:bg-gray-50 cursor-pointer'
              }`}
            >
              {preset}
            </button>
          );
        })}
      </div>

      {/* Manual text input */}
      <div className="flex items-center space-x-3 mb-3">
        <input type="text" value={sizeInput} onChange={e => setSizeInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAddSize())}
          placeholder={isJeans ? 'e.g. 28, 30, 32' : isFootwear ? 'e.g. 8, 9, 10' : 'e.g. M, L, XL'}
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
  );
});

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

const OutfitItemsSection = memo(({ form, setForm, allProducts = [] }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customIdOrUrl, setCustomIdOrUrl] = useState('');

  const outfitList = form.outfitProductIds || [];

  // Exclude attitude outfits from selectable products
  const availableProducts = (allProducts || []).filter(
    p => p.featuredSection !== 'attitude'
  );

  const handleAddProduct = (prodId) => {
    if (!prodId) return;
    if (outfitList.includes(prodId)) return;
    setForm(f => ({
      ...f,
      outfitProductIds: [...(f.outfitProductIds || []), prodId]
    }));
    setSelectedProductId('');
  };

  const handleAddCustom = () => {
    let clean = customIdOrUrl.trim();
    if (!clean) return;
    if (clean.includes('/product/')) {
      clean = clean.split('/product/')[1]?.split('?')[0]?.split('#')[0] || clean;
    }
    if (outfitList.includes(clean)) return;
    setForm(f => ({
      ...f,
      outfitProductIds: [...(f.outfitProductIds || []), clean]
    }));
    setCustomIdOrUrl('');
  };

  const handleRemove = (idToRemove) => {
    setForm(f => ({
      ...f,
      outfitProductIds: (f.outfitProductIds || []).filter(id => id !== idToRemove)
    }));
  };

  return (
    <div className="bg-gray-50/60 border border-gray-200 rounded-xl p-5 space-y-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between border-b border-gray-200/80 pb-3 gap-2">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 flex items-center space-x-2">
            <Link2 size={14} className="text-[#85110e]" />
            <span>Items in this Outfit (Lookbook Catalog)</span>
          </h3>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
            Attach individual catalog products featured in this lookbook outfit.
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest bg-[#85110e]/10 text-[#85110e] px-3 py-1 rounded-full shrink-0">
          {outfitList.length} {outfitList.length === 1 ? 'Item' : 'Items'} Attached
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Option 1: Catalogue Dropdown */}
        <div className="space-y-1.5 min-w-0">
          <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500">
            Select from Catalogue
          </label>
          <div className="flex items-center space-x-2 min-w-0">
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="min-w-0 flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:border-black focus:ring-1 focus:ring-black outline-none bg-white transition-all truncate"
            >
              <option value="">-- Choose a product --</option>
              {availableProducts.map(p => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.name} ({p.bucket} - Rs. {p.price})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleAddProduct(selectedProductId)}
              disabled={!selectedProductId}
              className="shrink-0 px-3.5 py-2 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Option 2: Paste Product ID / URL */}
        <div className="space-y-1.5 min-w-0">
          <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500">
            Or Paste Product ID / URL
          </label>
          <div className="flex items-center space-x-2 min-w-0">
            <input
              type="text"
              value={customIdOrUrl}
              onChange={e => setCustomIdOrUrl(e.target.value)}
              placeholder="e.g. PRD-123 or product URL"
              className="min-w-0 flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:border-black focus:ring-1 focus:ring-black outline-none bg-white transition-all truncate"
            />
            <button
              type="button"
              onClick={handleAddCustom}
              disabled={!customIdOrUrl.trim()}
              className="shrink-0 px-3.5 py-2 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              + Add
            </button>
          </div>
        </div>
      </div>

      {/* Attached List */}
      {outfitList.length > 0 ? (
        <div className="space-y-2 pt-2 border-t border-gray-200/80">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Attached Outfit Products ({outfitList.length}):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {outfitList.map(itemKey => {
              const matched = (allProducts || []).find(p => (p.id === itemKey || p._id === itemKey || p.slug === itemKey));
              return (
                <div key={itemKey} className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg shadow-2xs group hover:border-gray-300 transition-all">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                      {matched?.image ? (
                        <img src={matched.image} alt={matched.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-400">NO IMG</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase text-gray-900 truncate">
                        {matched?.name || itemKey}
                      </p>
                      <p className="text-[10px] font-bold text-gray-500 font-mono">
                        {matched ? `Rs. ${matched.price?.toLocaleString()} · ${matched.bucket}` : `#${itemKey}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(itemKey)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Remove item from outfit"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-5 bg-white border border-dashed border-gray-200 rounded-xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            No products attached yet
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            Select catalog items above to build the editorial lookbook outfit.
          </p>
        </div>
      )}
    </div>
  );
});

OutfitItemsSection.displayName = 'OutfitItemsSection';

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

const PlacementSection = memo(({ form, setForm, allProducts, editingProduct, onSecondaryMediaUpload, uploading }) => {
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
                  : 'border-gray-255 bg-white hover:border-gray-400 text-black'
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

      {/* Lifestyle Image for Defined by Attitude */}
      {selectedSection === 'attitude' && (
        <div className="bg-white border border-gray-200 rounded-[4px] p-4 space-y-3">
          <div>
            <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
              Lifestyle / Lookbook Image (optional)
            </span>
            <p className="text-[10px] text-gray-500 font-bold leading-normal">
              Shown in the editorial Lookbook strip instead of the main product thumbnail.
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-20 bg-gray-50 border border-gray-200 rounded-[4px] overflow-hidden flex-shrink-0 relative">
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {form.lifestyleImage ? (
                <img src={form.lifestyleImage} alt="Lifestyle" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image size={18} className="text-gray-300" />
                </div>
              )}
            </div>
            
            <div className="flex-grow flex items-center space-x-2">
              <label className={`flex-grow flex items-center justify-center py-2 px-3 border border-dashed border-gray-300 rounded-[4px] cursor-pointer hover:bg-gray-50 hover:border-black transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={12} className="text-gray-400 mr-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  {uploading ? 'Uploading...' : form.lifestyleImage ? 'Change Image' : 'Upload Image'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={onSecondaryMediaUpload} disabled={uploading} />
              </label>
              
              {form.lifestyleImage && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, lifestyleImage: '' }))}
                  className="px-3 py-2 border border-red-200 text-red-600 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
  specs: [],
  colors: [],
  variantImages: {},
  sizes: [],
  sizeStock: {},
  colorStock: {},
  featuredSection: 'collection',
  displayOrder: 0,
  discount: 0,
  description: '',
  materials: '',
  careInstructions: '',
  outfitProductIds: [],
};

export { ProductForm };
export default ProductForm;
