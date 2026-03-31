/**
 * @fileoverview AdminAuditPanel — Security audit logs
 * Applies: react-ui-patterns (loading/error/empty), design-spells (severity color coding, stagger rows)
 */

import React, { useState, useCallback } from 'react';
import { Shield, Search, Filter, RefreshCw, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import { AsyncContent } from '../components/ErrorBoundary.jsx';
import { authFetch } from '../lib/auth.js';
import { apiUrl } from '../config/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { useDebounce } from '../hooks/useUtils.js';
import { EASING } from '../hooks/useAnime.js';

const SEVERITY_CONFIG = {
  info: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Info, border: 'border-blue-100' },
  warning: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertTriangle, border: 'border-yellow-100' },
  critical: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle, border: 'border-red-100' },
};

const AdminAuditPanel = () => {
  const [searchRaw, setSearchRaw] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const searchTerm = useDebounce(searchRaw, 250);

  const fetchLogs = useCallback(async () => {
    const res = await authFetch(apiUrl('/api/admin/audits'));
    if (res.status === 404) return { logs: [], total: 0 }; // Endpoint may not exist yet
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  }, []);

  const [{ data, loading, error }, { execute: refetch }] = useAsync(fetchLogs, { initialData: { logs: [], total: 0 } });

  React.useEffect(() => { refetch(); }, [refetch]);

  const logs = data?.logs ?? [];

  const filtered = logs.filter(log => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      log.action?.toLowerCase().includes(q) ||
      log.adminEmail?.toLowerCase().includes(q);
    const matchSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchSearch && matchSeverity;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">Security</p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Audit Logs</h1>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2.5 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-all disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search actions or admin email..."
            value={searchRaw}
            onChange={e => setSearchRaw(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-9 pr-9 text-xs font-bold focus:bg-white focus:border-[#ba1f3d] outline-none transition-all placeholder:text-gray-300"
          />
          {searchRaw && (
            <button onClick={() => setSearchRaw('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {['all', 'info', 'warning', 'critical'].map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                severityFilter === s
                  ? s === 'all' ? 'bg-gray-900 text-white' :
                    s === 'critical' ? 'bg-red-600 text-white' :
                    s === 'warning' ? 'bg-yellow-500 text-white' : 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl">
        <AsyncContent
          loading={loading}
          error={error}
          data={filtered}
          onRetry={refetch}
          empty={
            <div className="p-16 text-center">
              <Shield size={28} className="mx-auto text-gray-200 mb-3" />
              <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-300">
                {searchTerm || severityFilter !== 'all' ? 'No logs match filters' : 'No audit logs recorded yet'}
              </p>
            </div>
          }
        >
          <div className="divide-y divide-gray-50">
            {filtered.map((log, i) => {
              const config = SEVERITY_CONFIG[log.severity ?? 'info'];
              const SeverityIcon = config.icon;
              return (
                <div
                  key={log._id ?? i}
                  className={`flex items-start space-x-4 px-6 py-4 hover:bg-gray-50/60 transition-colors duration-150`}
                >
                  <div className={`w-8 h-8 ${config.bg} border ${config.border} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <SeverityIcon size={13} className={config.color} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-black uppercase tracking-tight text-gray-900 truncate">
                        {log.action ?? 'Unknown action'}
                      </p>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex-shrink-0 ml-4">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('en-PK') : '—'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {log.adminEmail && (
                        <span className="text-[10px] font-bold text-gray-500">{log.adminEmail}</span>
                      )}
                      {log.resourceType && log.resourceType !== 'system' && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
                          {log.resourceType}
                        </span>
                      )}
                      {log.ip && (
                        <span className="text-[9px] font-mono text-gray-300">{log.ip}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </AsyncContent>

        <div className="px-6 py-4 border-t border-gray-100">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
            {filtered.length} of {logs.length} records · Logs auto-expire after 90 days
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditPanel;