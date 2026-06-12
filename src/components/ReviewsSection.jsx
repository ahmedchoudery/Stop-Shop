'use client';

/**
 * @fileoverview ReviewsSection — Unified Dark Edition
 * Fetches store-wide reviews and displays them with premium dark styling.
 * Theme: Obsidian bg, white text hierarchy, Cardinal Red accents.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Star, MessageCircle, CheckCircle, AlertCircle, X } from 'lucide-react';
import { apiUrl } from '../config/api.js';
import { useIntersectionObserver } from '../hooks/useUtils.js';

// ── Helpers ───────────────────────────────────────────────────────────
const Stars = ({ rating, size = 12 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={size}
        className={n <= rating ? 'fill-cardinal text-cardinal' : 'text-[#2a2a2a] fill-[#2a2a2a]'}
      />
    ))}
  </div>
);

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className="transition-transform duration-150 hover:scale-110 active:scale-95"
      >
        <Star
          size={22}
          className={
            n <= value
              ? 'fill-cardinal text-cardinal'
              : 'text-[#333] fill-[#333] hover:text-gray-500 hover:fill-[#555]'
          }
        />
      </button>
    ))}
  </div>
);

// ── Review Form Modal ─────────────────────────────────────────────────
const ReviewForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '', title: '', body: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.body) return;
    setSubmitting(true);
    setApiError('');
    try {
      const res = await fetch(apiUrl('/api/public/reviews'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setDone(true);
      setTimeout(() => { setDone(false); onClose(); onSuccess?.(); }, 2800);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center px-4 pb-0 sm:pb-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-[var(--bg-base)] border border-[var(--border)] p-8 rounded-[4px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] animate-fade-up">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#a4a4a2] mb-2">
              Share Your Experience
            </p>
            <h3 className="text-xl font-black uppercase tracking-tighter text-black leading-none">
              Write a Review
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 border border-gray-300 flex items-center justify-center text-gray-500 hover:border-black hover:text-black rounded-[4px] transition-all duration-200"
          >
            <X size={13} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-cardinal flex items-center justify-center mx-auto mb-5 rounded-[4px]">
              <CheckCircle size={26} className="text-white" />
            </div>
            <p className="font-black uppercase tracking-[0.3em] text-black text-sm mb-1.5">
              Review Submitted
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Awaiting moderation — thank you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Rating */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 mb-3">
                Your Rating
              </p>
              <StarPicker value={form.rating} onChange={(r) => setForm((p) => ({ ...p, rating: r }))} />
            </div>

            {/* Name + Email */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Name', field: 'name', type: 'text', required: true },
                { label: 'Email', field: 'email', type: 'email', required: true },
              ].map(({ label, field, type, required }) => (
                <div key={field} className="relative">
                  <input
                    type={type}
                    required={required}
                    value={form[field]}
                    onChange={set(field)}
                    placeholder=" "
                    className="peer w-full bg-transparent border-b border-[var(--border-mid)] focus:border-black py-3 text-black text-xs font-bold outline-none transition-colors duration-300 placeholder:text-transparent"
                  />
                  <label className="absolute left-0 top-3 text-[9px] font-black uppercase tracking-[0.35em] text-gray-500 peer-focus:text-black peer-[:not(:placeholder-shown)]:text-black transition-colors duration-300 pointer-events-none">
                    {label}
                  </label>
                </div>
              ))}
            </div>

            {/* Title */}
            <div className="relative">
              <input
                type="text"
                value={form.title}
                onChange={set('title')}
                placeholder=" "
                className="peer w-full bg-transparent border-b border-[var(--border-mid)] focus:border-black py-3 text-black text-xs font-bold outline-none transition-colors duration-300 placeholder:text-transparent"
              />
              <label className="absolute left-0 top-3 text-[9px] font-black uppercase tracking-[0.35em] text-gray-500 peer-focus:text-black peer-[:not(:placeholder-shown)]:text-black transition-colors duration-300 pointer-events-none">
                Review Title
              </label>
            </div>

            {/* Body */}
            <div className="relative">
              <textarea
                required
                rows={4}
                value={form.body}
                onChange={set('body')}
                placeholder=" "
                className="peer w-full bg-transparent border-b border-[var(--border-mid)] focus:border-black py-3 text-black text-xs font-bold outline-none transition-colors duration-300 resize-none placeholder:text-transparent"
              />
              <label className="absolute left-0 top-3 text-[9px] font-black uppercase tracking-[0.35em] text-gray-500 peer-focus:text-black peer-[:not(:placeholder-shown)]:text-black transition-colors duration-300 pointer-events-none">
                Your Review *
              </label>
            </div>

            {apiError && (
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle size={12} />
                <p className="text-[10px] font-bold">{apiError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary rounded-[4px] flex items-center justify-center gap-3"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <MessageCircle size={13} />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ── Individual Review Card ────────────────────────────────────────────
const ReviewCard = ({ review, index }) => {
  const initial = review.name?.charAt(0)?.toUpperCase() ?? '?';
  const date = new Date(review.createdAt || Date.now()).toLocaleDateString('en-PK', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <article
      className="bg-white border border-gray-100 p-7 hover:border-gray-300 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-500 rounded-none group relative overflow-hidden"
      style={{
        animationDelay: `${index * 80}ms`,
        opacity: 0,
        animation: `fadeSlideUp 0.6s ease forwards ${index * 100 + 200}ms`,
      }}
    >
      {/* Hover accent */}
      <div className="absolute top-0 left-0 w-0.5 h-full bg-cardinal scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-500" />

      {/* Stars + date */}
      <div className="flex items-center justify-between mb-5">
        <Stars rating={review.rating} size={12} />
        <span className="text-[9px] font-black uppercase tracking-[0.35em] text-[#a4a4a2]">{date}</span>
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="font-black uppercase tracking-tight text-black text-sm leading-tight mb-3">
          {review.title}
        </h4>
      )}

      {/* Body */}
      <p className="text-[12px] text-gray-500 leading-relaxed font-medium mb-6 line-clamp-4 italic">
        &ldquo;{review.body}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
        <div className="w-8 h-8 bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-black text-gray-600">{initial}</span>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700">{review.name}</p>
          <p className="text-[8px] font-bold uppercase tracking-widest text-[#a4a4a2] mt-0.5">Verified Purchase</p>
        </div>
      </div>
    </article>
  );
};

const MOCK_REVIEWS = [];

// ── Main Component ────────────────────────────────────────────────────
const ReviewsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const headerRef = useRef(null);

  const { ref: observerRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.15,
    triggerOnce: true,
  });

  // Merge refs
  const setHeaderRef = (el) => {
    headerRef.current = el;
    observerRef.current = el;
  };

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/public/reviews'));
      const data = await res.json();
      if (Array.isArray(data)) setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  if (loading) return null;
  if (!reviews || reviews.length === 0) return null;

  // Fallback to mock reviews if db is empty
  const activeReviews = reviews;

  // Compute aggregate rating
  const avgRating =
    activeReviews.length > 0
      ? (activeReviews.reduce((sum, r) => sum + (r.rating ?? 5), 0) / activeReviews.length).toFixed(1)
      : '5.0';

  // Featured review (highest rating, longest body)
  const featuredReview = activeReviews.length > 0
    ? [...activeReviews].sort((a, b) => (b.rating - a.rating) || (b.body?.length - a.body?.length))[0]
    : null;

  return (
    <>
      {/* ── Editorial Brand Statement ──────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 sm:py-28">
          <div
            ref={setHeaderRef}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 transition-all duration-1000 opacity-100 translate-y-0"
          >
            {/* Left: Brand claim */}
            <div className="lg:max-w-xl">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-cardinal mb-5">
                The Cardinal Experience
              </p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-black mb-1">
                Elite Quality.
              </h2>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-[#2a2a2a]">
                Local Legacy.
              </h2>
            </div>

            {/* Right: Aggregate rating */}
            <div className="flex items-end gap-6 lg:pb-2">
              <div>
                <span className="block text-[4.5rem] sm:text-[6rem] font-black text-black leading-none tracking-tighter tabular-nums">
                  {loading ? '—' : avgRating}
                </span>
                <Stars rating={Math.round(parseFloat(avgRating))} size={14} />
                <p className="text-[8px] font-bold uppercase tracking-widest text-[#a4a4a2] mt-2">
                  {activeReviews.length} verified {activeReviews.length === 1 ? 'review' : 'reviews'}
                </p>
              </div>
              <div className="pb-4">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#333] leading-relaxed">
                  Pakistan's<br />Premium<br />Choice
                </p>
              </div>
            </div>
          </div>

          {/* Featured Pull Quote */}
          {featuredReview && (
            <div className="mt-16 border-t border-gray-100 pt-14">
              <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
                {/* Big quotation mark */}
                <div className="flex-shrink-0 hidden lg:block">
                  <span
                    className="text-[10rem] font-black text-gray-100 leading-none select-none"
                    aria-hidden="true"
                    style={{ lineHeight: '0.7' }}
                  >
                    &ldquo;
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-black italic text-black leading-[1.15] tracking-tight mb-8">
                    &ldquo;{featuredReview.body}&rdquo;
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cardinal flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-black">
                        {featuredReview.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-black">{featuredReview.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Stars rating={featuredReview.rating} size={10} />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-[#a4a4a2]">Verified Purchase</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Reviews Grid ──────────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-20">

          {/* Sub-header + CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 mb-2">
                Best Sellers · Fan Favourites
              </p>
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-black leading-none">
                What Our Customers Say.
              </h3>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="group inline-flex items-center justify-center space-x-2 border border-[var(--border-mid)] rounded-[4px] px-7 py-3.5 text-[9px] font-black uppercase tracking-[0.35em] text-gray-755 hover:border-black hover:bg-gray-50 transition-all duration-300 self-start sm:self-auto flex-shrink-0 active:scale-[0.98]"
            >
              <MessageCircle size={12} className="group-hover:text-cardinal transition-colors duration-300" />
              <span>Write a Review</span>
            </button>
          </div>

          {/* States */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-50 border border-gray-250 p-7 animate-pulse rounded-[4px]">
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="w-3 h-3 bg-gray-200 rounded-sm" />
                    ))}
                  </div>
                  <div className="h-3 bg-gray-200 rounded mb-3 w-3/4" />
                  <div className="space-y-2 mb-6">
                    <div className="h-2.5 bg-gray-200 rounded w-full" />
                    <div className="h-2.5 bg-gray-200 rounded w-4/5" />
                    <div className="h-2.5 bg-gray-200 rounded w-2/3" />
                  </div>
                  <div className="h-px bg-gray-100 mb-5" />
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded-none" />
                    <div className="h-2.5 bg-gray-200 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeReviews.map((r, i) => (
                <ReviewCard key={r._id ?? i} review={r} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Review Form Modal */}
      {showForm && (
        <ReviewForm
          onClose={() => setShowForm(false)}
          onSuccess={fetchReviews}
        />
      )}
    </>
  );
};

export default ReviewsSection;