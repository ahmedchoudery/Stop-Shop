import React, { useState, useEffect } from 'react';
import { Upload, Megaphone, Save, CheckCircle, RefreshCcw } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({ logo: '', announcement: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchSettings = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch('http://localhost:5000/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings({ logo: data.logo || '', announcement: data.announcement || '' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-black uppercase tracking-widest text-gray-400">Syncing Identity Engine...</div>;

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-12">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900 border-l-8 border-[#8B0000] pl-6">
          Store Identity
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2 ml-6">
          Global Branding & Marquee Configuration
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-12">
        {/* Branding Section */}
        <section className="bg-white border border-gray-100 p-10 rounded-sm shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Upload size={120} />
          </div>
          
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-8 flex items-center space-x-3">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            <span>Visual Branding</span>
          </h3>

          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-48 h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-sm flex items-center justify-center overflow-hidden group relative">
              {settings.logo ? (
                <img src={settings.logo} alt="Site Logo" className="max-w-full max-h-full object-contain p-4" />
              ) : (
                <div className="text-center p-6">
                  <Upload className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 leading-tight">No logo<br/>detected</p>
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <span className="text-white text-[9px] font-black uppercase tracking-widest">Update Logo</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
            
            <div className="flex-grow">
              <p className="text-sm font-black uppercase tracking-tighter text-gray-900 mb-2">Primary Site Logo</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-loose">
                Upload your brand mark. This will appear in the navigation bar and checkout screens across all platforms.
              </p>
              <div className="mt-6 flex space-x-4">
                <label className="bg-gray-900 text-white px-6 py-3 text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-red-900 transition-colors rounded-sm">
                  Upload Asset
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
                {settings.logo && (
                  <button 
                    type="button"
                    onClick={() => setSettings({ ...settings, logo: '' })}
                    className="px-6 py-3 text-[9px] font-black uppercase tracking-widest border border-gray-200 text-gray-400 hover:text-red-900 hover:border-red-900 transition-all rounded-sm"
                  >
                    Reset to Text
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Messaging Section */}
        <section className="bg-white border border-gray-100 p-10 rounded-sm shadow-2xl relative overflow-hidden">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-8 flex items-center space-x-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span>Global Messaging</span>
          </h3>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-900 mb-3 block">
                Announcement Bar Text
              </label>
              <div className="relative">
                <Megaphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="e.g. Free Delivery on orders over Rs. 5000!"
                  className="w-full bg-gray-50 border border-gray-100 rounded-sm py-5 pl-12 pr-6 text-sm font-bold focus:border-red-600 outline-none transition-all shadow-inner"
                  value={settings.announcement}
                  onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                />
              </div>
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-4 italic">
                Pro Tip: Keep it short for better mobile visibility
              </p>
            </div>
          </div>
        </section>

        {/* Save Footer */}
        <div className="flex items-center space-x-6">
          <button 
            type="submit"
            disabled={saving}
            className={`flex items-center space-x-4 px-12 py-5 rounded-sm shadow-2xl transition-all ${
              saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#8B0000] hover:bg-black text-white'
            }`}
          >
            {saving ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
            <span className="text-[11px] font-black uppercase tracking-[0.4em]">Apply Identity Updates</span>
          </button>

          {success && (
            <div className="flex items-center space-x-3 text-green-600 animate-in fade-in slide-in-from-left-4">
              <CheckCircle size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Changes are now live!</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
