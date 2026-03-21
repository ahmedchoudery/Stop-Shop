import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store JWT
      localStorage.setItem('adminToken', data.token);
      
      // Redirect to Admin Dashboard
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white rounded-sm shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-red-800 p-8 text-center">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Stop & Shop</h2>
          <p className="text-red-100/60 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Admin Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 flex items-center space-x-3 animate-pulse">
              <AlertCircle className="text-red-600" size={20} />
              <p className="text-xs font-bold text-red-600 uppercase tracking-widest">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Admin Email"
                className="w-full bg-gray-100 border-none rounded-none py-4 pl-10 pr-4 text-xs font-black uppercase tracking-widest placeholder:text-gray-400 outline-none ring-2 ring-transparent focus:ring-red-600 transition-all"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Access Key"
                className="w-full bg-gray-100 border-none rounded-none py-4 pl-10 pr-4 text-xs font-black uppercase tracking-widest placeholder:text-gray-400 outline-none ring-2 ring-transparent focus:ring-red-600 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-red-700 shadow-xl shadow-red-200 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying Access...' : 'Authenticate'}
          </button>
        </form>

        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Restricted Area • Stop & Shop Gujrat
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
