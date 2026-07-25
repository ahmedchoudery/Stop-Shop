/**
 * @fileoverview ProductReviews.jsx — Luxury Editorial Product Review Section
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Star, Edit3, ShieldCheck } from 'lucide-react';
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

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  if (loading) {
    return (
      <section className="py-16 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-32 bg-gray-200 animate-pulse mb-4" />
          <div className="h-8 w-64 bg-gray-200 animate-pulse mb-8" />
          <div className="h-32 w-full bg-gray-100 animate-pulse rounded-sm" />
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-gray-200 py-16 mt-16">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 mb-8 border-b border-gray-200 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 block mb-1">
              Customer Feedback
            </span>
            <h2 className="text-2xl sm:text-3xl font-medium uppercase tracking-[0.1em] text-gray-900 font-serif">
              Reviews & Rating ({reviews.length})
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-sm">
              <div className="flex space-x-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={13} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-900 ml-1">{avgRating}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm(!showForm);
                setApiError('');
                setDone(false);
              }}
              className="px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] border border-black bg-white text-black hover:bg-black hover:text-white transition-all cursor-pointer inline-flex items-center space-x-2"
            >
              <Edit3 size={13} />
              <span>{showForm ? 'Cancel' : 'Write a Review'}</span>
            </button>
          </div>
        </div>

        {/* Slide Down Write Review Form */}
        {showForm && (
          <div className="bg-[#F8F7F5] border border-gray-200 p-6 sm:p-8 mb-12 rounded-sm animate-fade-in">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900 mb-6">
              Write Your Review
            </h3>

            {done ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm">
                <p className="text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
                  <CheckCircle size={15} className="text-emerald-600" />
                  <span>Review Submitted Successfully!</span>
                </p>
                <p className="text-xs mt-1 text-emerald-700">
                  Thank you for your feedback. Your review will appear shortly after moderation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ali Ahmed"
                      required
                      className="w-full bg-white border border-gray-300 px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-black outline-none transition-colors"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. ali@example.com"
                      required
                      className="w-full bg-white border border-gray-300 px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-black outline-none transition-colors"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    Rating *
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setForm({ ...form, rating: num })}
                        className="p-1 focus:outline-none cursor-pointer"
                      >
                        <Star
                          size={22}
                          className={num <= form.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    Review Details *
                  </label>
                  <textarea
                    placeholder="Share details about fit, quality, material, or overall impression..."
                    required
                    rows={4}
                    className="w-full bg-white border border-gray-300 px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-black outline-none transition-colors resize-none"
                    value={form.body}
                    onChange={e => setForm({ ...form, body: e.target.value })}
                  />
                </div>

                {apiError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {apiError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-black text-white hover:bg-gray-800 px-8 py-3.5 text-xs font-bold uppercase tracking-[0.25em] transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Reviews List / Empty Banner */}
        {reviews.length === 0 ? (
          <div className="bg-[#F8F7F5] border border-gray-200/80 rounded-sm p-10 text-center max-w-2xl mx-auto space-y-4 my-6">
            <div className="flex justify-center space-x-1 text-amber-400">
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={18} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900">
              Be the first to review this product
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Share your thoughts, fit rating, and experience with fellow shoppers.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-all cursor-pointer shadow-sm"
            >
              Write First Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((r, i) => (
              <div key={r._id || i} className="bg-white border border-gray-200 p-6 rounded-sm space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} size={12} className={n <= (r.rating ?? 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-gray-400">
                    {new Date(r.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed font-normal">
                  "{r.body}"
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px]">
                  <span className="font-bold text-gray-900 uppercase tracking-wider">{r.name}</span>
                  <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[2px] font-semibold">
                    <ShieldCheck size={11} />
                    <span>Verified Buyer</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductReviews;
