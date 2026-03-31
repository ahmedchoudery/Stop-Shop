/**
 * @fileoverview AdminSettings — Store settings page
 * Applies: react-ui-patterns (loading, optimistic save), design-spells (preview live update)
 */

import React, { useState, useEffect } from 'react';
import { Save, Eye, Zap, Image, Megaphone, AlertCircle, CheckCircle } from 'lucide-react';
import { useSettings } from '../hooks/useDomain.js';
import { AsyncContent } from '../components/ErrorBoundary.jsx';

const AdminSettings = () => {
  const { data: settings, loading, error, updating, updateSettings, refetch } = useSettings(true);
  const [form, setForm] = useState({ logo: '', announcement: '' });
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({ logo: settings.logo ?? '', announcement: settings.announcement ?? '' });
    }
  }, [settings]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    try {
      await updateSettings(form);
      showToast('Settings updated successfully');
    } catch (err) {
      showToast(err.message ?? 'Failed to update settings', 'error');
    }
  };

  const inputCls = `w-full border-b-2 border-gray-100 focus:border-[#ba1f3d] py-3 text-sm font-bold bg-transparent outline-none transition-all placeholder:text-gray-300`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">Store Identity</p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Settings</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreview(p => !p)}
            className={`flex items-center space-x-2 px-4 py-2.5 border-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 ${
              preview ? 'border-[#ba1f3d] text-[#ba1f3d] bg-[#ba1f3d]/5' : 'border-gray-200 text-gray-600 hover:border-gray-900'
            }`}
          >
            <Eye size={13} />
            <span>Preview</span>
          </button>
          <button
            onClick={handleSave}
            disabled={updating}
            className="flex items-center space-x-2 px-6 py-2.5 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 transition-all disabled:opacity-50 shadow-xl shadow-red-200/40 btn-shimmer"
          >
            {updating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Save size={13} /><span>Save Changes</span></>
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 animate-fade-up ${
          toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
          <p className="text-xs font-bold">{toast.message}</p>
        </div>
      )}

      <AsyncContent loading={loading} error={error} data={settings} onRetry={refetch}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Logo setting */}
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                <Image size={16} className="text-[#ba1f3d]" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Store Logo</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">URL to image</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Logo URL</label>
                <input
                  type="url"
                  value={form.logo}
                  onChange={e => setForm(p => ({ ...p, logo: e.target.value }))}
                  placeholder="https://your-logo.com/logo.png"
                  className={inputCls}
                />
              </div>

              {/* Live preview */}
              {(preview || form.logo) && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Preview</p>
                  {form.logo ? (
                    <img
                      src={form.logo}
                      alt="Logo preview"
                      className="max-h-16 object-contain"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-black italic text-[#ba1f3d]">Stop</span>
                      <span className="text-gray-900 font-black text-2xl">&</span>
                      <span className="text-2xl font-black italic text-[#ba1f3d]">Shop</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Announcement setting */}
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-9 h-9 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Megaphone size={16} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Announcement Bar</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Scrolling marquee text</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                  Announcement Text
                  <span className="ml-2 text-gray-300">({form.announcement.length}/500)</span>
                </label>
                <textarea
                  value={form.announcement}
                  onChange={e => setForm(p => ({ ...p, announcement: e.target.value }))}
                  placeholder="Welcome to Stop & Shop — Premium Clothing"
                  maxLength={500}
                  rows={3}
                  className="w-full border-b-2 border-gray-100 focus:border-[#ba1f3d] py-3 text-sm font-bold bg-transparent outline-none transition-all placeholder:text-gray-300 resize-none mt-2"
                />
              </div>

              {/* Live preview */}
              {preview && form.announcement && (
                <div className="mt-4 bg-[#FBBF24] py-2.5 px-4 rounded-lg overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-950 truncate">
                    ✦ {form.announcement.toUpperCase()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* System info card */}
          <div className="lg:col-span-2 bg-gray-900 text-white rounded-2xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Zap size={16} className="text-[#FBBF24]" />
              <h3 className="text-sm font-black uppercase tracking-widest">System Status</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: 'Environment', value: import.meta.env.MODE ?? 'production' },
                { label: 'API URL', value: import.meta.env.VITE_API_URL ? 'Configured' : 'Proxy' },
                { label: 'RBAC', value: import.meta.env.VITE_RBAC_ENABLED === 'true' ? 'Enabled' : 'Disabled' },
                { label: 'Stage', value: import.meta.env.VITE_RBAC_STAGE ?? 'local' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">{item.label}</p>
                  <p className="text-sm font-black text-white uppercase tracking-tight">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AsyncContent>
    </div>
  );
};

export default AdminSettings;
