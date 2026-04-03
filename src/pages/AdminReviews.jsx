/**
 * @fileoverview AdminReviews.jsx
 * Route: /admin/reviews
 *
 * Admin moderation for product reviews:
 * - See all pending / approved / rejected reviews
 * - One-click approve or reject
 * - Delete reviews permanently
 * - Filter by status and product
 * - Shows product name, customer info, rating, title, body
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    Star, CheckCircle, XCircle, Trash2, RefreshCw,
    MessageSquare, Filter, AlertCircle, Eye
} from 'lucide-react';
import { authFetch, handleAuthError } from '../lib/auth.js';
import { apiUrl } from '../config/api.js';

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

const useToast = () => {
    const [toast, setToast] = useState(null);
    const show = useCallback((message, type = 'success') => {
        setToast({ message, type, id: Date.now() });
        setTimeout(() => setToast(null), 3500);
    }, []);
    return { toast, show };
};

const StarDisplay = ({ rating }) => (
    <div className="flex space-x-0.5">
        {[1, 2, 3, 4, 5].map(n => (
            <Star key={n} size={11} className={n <= rating ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-gray-200'} />
        ))}
    </div>
);

const STATUS_CONFIG = {
    pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    approved: { label: 'Approved', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200' },
};

const timeAgo = (date) => {
    if (!date) return '—';
    const diff = Date.now() - new Date(date).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 30) return `${d}d ago`;
    return new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const { toast, show: showToast } = useToast();

    // ── Fetch ─────────────────────────────────────────────────────
    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(apiUrl('/api/admin/reviews'));
            if (handleAuthError(res.status)) return;
            if (!res.ok) throw new Error('Failed to load reviews');
            setReviews(await res.json());
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    // ── Approve / Reject ──────────────────────────────────────────
    const handleStatus = async (review, status) => {
        setActionLoading(review._id + status);
        try {
            const res = await authFetch(apiUrl(`/api/admin/reviews/${review._id}`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error('Failed to update review');
            const updated = await res.json();
            setReviews(prev => prev.map(r => r._id === review._id ? updated : r));
            showToast(`Review ${status === 'approved' ? 'approved ✓' : 'rejected'}`);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // ── Delete ────────────────────────────────────────────────────
    const handleDelete = async (review) => {
        if (!window.confirm(`Delete this review by ${review.customerName}? This cannot be undone.`)) return;
        setActionLoading(review._id + 'delete');
        try {
            const res = await authFetch(apiUrl(`/api/admin/reviews/${review._id}`), { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete review');
            setReviews(prev => prev.filter(r => r._id !== review._id));
            showToast('Review deleted');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // ── Filtered list ─────────────────────────────────────────────
    const filtered = reviews.filter(r => statusFilter === 'all' || r.status === statusFilter);
    const counts = {
        all: reviews.length,
        pending: reviews.filter(r => r.status === 'pending').length,
        approved: reviews.filter(r => r.status === 'approved').length,
        rejected: reviews.filter(r => r.status === 'rejected').length,
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-2">Customer Feedback</p>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Reviews</h1>
                </div>
                <button
                    onClick={fetchReviews}
                    disabled={loading}
                    className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all disabled:opacity-40"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Toast */}
            {toast && (
                <div key={toast.id} className={`mb-6 p-4 rounded-xl flex items-center space-x-3 animate-slide-up border ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
                    }`}>
                    {toast.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                    <p className="text-xs font-bold">{toast.message}</p>
                </div>
            )}

            {/* Status filter tabs */}
            <div className="flex space-x-2 mb-8 overflow-x-auto pb-1">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'approved', label: 'Approved' },
                    { key: 'rejected', label: 'Rejected' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${statusFilter === key
                                ? key === 'pending' ? 'bg-amber-500 text-white'
                                    : key === 'approved' ? 'bg-green-600 text-white'
                                        : key === 'rejected' ? 'bg-red-600 text-white'
                                            : 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        <span>{label}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${statusFilter === key ? 'bg-white/20 text-white' : 'bg-white text-gray-500'
                            }`}>
                            {counts[key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Reviews list */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl">
                {loading ? (
                    <div className="p-16 text-center">
                        <div className="w-8 h-8 border-2 border-gray-100 border-t-[#ba1f3d] rounded-full animate-spin mx-auto" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-20 text-center">
                        <MessageSquare size={32} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-300">
                            {statusFilter === 'all' ? 'No reviews yet' : `No ${statusFilter} reviews`}
                        </p>
                        <p className="text-[10px] text-gray-300 mt-2">
                            Reviews appear here when customers submit them on product pages
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filtered.map(review => {
                            const cfg = STATUS_CONFIG[review.status] ?? STATUS_CONFIG.pending;
                            const isExpanded = expandedId === review._id;
                            const isActing = actionLoading?.startsWith(review._id);

                            return (
                                <div key={review._id} className="group hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-start gap-4 px-6 py-5">

                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-[#ba1f3d]/10 border border-[#ba1f3d]/20 flex items-center justify-center flex-shrink-0 text-[#ba1f3d] text-xs font-black">
                                            {(review.customerName ?? 'A').charAt(0).toUpperCase()}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                                <div className="min-w-0">
                                                    {/* Customer + Rating */}
                                                    <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                                                        <p className="text-sm font-black uppercase tracking-tight text-gray-900">
                                                            {review.customerName}
                                                        </p>
                                                        <StarDisplay rating={review.rating} />
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                            {cfg.label}
                                                        </span>
                                                    </div>

                                                    {/* Email + Product + Date */}
                                                    <div className="flex items-center space-x-3 mt-0.5 flex-wrap gap-y-0.5">
                                                        <p className="text-[9px] font-bold text-gray-400 lowercase">{review.customerEmail}</p>
                                                        {review.productId && (
                                                            <p className="text-[9px] font-black text-[#ba1f3d] uppercase tracking-widest">
                                                                SKU: {review.productId}
                                                            </p>
                                                        )}
                                                        <p className="text-[9px] font-bold text-gray-300">{timeAgo(review.createdAt)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <p className="text-sm font-black uppercase tracking-tight text-gray-900 mt-3">
                                                "{review.title}"
                                            </p>

                                            {/* Body — truncated unless expanded */}
                                            <p className={`text-sm text-gray-600 font-medium mt-1 leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                                                {review.body}
                                            </p>

                                            {review.body?.length > 120 && (
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : review._id)}
                                                    className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-700 mt-1 transition-colors"
                                                >
                                                    {isExpanded ? 'Show less' : 'Read more'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center space-x-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">

                                            {/* Approve */}
                                            {review.status !== 'approved' && (
                                                <button
                                                    onClick={() => handleStatus(review, 'approved')}
                                                    disabled={isActing}
                                                    title="Approve review — makes it live on product page"
                                                    className="flex items-center space-x-1.5 px-3 py-2 bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-green-100 transition-all disabled:opacity-40"
                                                >
                                                    {actionLoading === review._id + 'approved'
                                                        ? <div className="w-3 h-3 border border-green-500/30 border-t-green-600 rounded-full animate-spin" />
                                                        : <CheckCircle size={12} />
                                                    }
                                                    <span>Approve</span>
                                                </button>
                                            )}

                                            {/* Reject */}
                                            {review.status !== 'rejected' && (
                                                <button
                                                    onClick={() => handleStatus(review, 'rejected')}
                                                    disabled={isActing}
                                                    title="Reject review — hides it from product page"
                                                    className="flex items-center space-x-1.5 px-3 py-2 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all disabled:opacity-40"
                                                >
                                                    {actionLoading === review._id + 'rejected'
                                                        ? <div className="w-3 h-3 border border-red-400/30 border-t-red-500 rounded-full animate-spin" />
                                                        : <XCircle size={12} />
                                                    }
                                                    <span>Reject</span>
                                                </button>
                                            )}

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(review)}
                                                disabled={isActing}
                                                title="Delete permanently"
                                                className="p-2 text-gray-300 hover:text-[#ba1f3d] hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                                            >
                                                {actionLoading === review._id + 'delete'
                                                    ? <div className="w-3 h-3 border border-red-300/30 border-t-red-400 rounded-full animate-spin" />
                                                    : <Trash2 size={13} />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
                        {filtered.length} review{filtered.length !== 1 ? 's' : ''}
                        {counts.pending > 0 && (
                            <span className="ml-2 text-amber-500">· {counts.pending} awaiting approval</span>
                        )}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">
                        MongoDB · stopshop.reviews
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminReviews;