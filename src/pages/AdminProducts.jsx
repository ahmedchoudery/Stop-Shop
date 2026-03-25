import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Edit3, X, Save, Package, AlertTriangle,
  Search, Image, DollarSign, Upload, Link2, Code2,
  Play, CheckCircle, Copy
} from 'lucide-react';
import { apiUrl } from '../config/api';

// ─── Constants ───────────────────────────────────────────────
const BUCKETS = ['Tops', 'Bottoms', 'Footwear', 'Accessories'];
const SUBCATEGORIES = {
  Tops: ['Polo', 'Shirt', 'T-Shirt', 'Hoodie', 'Jacket'],
  Bottoms: ['Jeans', 'Pants', 'Shorts', 'Chinos'],
  Footwear: ['Shoes', 'Slippers'],
  Accessories: ['Belt', 'Cap', 'Bag', 'Socks'],
};

const MEDIA_TABS = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'url', label: 'Visual Asset (URL)', icon: Link2 },
  { id: 'embed', label: 'Embedded Code', icon: Code2 },
];

const EMPTY_FORM = {
  id: '', name: '', price: '', quantity: '',
  image: '', mediaType: 'upload', embedCode: '',
  bucket: 'Tops', subCategory: 'Polo',
  rating: 5, stock: 10,
  specs: ['', '', ''],
  colors: [],
};

// ─── Embed helpers ────────────────────────────────────────────
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

function embedThumbnail(raw) {
  if (!raw) return null;
  const ytMatch = raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return null;
}

// ─── MediaPreview ─────────────────────────────────────────────
const MediaPreview = ({ form }) => {
  useEffect(() => {
    if (form.mediaType === 'embed' && form.embedCode) {
      const raw = form.embedCode;
      if (raw.includes('instagram-media') || raw.includes('instagram.com/embed.js')) {
        const existing = document.querySelector('script[src*="instagram.com/embed.js"]');
        if (!existing) {
          const s = document.createElement('script');
          s.async = true;
          s.src = 'https://www.instagram.com/embed.js';
          s.onload = () => {
            if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process();
          };
          document.body.appendChild(s);
        } else {
          if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process();
        }
      }
      if (raw.includes('tiktok-embed') || raw.includes('tiktok.com/embed.js') || /tiktok\.com\/@[^/]+\/video\//i.test(raw)) {
        const existing = document.querySelector('script[src*="tiktok.com/embed.js"]');
        if (!existing) {
          const s = document.createElement('script');
          s.async = true;
          s.src = 'https://www.tiktok.com/embed.js';
          document.body.appendChild(s);
        }
      }
      if (raw.includes('twitter-tweet') || raw.includes('platform.twitter.com/widgets.js')) {
        const existing = document.querySelector('script[src*="platform.twitter.com/widgets.js"]');
        if (!existing) {
          const s = document.createElement('script');
          s.async = true;
          s.src = 'https://platform.twitter.com/widgets.js';
          s.onload = () => {
            if (window.twttr?.widgets?.load) window.twttr.widgets.load();
          };
          document.body.appendChild(s);
        } else {
          if (window.twttr?.widgets?.load) window.twttr.widgets.load();
        }
      }
      if (raw.includes('fb-post') || raw.includes('facebook.com/sdk.js')) {
        if (!window.FB) {
          const s = document.createElement('script');
          s.async = true;
          s.defer = true;
          s.crossOrigin = 'anonymous';
          s.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v13.0';
          s.onload = () => {
            if (window.FB?.XFBML?.parse) window.FB.XFBML.parse();
          };
          document.body.appendChild(s);
        } else {
          if (window.FB?.XFBML?.parse) window.FB.XFBML.parse();
        }
      }
      if (raw.includes('reddit-embed') || raw.includes('embed.redditmedia.com')) {
        const existing = document.querySelector('script[src*="embed.redditmedia.com/widgets/platform.js"]');
        if (!existing) {
          const s = document.createElement('script');
          s.async = true;
          s.src = 'https://embed.redditmedia.com/widgets/platform.js';
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
};

// ─── ProductCard ──────────────────────────────────────────────
const ProductCard = ({ product, onEdit, onDelete }) => {
  const hasEmbed = product.mediaType === 'embed' && product.embedCode;
  const thumb = hasEmbed ? embedThumbnail(product.embedCode) : null;
  const displayImg = thumb || product.image;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group">
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {displayImg
          ? <img src={displayImg} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><Image size={32} className="text-gray-200" /></div>
        }
        {hasEmbed && (
          <div className="absolute top-2 left-2 flex items-center space-x-1 bg-black/70 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">
            <Play size={10} /><span>Video</span>
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
          <p className="text-sm font-black text-red-600">${parseFloat(product.price || 0).toFixed(2)}</p>
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
};

// ─── Main Component ───────────────────────────────────────────
export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [colorInput, setColorInput] = useState('#000000');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [mediaTab, setMediaTab] = useState('upload');
  const [embedCopied, setEmbedCopied] = useState(false);

  const token = localStorage.getItem('adminToken');
  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchProducts = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/products'), { headers: authHeaders });
      if (res.status === 401 || res.status === 403) { window.location.href = '/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch');
      setProducts(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const openAdd = () => {
    setEditingProduct(null);
    setForm({ ...EMPTY_FORM, id: 'prod-' + Date.now() });
    setMediaTab('upload');
    setIsModalOpen(true);
  };

  const openEdit = (p) => {
    setEditingProduct(p);
    const mt = p.mediaType || (p.embedCode ? 'embed' : 'upload');
    setForm({
      id: p.id || p._id, name: p.name || '', price: p.price || '',
      quantity: p.quantity ?? '', image: p.image || '',
      mediaType: mt, embedCode: p.embedCode || '',
      bucket: p.bucket || 'Tops', subCategory: p.subCategory || 'Polo',
      rating: p.rating || 5, stock: p.stock ?? p.quantity ?? 10,
      specs: p.specs?.length ? [...p.specs, '', '', ''].slice(0, 3) : ['', '', ''],
      colors: p.colors || [],
    });
    setMediaTab(mt);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingProduct(null); setForm(EMPTY_FORM); setMediaTab('upload'); };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, image: reader.result, mediaType: 'upload' }));
    reader.readAsDataURL(file);
  };

  const handleTabSwitch = (tab) => { setMediaTab(tab); setForm(f => ({ ...f, mediaType: tab })); };

  const injectTemplate = (template) => { setForm(f => ({ ...f, embedCode: template, mediaType: 'embed' })); setMediaTab('embed'); };

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Product name is required');
    if (!form.price) return alert('Price is required');
    if (!form.image && !form.embedCode) return alert('Please add a product image or embed code');
    setSaving(true);
    try {
      const payload = {
        id: form.id, name: form.name.trim(), price: parseFloat(form.price),
        quantity: parseInt(form.quantity) || 0, stock: parseInt(form.quantity) || 0,
        image: form.image, mediaType: form.mediaType, embedCode: form.embedCode || '',
        bucket: form.bucket, subCategory: form.subCategory,
        rating: parseInt(form.rating) || 5,
        specs: form.specs.filter(s => s.trim()), colors: form.colors,
      };
      const url = editingProduct
        ? apiUrl(`/api/admin/products/${editingProduct.id || editingProduct._id}`)
        : apiUrl('/api/admin/products');
      const res = await fetch(url, { method: editingProduct ? 'PATCH' : 'POST', headers: authHeaders, body: JSON.stringify(payload) });
      if (!res.ok) {
        const ct = res.headers.get('content-type') || '';
        let errText = '';
        try {
          errText = ct.includes('application/json') ? (await res.json()).error : (await res.text());
        } catch {
          errText = `HTTP ${res.status}`;
        }
        throw new Error(errText || 'Save failed');
      }
      await fetchProducts();
      closeModal();
    } catch (e) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (productId) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/products/${productId}`), { method: 'DELETE', headers: authHeaders });
      if (!res.ok) throw new Error('Delete failed');
      setProducts(prev => prev.filter(p => (p.id || p._id) !== productId));
    } catch (e) { alert('Error: ' + e.message); }
    setDeleteConfirm(null);
  };

  const addColor = () => { if (!form.colors.includes(colorInput)) setForm(f => ({ ...f, colors: [...f.colors, colorInput] })); };
  const removeColor = (c) => setForm(f => ({ ...f, colors: f.colors.filter(x => x !== c) }));
  const filtered = products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-8">

      {/* Header */}
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:border-red-600 outline-none transition-all" />
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 font-bold text-sm">{error}</div>}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-2xl">
          <Package size={48} className="text-gray-200 mb-4" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No products yet</p>
          <button onClick={openAdd} className="mt-4 text-[11px] font-black uppercase tracking-widest text-red-600 border-b border-red-200 hover:border-red-600 transition-colors">Add your first product →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => <ProductCard key={p._id || p.id} product={p} onEdit={openEdit} onDelete={(id) => setDeleteConfirm(id)} />)}
        </div>
      )}

      {/* Delete Confirm */}
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

      {/* ══ ADD / EDIT MODAL ══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-gray-900 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center"><Package size={16} /></div>
                <h3 className="font-black uppercase tracking-tight">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-xl transition-all hover:rotate-90 transform"><X size={20} /></button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-grow p-6 space-y-7">

              {/* ── MEDIA SECTION ── */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Product Media *</label>

                {/* Tab switcher */}
                <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-4">
                  {MEDIA_TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => handleTabSwitch(id)}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${mediaTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}>
                      <Icon size={14} /><span>{label}</span>
                    </button>
                  ))}
                </div>

                {/* Upload tab */}
                {mediaTab === 'upload' && (
                  <div className="flex items-start space-x-4">
                    <div className="w-28 h-28 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden flex-shrink-0">
                      {form.image
                        ? <img src={form.image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Image size={28} className="text-gray-300" /></div>
                      }
                    </div>
                    <div className="flex-grow">
                      <label className="flex flex-col items-center justify-center w-full py-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-red-400 hover:bg-red-50 transition-all">
                        <Upload size={20} className="text-gray-400 mb-2" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Click to Upload Image</span>
                        <span className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP up to 5MB</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                )}

                {/* URL tab */}
                {mediaTab === 'url' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="text" placeholder="https://example.com/product-image.jpg"
                        value={form.image.startsWith('data:') ? '' : form.image}
                        onChange={e => setForm(f => ({ ...f, image: e.target.value, mediaType: 'url' }))}
                        className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:border-red-600 outline-none transition-colors" />
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                      Need embedded video or iframe?{' '}
                      <button type="button" onClick={() => handleTabSwitch('embed')} className="text-red-600 underline hover:text-red-700">
                        Switch to Embedded Code
                      </button>
                    </p>
                    {form.image && !form.image.startsWith('data:') && (
                      <div className="w-full aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                        <img src={form.image} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                      </div>
                    )}
                  </div>
                )}

                {/* Embed tab */}
                {mediaTab === 'embed' && (
                  <div className="space-y-4">

                    {/* Quick template buttons */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Quick Templates</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: '▶ YouTube URL', t: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID' },
                          { label: '▶ Vimeo URL', t: 'https://vimeo.com/YOUR_VIDEO_ID' },
                          { label: '</> iframe', t: '<iframe src="https://www.youtube.com/embed/YOUR_VIDEO_ID" width="100%" height="315" frameborder="0" allowfullscreen></iframe>' },
                          { label: '🎥 .mp4 URL', t: 'https://example.com/your-video.mp4' },
                        ].map(({ label, t }) => (
                          <button key={label} onClick={() => injectTemplate(t)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-700 border border-gray-200 hover:border-red-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Code textarea */}
                    <div className="relative">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Embedded Code or URL</label>
                      <textarea
                        value={form.embedCode}
                        onChange={e => setForm(f => ({ ...f, embedCode: e.target.value, mediaType: 'embed' }))}
                        placeholder={`Paste your embed code or URL here.\n\nSupported:\n• YouTube URL  →  https://youtube.com/watch?v=...\n• Vimeo URL  →  https://vimeo.com/...\n• iframe tag  →  <iframe src="..." ...></iframe>\n• Direct video  →  https://example.com/video.mp4\n• Direct image  →  https://example.com/image.jpg`}
                        rows={7}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:border-red-600 outline-none transition-colors resize-none bg-gray-50"
                      />
                      {form.embedCode && (
                        <button onClick={() => { navigator.clipboard.writeText(form.embedCode); setEmbedCopied(true); setTimeout(() => setEmbedCopied(false), 2000); }}
                          className="absolute top-3 right-3 p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-gray-700 transition-all" title="Copy">
                          {embedCopied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>

                    {/* Live preview */}
                    {form.embedCode && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center space-x-1.5">
                          <Play size={10} /><span>Live Preview</span>
                        </p>
                        <div className="w-full aspect-video rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-900">
                          <MediaPreview form={form} />
                        </div>
                      </div>
                    )}

                    {/* Help box */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-900 mb-1">Supported Formats</p>
                      <p className="text-xs text-blue-700">• YouTube & Vimeo watch URLs (auto-converted)</p>
                      <p className="text-xs text-blue-700">• Any &lt;iframe&gt; embed code</p>
                      <p className="text-xs text-blue-700">• Direct .mp4 / .webm / .ogg video file URLs</p>
                      <p className="text-xs text-blue-700">• Direct image URLs (.jpg, .png, .webp)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Name & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Product Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Classic Red Polo"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-red-600 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Price ($) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="0.00"
                      className="w-full border-2 border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm font-bold focus:border-red-600 outline-none transition-colors" />
                  </div>
                </div>
              </div>

              {/* Stock & Category */}
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

              {/* Specs */}
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

              {/* Colors */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Color Variants</label>
                <div className="flex items-center space-x-3 mb-3">
                  <input type="color" value={colorInput} onChange={e => setColorInput(e.target.value)}
                    className="w-12 h-10 rounded-lg border-2 border-gray-200 cursor-pointer" />
                  <input type="text" value={colorInput} onChange={e => setColorInput(e.target.value)}
                    className="flex-grow border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:border-red-600 outline-none" />
                  <button onClick={addColor} className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors">Add</button>
                </div>
                {form.colors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.colors.map(c => (
                      <div key={c} className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                        <div className="w-4 h-4 rounded-full border border-gray-300"
                          style={
                            c.includes('|')
                              ? { background: `linear-gradient(to right, ${c.split('|')[0]} 50%, ${c.split('|')[1]} 50%)` }
                              : { backgroundColor: c }
                          }
                        />
                        <span className="text-[11px] font-mono font-bold text-gray-600">{c}</span>
                        <button onClick={() => removeColor(c)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rating */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Rating (1–5)</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setForm(f => ({ ...f, rating: n }))}
                      className={`w-10 h-10 rounded-xl border-2 font-black text-sm transition-all ${form.rating >= n ? 'border-yellow-400 bg-yellow-50 text-yellow-600' : 'border-gray-200 text-gray-300'
                        }`}>★</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center space-x-3 px-6 py-5 border-t border-gray-100 flex-shrink-0">
              <button onClick={closeModal} className="flex-1 py-4 border-2 border-gray-200 rounded-xl font-black uppercase text-xs tracking-widest hover:border-gray-400 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-[2] py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2">
                {saving
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Save size={16} /><span>{editingProduct ? 'Save Changes' : 'Add Product'}</span></>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
