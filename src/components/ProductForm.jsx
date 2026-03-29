import React, { useState, useEffect, memo } from 'react';
import {
  X, Save, Package, Image, DollarSign, Upload, Link2, Code2,
  Play, CheckCircle, Copy
} from 'lucide-react';

const MEDIA_TABS = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'url', label: 'Visual Asset (URL)', icon: Link2 },
  { id: 'embed', label: 'Embedded Code', icon: Code2 },
];

function parseEmbed(raw) {
  if (!raw?.trim()) return null;
  if (/^https?:\/\//.test(raw.trim()) && !raw.includes('<')) {
    const url = raw.trim().replace(/^['"`\s]+|['"`\s]+$/g, '');
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return { type: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}` };
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    if (url.includes('instagram.com')) {
      const igPostMatch = url.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[^/?#]+/i);
      if (igPostMatch) return { type: 'iframe', src: `${igPostMatch[0]}/embed/captioned` };
      return { type: 'raw', html: raw };
    }
    const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (ttMatch) {
      const safeUrl = url.replace(/"/g, '&quot;');
      const videoId = ttMatch[1];
      return {
        type: 'raw',
        html: `<blockquote class="tiktok-embed" cite="${safeUrl}" data-video-id="${videoId}" style="max-width:605px;min-width:325px;"><section><a target="_blank" href="${safeUrl}">View on TikTok</a></section></blockquote>`
      };
    }
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return { type: 'video', src: url };
    if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) return { type: 'image', src: url };
    return { type: 'iframe', src: url };
  }
  if (/<blockquote[\s>]/i.test(raw) || /<script[\s>]/i.test(raw)) return { type: 'raw', html: raw };
  const iframeMatch = raw.match(/<iframe[^>]*src=["']([^"']+)["']/i);
  if (iframeMatch) return { type: 'iframe', src: iframeMatch[1] };
  const videoMatch = raw.match(/<video[^>]*src=["']([^"']+)["']/i);
  if (videoMatch) return { type: 'video', src: videoMatch[1] };
  const imageMatch = raw.match(/<img[^>]*src=["']([^"']+)["']/i);
  if (imageMatch) return { type: 'image', src: imageMatch[1] };
  return { type: 'raw', html: raw };
}

const MediaPreview = memo(({ form }) => {
  useEffect(() => {
    if (form.mediaType === 'embed' && form.embedCode) {
      const raw = form.embedCode;
      if (raw.includes('instagram-media') || raw.includes('instagram.com/embed.js')) {
        const existing = document.querySelector('script[src*="instagram.com/embed.js"]');
        if (!existing) {
          const s = document.createElement('script');
          s.async = true;
          s.src = 'https://www.instagram.com/embed.js';
          s.onload = () => { if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process(); };
          document.body.appendChild(s);
        } else {
          if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process();
        }
      }
      if (raw.includes('tiktok-embed') || raw.includes('tiktok.com/embed.js')) {
        const existing = document.querySelector('script[src*="tiktok.com/embed.js"]');
        if (!existing) {
          const s = document.createElement('script');
          s.async = true;
          s.src = 'https://www.tiktok.com/embed.js';
          document.body.appendChild(s);
        }
      }
    }
  }, [form.mediaType, form.embedCode]);

  if (form.mediaType === 'embed' && form.embedCode) {
    const parsed = parseEmbed(form.embedCode);
    if (!parsed) return null;
    if (parsed.type === 'iframe') return (
      <iframe src={parsed.src} className="w-full h-full" frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen title="product-media" />
    );
    if (parsed.type === 'video') return (
      <video src={parsed.src} controls className="w-full h-full object-cover" />
    );
    if (parsed.type === 'raw') return (
      <div className="w-full h-full flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: parsed.html }} />
    );
    if (parsed.type === 'image') return (
      <img src={parsed.src} alt="" className="w-full h-full object-cover" />
    );
  }
  if (form.image) return <img src={form.image} alt="" className="w-full h-full object-cover" />;
  return null;
});

MediaPreview.displayName = 'MediaPreview';

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
}) => {
  const [mediaTab, setMediaTab] = useState(form.mediaType || 'upload');

  const handleTabSwitch = (tab) => {
    setMediaTab(tab);
    setForm(f => ({ ...f, mediaType: tab }));
  };

  const injectTemplate = (template) => {
    setForm(f => ({ ...f, embedCode: template, mediaType: 'embed' }));
    setMediaTab('embed');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, image: reader.result, mediaType: 'upload' }));
    reader.readAsDataURL(file);
  };

  const handleSecondaryMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, lifestyleImage: reader.result }));
    reader.readAsDataURL(file);
  };

  const addGalleryItem = () => {
    const value = galleryUrl.trim();
    if (!value) return;
    if (form.gallery.includes(value)) {
      alert('Already in gallery');
      return;
    }
    setForm(f => ({ ...f, gallery: [...(f.gallery || []), value] }));
    setGalleryUrl('');
  };

  const removeGalleryItem = (item) => {
    setForm(f => ({ ...f, gallery: (f.gallery || []).filter(g => g !== item) }));
  };

  const handleGalleryUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(f => ({ ...f, gallery: [...(f.gallery || []), reader.result] }));
    };
    reader.readAsDataURL(file);
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
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-gray-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center"><Package size={16} /></div>
            <h3 className="font-black uppercase tracking-tight">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all hover:rotate-90 transform"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-grow p-6 space-y-7">
          <MediaSection
            form={form}
            mediaTab={mediaTab}
            onTabSwitch={handleTabSwitch}
            onImageUpload={handleImageUpload}
            injectTemplate={injectTemplate}
            embedCopied={embedCopied}
            setEmbedCopied={setEmbedCopied}
          />

          <GallerySection
            form={form}
            galleryUrl={galleryUrl}
            setGalleryUrl={setGalleryUrl}
            onAddGallery={addGalleryItem}
            onRemoveGallery={removeGalleryItem}
            onGalleryUpload={handleGalleryUpload}
          />

          <BasicInfoSection form={form} setForm={setForm} />

          <StockCategorySection form={form} setForm={setForm} />

          <SpecsSection form={form} setForm={setForm} />

          <ColorsSection
            form={form}
            colorInput={colorInput}
            setColorInput={setColorInput}
            onAddColor={addColor}
            onRemoveColor={removeColor}
            onSetVariantImage={setVariantImageForColor}
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

        <div className="flex items-center space-x-3 px-6 py-5 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-4 border-2 border-gray-200 rounded-xl font-black uppercase text-xs tracking-widest hover:border-gray-400 transition-colors">Cancel</button>
          <button onClick={onSave} disabled={saving}
            className="flex-[2] py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2">
            {saving
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Save size={16} /><span>{editingProduct ? 'Save Changes' : 'Add Product'}</span></>
            }
          </button>
        </div>
      </div>
    </div>
  );
});

ProductForm.displayName = 'ProductForm';

const MediaSection = memo(({ form, mediaTab, onTabSwitch, onImageUpload, injectTemplate, embedCopied, setEmbedCopied }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Product Media *</label>
    <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-4">
      {MEDIA_TABS.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => onTabSwitch(id)}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${mediaTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
          <Icon size={14} /><span>{label}</span>
        </button>
      ))}
    </div>

    {mediaTab === 'upload' && (
      <div className="flex items-start space-x-4">
        <div className="w-28 h-28 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden flex-shrink-0">
          {form.image ? <img src={form.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image size={28} className="text-gray-300" /></div>}
        </div>
        <div className="flex-grow">
          <label className="flex flex-col items-center justify-center w-full py-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-red-400 hover:bg-red-50 transition-all">
            <Upload size={20} className="text-gray-400 mb-2" />
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Click to Upload Image</span>
            <span className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP up to 5MB</span>
            <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
          </label>
        </div>
      </div>
    )}

    {mediaTab === 'url' && (
      <div className="space-y-3">
        <div className="relative">
          <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="https://example.com/product-image.jpg"
            value={form.image.startsWith('data:') ? '' : form.image}
            onChange={e => setForm(f => ({ ...f, image: e.target.value, mediaType: 'url' }))} // eslint-disable-line no-undef
            className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:border-red-600 outline-none transition-colors" />
        </div>
        {form.image && !form.image.startsWith('data:') && (
          <div className="w-full aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
            <img src={form.image} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
          </div>
        )}
      </div>
    )}

    {mediaTab === 'embed' && (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { label: '▶ YouTube URL', t: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID' },
            { label: '▶ Vimeo URL', t: 'https://vimeo.com/YOUR_VIDEO_ID' },
            { label: '</> iframe', t: '<iframe src="https://www.youtube.com/embed/YOUR_VIDEO_ID" width="100%" height="315" frameborder="0" allowfullscreen></iframe>' },
          ].map(({ label, t }) => (
            <button key={label} onClick={() => injectTemplate(t)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-700 border border-gray-200 hover:border-red-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
              {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <textarea value={form.embedCode}
            onChange={e => setForm(f => ({ ...f, embedCode: e.target.value, mediaType: 'embed' }))} // eslint-disable-line no-undef
            placeholder="Paste embed code or URL..."
            rows={5}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:border-red-600 outline-none transition-colors resize-none bg-gray-50" />
          {form.embedCode && (
            <button onClick={() => { navigator.clipboard.writeText(form.embedCode); setEmbedCopied(true); setTimeout(() => setEmbedCopied(false), 2000); }}
              className="absolute top-3 right-3 p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-gray-700 transition-all">
              {embedCopied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          )}
        </div>
        {form.embedCode && (
          <div className="w-full aspect-video rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-900">
            <MediaPreview form={form} />
          </div>
        )}
      </div>
    )}
  </div>
));

MediaSection.displayName = 'MediaSection';

const GallerySection = memo(({ form, galleryUrl, setGalleryUrl, onAddGallery, onRemoveGallery, onGalleryUpload }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Gallery Images (optional)</label>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
      <input type="text" value={galleryUrl} onChange={e => setGalleryUrl(e.target.value)} placeholder="Image URL"
        className="col-span-2 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-red-600 outline-none transition-colors" />
      <button onClick={onAddGallery} className="px-4 py-3 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-colors">Add</button>
    </div>
    <label className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-red-400 hover:bg-red-50 transition-all mb-3">
      <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Upload Gallery Image</span>
      <input type="file" accept="image/*" className="hidden" onChange={onGalleryUpload} />
    </label>
    {form.gallery?.length > 0 && (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {form.gallery.map((item, idx) => (
          <div key={`${item}-${idx}`} className="relative rounded-xl overflow-hidden border border-gray-200">
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
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Product Name *</label>
      <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        placeholder="e.g. Classic Red Polo"
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-red-600 outline-none transition-colors" />
    </div>
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Price (PKR) *</label>
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
          placeholder="0.00"
          className="w-full border-2 border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm font-bold focus:border-red-600 outline-none transition-colors" />
      </div>
    </div>
  </div>
));

BasicInfoSection.displayName = 'BasicInfoSection';

const BUCKETS = ['Tops', 'Bottoms', 'Footwear', 'Accessories'];
const SUBCATEGORIES = {
  Tops: ['Polo', 'Shirt', 'T-Shirt', 'Hoodie', 'Jacket'],
  Bottoms: ['Jeans', 'Trousers', 'Shorts'],
  Footwear: ['Shoes', 'Slippers'],
  Accessories: ['Belt', 'Cap', 'Bag', 'Socks'],
};

const StockCategorySection = memo(({ form, setForm }) => (
  <div className="grid grid-cols-3 gap-4">
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Stock Qty</label>
      <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
        placeholder="0"
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-red-600 outline-none transition-colors" />
    </div>
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Category</label>
      <select value={form.bucket} onChange={e => setForm(f => ({ ...f, bucket: e.target.value, subCategory: SUBCATEGORIES[e.target.value][0] }))}
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-red-600 outline-none bg-white">
        {BUCKETS.map(b => <option key={b} value={b}>{b}</option>)}
      </select>
    </div>
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Sub-Category</label>
      <select value={form.subCategory} onChange={e => setForm(f => ({ ...f, subCategory: e.target.value }))}
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-red-600 outline-none bg-white">
        {(SUBCATEGORIES[form.bucket] || []).map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  </div>
));

StockCategorySection.displayName = 'StockCategorySection';

const SpecsSection = memo(({ form, setForm }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Product Specs (up to 3)</label>
    <div className="space-y-2">
      {form.specs.map((spec, i) => (
        <input key={i} type="text" value={spec}
          onChange={e => { const s = [...form.specs]; s[i] = e.target.value; setForm(f => ({ ...f, specs: s })); }}
          placeholder={`Spec ${i + 1} — e.g. 100% Cotton`}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-red-600 outline-none transition-colors" />
      ))}
    </div>
  </div>
));

SpecsSection.displayName = 'SpecsSection';

const ColorsSection = memo(({ form, colorInput, setColorInput, onAddColor, onRemoveColor, onSetVariantImage }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Color Variants</label>
    <div className="flex items-center space-x-3 mb-3">
      <input type="color" value={colorInput} onChange={e => setColorInput(e.target.value)}
        className="w-12 h-10 rounded-lg border-2 border-gray-200 cursor-pointer" />
      <input type="text" value={colorInput} onChange={e => setColorInput(e.target.value)}
        placeholder="#FF0000"
        className="flex-grow border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:border-red-600 outline-none" />
      <button onClick={onAddColor} className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors">Add</button>
    </div>
    {form.colors.length > 0 && (
      <div className="space-y-3">
        {form.colors.map(c => (
          <div key={c} className="grid grid-cols-3 items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full border border-gray-300"
                style={c.includes('|') ? { background: `linear-gradient(to right, ${c.split('|')[0]} 50%, ${c.split('|')[1]} 50%)` } : { backgroundColor: c }} />
              <span className="text-[11px] font-mono font-bold text-gray-600">{c}</span>
            </div>
            <input type="text" value={form.variantImages?.[c] || ''}
              onChange={e => onSetVariantImage(c, e.target.value)}
              placeholder="Variant Image URL"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs focus:border-red-600 outline-none" />
            <button onClick={() => onRemoveColor(c)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
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
        className="flex-grow border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-widest focus:border-red-600 outline-none" />
      <button onClick={onAddSize} className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors">Add</button>
    </div>
    {form.sizes.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {form.sizes.map(size => (
          <div key={size} className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-700">{size}</span>
            <input type="number" min="0" value={form.sizeStock?.[size] ?? 0}
              onChange={e => onSetSizeStock(size, e.target.value)}
              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-[11px] font-black text-center" />
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
          className={`w-10 h-10 rounded-xl border-2 font-black text-sm transition-all ${form.rating >= n ? 'border-yellow-400 bg-yellow-50 text-yellow-600' : 'border-gray-200 text-gray-300'}`}>★</button>
      ))}
    </div>
  </div>
));

RatingSection.displayName = 'RatingSection';

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
};

export { ProductForm };
export default ProductForm;
