import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, X, Shield, Mail, Lock, User } from 'lucide-react';
import { apiUrl } from '../config/api';

const AdminUsers = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);

  const fetchAdmins = async () => {
    try {
      const response = await fetch(apiUrl('/api/admin/users'), {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch team members');
      const data = await response.json();
      setAdmins(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(apiUrl('/api/admin/users'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add member');
      }

      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to revoke this user\'s administrative access?')) return;
    
    try {
      const response = await fetch(apiUrl(`/api/admin/users/${adminId}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke access');
      }

      fetchAdmins();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-10 text-center font-black uppercase tracking-widest text-gray-400 italic">Syncing Team Registry...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900 border-l-8 border-[#ba1f3d] pl-6">
            Team Management
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2 ml-6">
            Administrative Access Control & Security
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-3 bg-[#ba1f3d] px-6 py-3 rounded-sm shadow-xl shadow-[#ba1f3d]/10 hover:bg-black transition-all text-white group"
        >
          <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Add New Member</span>
        </button>
      </header>

      <div className="bg-white border border-gray-100 shadow-2xl rounded-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Identity</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Security Level</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {admins.map((admin) => (
              <tr key={admin._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${admin.isPrimary ? 'bg-[#ba1f3d] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {admin.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight text-gray-900">{admin.name}</p>
                      <p className="text-[9px] font-bold text-gray-400 mt-0.5">Joined: {new Date(admin.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <p className="text-xs font-bold text-gray-600">{admin.email}</p>
                </td>
                <td className="p-6">
                  {admin.isPrimary ? (
                    <span className="flex items-center space-x-2 text-[#ba1f3d]">
                      <Shield size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest italic">Primary Owner</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2 text-gray-400">
                      <User size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest italic">Standard Admin</span>
                    </span>
                  )}
                </td>
                <td className="p-6 text-right">
                  {!admin.isPrimary && (
                    <button 
                      onClick={() => handleDelete(admin._id)}
                      className="p-2 text-gray-300 hover:text-[#ba1f3d] transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#ba1f3d] p-6 flex justify-between items-center">
              <h3 className="text-white text-xs font-black uppercase tracking-[0.3em]">Issue New Access</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddMember} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="FULL NAME"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-sm py-3 pl-10 pr-4 text-xs font-bold focus:border-[#ba1f3d] outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="email" 
                    placeholder="EMAIL ADDRESS"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-sm py-3 pl-10 pr-4 text-xs font-bold focus:border-[#ba1f3d] outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="password" 
                    placeholder="TEMPORARY PASSWORD"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-sm py-3 pl-10 pr-4 text-xs font-bold focus:border-[#ba1f3d] outline-none transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-[#ba1f3d] text-white py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-sm hover:bg-black transition-all shadow-xl shadow-[#ba1f3d]/10"
                >
                  Confirm Registration
                </button>
                <p className="text-center text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-4">
                  Security Protocol: Access is Immediate Upon Confirmation
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
