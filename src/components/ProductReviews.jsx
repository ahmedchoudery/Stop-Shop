/**
 * @fileoverview ProductReviews.jsx — Per-product review section
 * Fetches reviews filtered by productId.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Star, MessageCircle, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { apiUrl } from '../config/api.js';

const Stars = ({ rating, size = 13 }) => (
  <div className="flex space-x-0.5">
    {[...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        size={size} 
        className={i < rating ? 'fill-cardinal text-cardinal' : 'text-gray-200'} 
      />
    ))}
  </div>
);

const StarPicker = ({ value, onChange }) => (
  <div className="flex space-x-1">
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className="transition-transform hover:scale-110"
      >
        <Star 
          size={24} 
          className={n <= value ? 'fill-cardinal text-cardinal' : 'text-gray-300 hover:text-gray-400'} 
        />
      </button>
    ))}
  </div>
);

const ProductReviews = ({ productId, productName }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', title: '', body: '', rating: 5 });
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
        setForm({ name: '', email: '', title: '', body: '', rating: 5 });
        fetchReviews();
      }, 3000);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-gray-400">Loading reviews...</div>;
  }

  return (
    <section className="bg-[var(--bg-surface)] py-20 border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#a4a4a2] mb-4">Product Feedback</p>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Customer Reviews</h2>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="mt-6 md:mt-0 btn-primary rounded-[4px] !py-3 flex items-center space-x-2"
          >
            <MessageCircle size={14} />
            <span>{showForm ? 'Cancel' : 'Write a Review'}</span>
          </button>
        </div>

        {showForm && (
          <div className="mb-16 p-8 border border-[var(--border)] bg-[var(--bg-base)] rounded-[4px] animate-fade-up max-w-2xl">
            {done ? (
              <div className="text-center py-6">
                <CheckCircle size={32} className="text-[#346538] mx-auto mb-4" />
                <p className="font-black uppercase tracking-tight text-gray-900">Thank You!</p>
                <p className="text-xs text-gray-400 font-bold mt-1">Your review is pending moderation.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="mb-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2">Rating</p>
                  <StarPicker value={form.rating} onChange={r => setForm({...form, rating: r})} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input 
                    type="text" 
                    placeholder="Name *" 
                    required
                    className="input-premium"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                  <input 
                    type="email" 
                    placeholder="Email *" 
                    required
                    className="input-premium"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Review Title"
                  className="input-premium"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                />
                <textarea 
                  placeholder="Your review... *" 
                  required
                  rows={4}
                  className="input-premium resize-none"
                  value={form.body}
                  onChange={e => setForm({...form, body: e.target.value})}
                />
                {apiError && <p className="text-[10px] text-red-500 font-bold">{apiError}</p>}
                <button 
                  disabled={submitting}
                  className="w-full btn-primary rounded-[4px]"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.length === 0 ? (
            <div className="col-span-full py-10 border border-dashed border-[var(--border-mid)] text-center rounded-[4px]">
              <p className="text-xs font-bold text-gray-450">No reviews yet for this product. Be the first!</p>
            </div>
          ) : (
            reviews.map((r, i) => (
              <div key={r._id || i} className="p-8 border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-mid)] transition-all duration-300 rounded-[4px] group">
                <div className="flex justify-between items-start mb-4">
                  <Stars rating={r.rating} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#a4a4a2]">Verified</span>
                </div>
                <h4 className="font-black uppercase tracking-tight text-gray-900 mb-2">{r.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium mb-6 italic">"{r.body}"</p>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-[4px] bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-450">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-700">{r.name}</p>
                    <p className="text-[8px] font-bold text-gray-400">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;
