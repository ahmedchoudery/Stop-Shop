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
        className={i < rating ? 'fill-[#ba1f3d] text-[#ba1f3d]' : 'text-gray-200'} 
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
          className={n <= value ? 'fill-[#ba1f3d] text-[#ba1f3d]' : 'text-gray-300 hover:text-gray-400'} 
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
    <section className="bg-white py-20 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-4">Product Feedback</p>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Customer Reviews</h2>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="mt-6 md:mt-0 px-8 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#ba1f3d] transition-all flex items-center space-x-2"
          >
            <MessageCircle size={14} />
            <span>{showForm ? 'Cancel' : 'Write a Review'}</span>
          </button>
        </div>

        {showForm && (
          <div className="mb-16 p-8 border border-gray-100 bg-gray-50/50 rounded-sm animate-fade-up max-w-2xl">
            {done ? (
              <div className="text-center py-6">
                <CheckCircle size={32} className="text-green-500 mx-auto mb-4" />
                <p className="font-black uppercase tracking-tight text-gray-900">Thank You!</p>
                <p className="text-xs text-gray-400 font-bold mt-1">Your review is pending moderation.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2">Rating</p>
                  <StarPicker value={form.rating} onChange={r => setForm({...form, rating: r})} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Name *" 
                    required
                    className="w-full p-4 text-xs font-bold bg-white border border-gray-100 outline-none focus:border-[#ba1f3d]"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                  <input 
                    type="email" 
                    placeholder="Email *" 
                    required
                    className="w-full p-4 text-xs font-bold bg-white border border-gray-100 outline-none focus:border-[#ba1f3d]"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Review Title"
                  className="w-full p-4 text-xs font-bold bg-white border border-gray-100 outline-none focus:border-[#ba1f3d]"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                />
                <textarea 
                  placeholder="Your review... *" 
                  required
                  rows={4}
                  className="w-full p-4 text-xs font-bold bg-white border border-gray-100 outline-none focus:border-[#ba1f3d] resize-none"
                  value={form.body}
                  onChange={e => setForm({...form, body: e.target.value})}
                />
                {apiError && <p className="text-[10px] text-red-500 font-bold">{apiError}</p>}
                <button 
                  disabled={submitting}
                  className="w-full py-4 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.length === 0 ? (
            <div className="col-span-full py-10 border border-dashed border-gray-200 text-center">
              <p className="text-xs font-bold text-gray-400">No reviews yet for this product. Be the first!</p>
            </div>
          ) : (
            reviews.map((r, i) => (
              <div key={r._id || i} className="p-8 border border-gray-50 bg-white hover:border-gray-100 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <Stars rating={r.rating} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">Verified</span>
                </div>
                <h4 className="font-black uppercase tracking-tight text-gray-900 mb-2">{r.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium mb-6 italic">"{r.body}"</p>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-700">{r.name}</p>
                    <p className="text-[8px] font-bold text-gray-300">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</p>
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
