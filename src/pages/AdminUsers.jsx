/**
 * @fileoverview AdminUsers — Team management page
 * Applies: react-ui-patterns (loading/error/empty states), design-spells (card hover, delete confirm)
 */

import React, { useState, useCallback } from 'react';
import { Plus, UserCheck, UserX, Shield, Clock, AlertCircle, X, Save } from 'lucide-react';
import { AsyncContent } from '../components/ErrorBoundary.jsx';
import { useAdminUsers } from '../hooks/useDomain.js';
import { EASING } from '../hooks/useAnime.js';

const ROLES = ['admin', 'super-admin', 'auditor'];

const AdminUsers = () => {
  const { users, loading, error, creating, deleting, createUser, deleteUser, refetch } = useAdminUsers();
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', roles: ['admin'] });
  const [formErrors, setFormErrors] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const validateForm = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      await createUser(form);
      showToast('Admin account created');
      setForm({ name: '', email: '', password: '', roles: ['admin'] });
      setShowForm(false);
    } catch (err) {
      showToast(err.message ?? 'Failed to create admin', 'error');
    }
  };

  const handleDelete = useCallback(async (user) => {
    if (!window.confirm(`Remove ${user.name}'s access? This cannot be undone.`)) return;
    try {
      await deleteUser(user._id);
      showToast('Access revoked');
    } catch (err) {
      showToast(err.message ?? 'Failed to remove user', 'error');
    }
  }, [deleteUser]);

  const inputCls = (field) =>
    `w-full border-b-2 py-3 text-sm font-bold bg-transparent outline-none transition-all placeholder:text-gray-300 ${
      formErrors[field] ? 'border-red-400' : 'border-gray-100 focus:border-[#ba1f3d]'
    }`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">Access Control</p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Team</h1>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center space-x-2 px-6 py-3 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-900 transition-all duration-300 shadow-xl shadow-red-200/40 btn-shimmer"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showForm ? 'Cancel' : 'Add Admin'}</span>
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 animate-fade-up ${
          toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          <AlertCircle size={14} />
          <p className="text-xs font-bold">{toast.message}</p>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="mb-8 bg-white border border-gray-100 rounded-2xl p-8 shadow-xl animate-slide-up">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-8">New Admin Account</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Full Name</label>
              <input
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ahmed Khan"
                className={inputCls('name')}
              />
              {formErrors.name && <p className="text-[9px] text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Email</label>
              <input
                type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="admin@stopshop.com"
                className={inputCls('email')}
              />
              {formErrors.email && <p className="text-[9px] text-red-500 mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Password</label>
              <input
                type="password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min 6 characters"
                className={inputCls('password')}
              />
              {formErrors.password && <p className="text-[9px] text-red-500 mt-1">{formErrors.password}</p>}
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Role</label>
              <select
                value={form.roles[0]}
                onChange={e => setForm(p => ({ ...p, roles: [e.target.value] }))}
                className="w-full border-b-2 border-gray-100 focus:border-[#ba1f3d] py-3 text-sm font-bold bg-transparent outline-none transition-all"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center space-x-2 px-8 py-3 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
          >
            {creating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Save size={13} /><span>Create Account</span></>
            )}
          </button>
        </div>
      )}

      {/* Users list */}
      <AsyncContent loading={loading} error={error} data={users} onRetry={refetch}
        empty={
          <div className="p-16 text-center border-2 border-dashed border-gray-100 rounded-xl">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-300">No team members yet</p>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(users ?? []).map(user => (
            <div
              key={user._id}
              className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-400 relative overflow-hidden"
            >
              {/* Shimmer on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />

              <div className="flex items-start justify-between mb-5 relative z-10">
                <div className="w-12 h-12 bg-[#ba1f3d] rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {user.name?.charAt(0)?.toUpperCase() ?? 'A'}
                </div>
                {!user.isPrimary && (
                  <button
                    onClick={() => handleDelete(user)}
                    disabled={deleting}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                    title="Remove access"
                  >
                    <UserX size={15} />
                  </button>
                )}
                {user.isPrimary && (
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#FBBF24] bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-lg">
                    Owner
                  </span>
                )}
              </div>

              <div className="relative z-10">
                <p className="font-black uppercase tracking-tight text-gray-900 mb-0.5">{user.name}</p>
                <p className="text-[10px] text-gray-400 font-bold lowercase mb-3">{user.email}</p>

                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  {user.roles?.map(role => (
                    <span key={role} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                      role === 'super-admin' ? 'bg-red-50 text-[#ba1f3d]' :
                      role === 'auditor' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Shield size={9} />
                      <span>{role}</span>
                    </span>
                  ))}
                </div>

                {user.lastLogin && (
                  <div className="flex items-center space-x-1.5 mt-3">
                    <Clock size={10} className="text-gray-300" />
                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                      Last login: {new Date(user.lastLogin).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </AsyncContent>
    </div>
  );
};

export default AdminUsers;
