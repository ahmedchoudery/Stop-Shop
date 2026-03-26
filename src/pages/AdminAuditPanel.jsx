import React, { useState } from 'react';
import { Search, Shield, Filter, Download, Activity, RefreshCw } from 'lucide-react';

const mockAudits = [
  { id: 'aud_9f2a', timestamp: '2026-03-24T14:32:00Z', user: 'admin@stopshop.com', action: 'UPDATE_PRODUCT', resource: 'prod_882', status: 'SUCCESS' },
  { id: 'aud_9f2b', timestamp: '2026-03-24T15:10:00Z', user: 'system_auto', action: 'DB_MIGRATION', resource: 'col_products', status: 'SUCCESS' },
  { id: 'aud_9f2c', timestamp: '2026-03-25T09:12:00Z', user: 'manager@stopshop.com', action: 'DELETE_ORDER', resource: 'ord_122', status: 'DENIED_RBAC' },
];

const AdminAuditPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  return (
    <div className="p-8 w-full max-w-6xl mx-auto animate-fade-in">
      <div className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Security Audits</h1>
            <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-sm flex items-center space-x-1">
              <Shield size={12} /><span>Phase 10 Logging</span>
            </span>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Real-time RBAC telemetry and mutation tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 text-[10px] font-black uppercase tracking-widest transition-all">
            <Download size={14} /> <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search Actor Email or Resource ID..."
            className="w-full bg-white border border-gray-200 pl-12 pr-4 py-4 text-sm font-bold placeholder:font-black tracking-wide outline-none focus:border-[#ba1f3d] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white border border-gray-200 px-4 py-4">
            <Filter size={14} className="text-gray-400" />
            <select
              className="bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-700 outline-none w-32 cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Events</option>
              <option value="SUCCESS">Success Only</option>
              <option value="DENIED_RBAC">RBAC Denials</option>
            </select>
          </div>
          <button className="p-4 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Event ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Actor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Action/Event</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Target Resource</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockAudits.map((audit) => (
                <tr key={audit.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black text-gray-400 font-mono">{audit.id}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-gray-600">{new Date(audit.timestamp).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-black text-gray-900">{audit.user}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#ba1f3d] bg-red-50 px-2 py-1 rounded-sm">{audit.action}</span>
                  </td>
                  <td className="px-6 py-5 border-gray-100 group-hover:border-transparent transition-colors">
                    <span className="text-xs font-bold text-gray-500">{audit.resource}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm ${
                      audit.status === 'SUCCESS' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {audit.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditPanel;
