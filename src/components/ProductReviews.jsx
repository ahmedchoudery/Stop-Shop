/**
 * @fileoverview ProductReviews.jsx — Per-product review section
 * Fetches reviews filtered by productId.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, CheckCircle, Star } from 'lucide-react';
import { apiUrl } from '../config/api.js';

const ProductReviews = ({ productId, productName }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', body: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/api/public/reviews?productId=${productId}`));
      const data = await res.json();
      if (Array.isArray(data)) setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) fetchReviews();

    const params = new URLSearchParams(window.location.search);
    if (params.get('write-review') === 'true') {
      setShowForm(true);
    }
  }, [productId, fetchReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.body) return alert('Please fill in all required fields.');

    setSubmitting(true);
    setApiError('');
    try {
      const res = await fetch(apiUrl('/api/public/reviews'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, productId, productName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setShowForm(false);
        setForm({ name: '', email: '', body: '', rating: 5 });
        fetchReviews();
      }, 3000);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-[var(--bg-surface)] py-20 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Left Col Skeleton */}
            <div className="md:col-span-4 space-y-6">
              <div className="h-3 w-24 bg-gray-250 animate-pulse rounded-none" />
              <div className="h-12 w-48 bg-gray-250 animate-pulse rounded-none" />
              <div className="h-10 w-full bg-gray-200 animate-pulse rounded-none" />
            </div>
            {/* Right Col Skeleton */}
            <div className="md:col-span-8 space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-b border-gray-150 pb-8 last:border-0 space-y-4">
                  <div className="h-4 w-5/6 bg-gray-250 animate-pulse rounded-none" />
                  <div className="h-4 w-4/6 bg-gray-250 animate-pulse rounded-none" />
                  <div className="h-3 w-32 bg-gray-200 animate-pulse rounded-none" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[var(--bg-surface)] py-20 border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Left Column: Sticky Summary & Action */}
          <div className="md:col-span-4">
            <div className="md:sticky md:top-24 space-y-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2">Feedback</p>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900">
                  {reviews.length.toString().padStart(2, '0')} {reviews.length === 1 ? 'Review' : 'Reviews'}
                </h2>
              </div>
              
              <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-sm">
                Honest feedback from verified buyers. Reviews are published after standard moderation.
              </p>

              <button 
                onClick={() => {
                  setShowForm(!showForm);
                  setApiError('');
                  setDone(false);
                }}
                className="btn-primary rounded-none shadow-none text-[9px] tracking-[0.25em] !py-3.5 !px-6 w-full md:w-auto uppercase flex items-center justify-center space-x-2 border border-black hover:bg-white hover:text-black transition-colors"
              >
                <MessageCircle size={12} />
                <span>{showForm ? 'Close Form' : 'Write a Review'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Reviews List & Write Review Form */}
          <div className="md:col-span-8 space-y-12">
            {/* Slide Down Form */}
            {showForm && (
              <div className="border-b border-gray-200 pb-12 animate-fade-up">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 mb-6">Write your review</p>
                {done ? (
                  <div className="border-l-2 border-black pl-6 py-4 bg-transparent">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center space-x-2">
                      <CheckCircle size={14} className="text-black" />
                      <span>Review Submitted</span>
                    </p>
                    <p className="text-[11px] text-gray-400 font-semibold mt-1">
                      Thank you. Your review has been sent for editorial moderation.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <input 
                        type="text" 
                        placeholder="NAME *" 
                        required
                        className="input-premium uppercase text-xs tracking-wider"
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                      />
                      <input 
                        type="email" 
                        placeholder="EMAIL *" 
                        required
                        className="input-premium uppercase text-xs tracking-wider"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 block mb-2">Rating *</span>
                      <div className="flex items-center space-x-1.5">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setForm({ ...form, rating: num })}
                            className="p-1 focus:outline-none transition-transform active:scale-95"
                          >
                            <Star
                              size={20}
                              className={num <= form.rating ? 'fill-amber-gold text-amber-gold' : 'text-gray-300'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea 
                      placeholder="YOUR REVIEW (MINIMUM 20 CHARACTERS) *" 
                      required
                      rows={4}
                      className="input-premium resize-none uppercase text-xs tracking-wider"
                      value={form.body}
                      onChange={e => setForm({...form, body: e.target.value})}
                    />
                    {apiError && (
                      <div className="border-l-2 border-cardinal pl-4 py-1.5">
                        <p className="text-[10px] text-cardinal font-bold uppercase tracking-wider">{apiError}</p>
                      </div>
                    )}
                    <button 
                      disabled={submitting}
                      className="btn-primary rounded-none shadow-none text-[9px] tracking-[0.25em] !py-4 !px-8 w-full md:w-auto uppercase"
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* List */}
            <div className="space-y-8 divide-y divide-gray-150">
              {reviews.length === 0 ? (
                <div className="py-12 text-left">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    No reviews yet for this product.
                  </p>
                </div>
              ) : (
                reviews.map((r, i) => (
                  <div key={r._id || i} className={`${i > 0 ? 'pt-8' : ''} space-y-4`}>
                    <div className="flex space-x-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={11} className={n <= (r.rating ?? 5) ? 'fill-amber-gold text-amber-gold' : 'text-gray-200'} />
                      ))}
                    </div>
                    <p className="text-sm font-normal text-gray-700 leading-relaxed max-w-2xl">
                      {r.body}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] tracking-[0.25em] font-semibold text-gray-450 uppercase">
                      <span>BY {r.name}</span>
                      <span className="text-gray-250">•</span>
                      <span>{new Date(r.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span className="text-gray-250">•</span>
                      <span className="text-black font-black tracking-widest">[ VERIFIED PURCHASE ]</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;

