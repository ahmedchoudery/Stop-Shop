/**
 * @fileoverview ReviewsSection.jsx — Live reviews from MongoDB
 * Replaced hardcoded REVIEWS array with real data from /api/public/reviews.
 * Added review submission form — posts to /api/public/reviews.
 * Falls back to placeholder UI while loading or if no reviews exist yet.
 *
 * Applies: animejs-animation, design-spells, react-ui-patterns
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import anime from 'animejs';
import { Star, Quote, ChevronLeft, ChevronRight, Send, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useIntersectionObserver } from '../hooks/useUtils.js';
import { EASING } from '../hooks/useAnime.js';
import { apiUrl } from '../config/api.js';

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────
// REVIEW SUBMIT FORM
// ─────────────────────────────────────────────────────────────────

const ReviewForm = ({ onSubmitted }) => {
  const [form, setForm]       = useState({ name: '', email: '', title: '', body: '', rating: 5 });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.title.trim()) e.title = 'Review title is required';
    if (!form.body.trim())  e.body  = 'Review text is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setApiError('');
    try {
      const res  = await fetch(apiUrl('/api/public/reviews'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit review');
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field) =>
    `w-full border-b-2 py-3 text-sm font-bold bg-transparent outline-none transition-all placeholder:text-gray-300 placeholder:font-normal ${
      errors[field] ? 'border-[#ba1f3d]' : 'border-gray-200 focus:border-[#ba1f3d]'
    }`;

  if (done) {
    return (
      <div className="text-center py-10 animate-fade-up">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-green-500" />
        </div>
        <p className="font-black uppercase tracking-tight text-gray-900 mb-1">
          Thank You!
        </p>
        <p className="text-sm text-gray-400 font-bold">
          Your review has been submitted and is pending approval.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Rating */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2">
          Your Rating *
        </p>
        <StarPicker value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
      </div>

      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 block mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
            placeholder="Ahmed Khan"
            className={inputCls('name')}
          />
          {errors.name && <p className="text-[9px] text-[#ba1f3d] mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 block mb-1">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: '' })); }}
            placeholder="ahmed@email.com"
            className={inputCls('email')}
          />
          {errors.email && <p className="text-[9px] text-[#ba1f3d] mt-1">{errors.email}</p>}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 block mb-1">Review Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: '' })); }}
          placeholder="Amazing quality!"
          className={inputCls('title')}
        />
        {errors.title && <p className="text-[9px] text-[#ba1f3d] mt-1">{errors.title}</p>}
      </div>

      {/* Body */}
      <div>
        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 block mb-1">Your Review *</label>
        <textarea
          value={form.body}
          onChange={e => { setForm(f => ({ ...f, body: e.target.value })); setErrors(er => ({ ...er, body: '' })); }}
          placeholder="Tell others what you think about Stop & Shop..."
          rows={4}
          className={`w-full border-b-2 py-3 text-sm font-bold bg-transparent outline-none transition-all resize-none placeholder:text-gray-300 placeholder:font-normal ${
            errors.body ? 'border-[#ba1f3d]' : 'border-gray-200 focus:border-[#ba1f3d]'
          }`}
        />
        {errors.body && <p className="text-[9px] text-[#ba1f3d] mt-1">{errors.body}</p>}
      </div>

      {apiError && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-100 rounded-sm">
          <AlertCircle size={13} className="text-[#ba1f3d] flex-shrink-0" />
          <p className="text-xs font-bold text-[#ba1f3d]">{apiError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center space-x-2 px-8 py-4 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-gray-900 transition-all disabled:opacity-50"
      >
        {loading
          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><Send size={13} /><span>Submit Review</span></>
        }
      </button>
      <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">
        Reviews are moderated and published within 24 hours.
      </p>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

const ReviewsSection = () => {
  const [reviews,      setReviews]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeIdx,    setActiveIdx]    = useState(0);
  const [isTransitioning, setTransition] = useState(false);
  const [isPaused,     setIsPaused]     = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [showForm,     setShowForm]     = useState(false);

  const cardRef       = useRef(null);
  const progressAnim  = useRef(null);
  const intervalRef   = useRef(null);

  const { ref: sectionRef, isIntersecting } = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });
  const hasAnimated = useRef(false);

  // ── Fetch approved reviews ─────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    try {
      const res  = await fetch(apiUrl('/api/public/reviews'));
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setReviews(data);
      }
    } catch {
      // Silently fall through to placeholder
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // ── Entrance animation ─────────────────────────────────────────
  useEffect(() => {
    if (!isIntersecting || hasAnimated.current || !sectionRef.current) return;
    hasAnimated.current = true;

    const heading = sectionRef.current.querySelector('[data-heading]');
    const rating  = sectionRef.current.querySelector('[data-rating]');
    const avatars = sectionRef.current.querySelectorAll('[data-avatar]');

    if (heading) { anime.set(heading, { opacity: 0, translateY: 40 }); anime({ targets: heading, opacity: [0, 1], translateY: [40, 0], duration: 800, easing: EASING.FABRIC }); }
    if (rating)  { anime.set(rating,  { opacity: 0, scale: 0.8 });     anime({ targets: rating,  opacity: [0, 1], scale: [0.8, 1], duration: 600, delay: 200, easing: EASING.SPRING }); }
    if (avatars?.length) { anime.set(avatars, { opacity: 0, scale: 0.8 }); anime({ targets: avatars, opacity: [0, 1], scale: [0.8, 1], duration: 400, delay: anime.stagger(60, { start: 400 }), easing: EASING.SPRING }); }
  }, [isIntersecting]);

  // ── Progress bar ───────────────────────────────────────────────
  const startProgress = useCallback(() => {
    setProgress(0);
    progressAnim.current?.pause();
    const obj = { value: 0 };
    progressAnim.current = anime({ targets: obj, value: [0, 100], duration: 7000, easing: 'linear', update: () => setProgress(obj.value) });
  }, []);

  const goTo = useCallback((idx) => {
    if (isTransitioning || !reviews.length) return;
    setTransition(true);
    if (cardRef.current) {
      anime({ targets: cardRef.current, opacity: [1, 0], translateX: [0, -30], duration: 280, easing: EASING.SILK,
        complete: () => {
          setActiveIdx(idx % reviews.length);
          setTransition(false);
          anime({ targets: cardRef.current, opacity: [0, 1], translateX: [30, 0], duration: 400, easing: EASING.FABRIC });
        }
      });
    } else {
      setActiveIdx(idx % reviews.length);
      setTransition(false);
    }
    startProgress();
  }, [isTransitioning, reviews.length, startProgress]);

  const next = useCallback(() => goTo((activeIdx + 1) % Math.max(reviews.length, 1)), [activeIdx, goTo, reviews.length]);
  const prev = useCallback(() => goTo((activeIdx - 1 + Math.max(reviews.length, 1)) % Math.max(reviews.length, 1)), [activeIdx, goTo, reviews.length]);

  useEffect(() => {
    if (isPaused || reviews.length === 0) return;
    startProgress();
    intervalRef.current = setInterval(next, 7000);
    return () => { clearInterval(intervalRef.current); progressAnim.current?.pause(); };
  }, [activeIdx, isPaused, reviews.length]);

  // ── Average rating ─────────────────────────────────────────────
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating ?? 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  const review = reviews[activeIdx] ?? null;

  return (
    <section
      ref={sectionRef}
      className="bg-white py-28 overflow-hidden border-t border-gray-50"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20">
          <div data-heading style={{ opacity: 0 }}>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-4">
              The Cardinal Experience
            </p>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-gray-900 leading-[0.88]">
              Elite Quality.<br />
              <span className="text-gray-200">Local Legacy.</span>
            </h2>
          </div>

          <div data-rating className="mt-10 md:mt-0 text-right" style={{ opacity: 0 }}>
            <p className="text-6xl font-black text-gray-900 leading-none">{avgRating}</p>
            <Stars rating={5} />
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2">
              {reviews.length > 0 ? `${reviews.length} verified review${reviews.length !== 1 ? 's' : ''}` : "Pakistan's Premium Choice"}
            </p>
          </div>
        </div>

        {/* Review carousel or placeholder */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-100 border-t-[#ba1f3d] rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          /* No reviews yet — prompt to be first */
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-sm">
            <div className="flex justify-center mb-4">
              <Stars rating={5} size={20} />
            </div>
            <p className="font-black uppercase tracking-tight text-gray-900 mb-2">
              No reviews yet
            </p>
            <p className="text-sm text-gray-400 font-bold mb-6">
              Be the first to share your experience with Stop & Shop.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-3 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
            >
              Write the First Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-start">

            {/* Featured review card */}
            <div
              ref={cardRef}
              className="lg:col-span-7 relative overflow-hidden"
              style={{ willChange: 'transform, opacity' }}
            >
              {/* Progress bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gray-100">
                <div className="h-full bg-[#ba1f3d] transition-none" style={{ width: `${progress}%`, willChange: 'width' }} />
              </div>

              <div className="bg-white border border-gray-100 p-10 md:p-16 shadow-sm relative overflow-hidden pt-8">
                <Quote size={100} className="text-gray-50 absolute -top-3 -right-3 rotate-12 pointer-events-none" />

                <div className="relative z-10">
                  <Stars rating={review?.rating ?? 5} />

                  <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 mt-7 mb-5 leading-tight">
                    "{review?.title ?? ''}"
                  </h3>

                  <p className="text-gray-500 text-lg font-medium leading-relaxed mb-10 italic">
                    {review?.body ?? review?.review ?? ''}
                  </p>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-8">
                    <div className="flex items-center space-x-5">
                      <div
                        data-avatar
                        className="w-14 h-14 rounded-full flex items-center justify-center text-base font-black text-white flex-shrink-0"
                        style={{ backgroundColor: '#ba1f3d', opacity: 0 }}
                      >
                        {(review?.customerName ?? review?.name ?? 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black uppercase tracking-tight text-gray-900">
                          {review?.customerName ?? review?.name ?? 'Customer'}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-0.5">
                          {review?.createdAt
                            ? new Date(review.createdAt).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
                            : 'Verified Customer'}
                        </p>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center space-x-2">
                      <button onClick={prev} className="w-10 h-10 border border-gray-200 flex items-center justify-center hover:border-[#ba1f3d] hover:text-[#ba1f3d] transition-all">
                        <ChevronLeft size={16} />
                      </button>
                      <button onClick={next} className="w-10 h-10 border border-gray-200 flex items-center justify-center hover:border-[#ba1f3d] hover:text-[#ba1f3d] transition-all">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Review list sidebar */}
            <div className="lg:col-span-5 space-y-3">
              {reviews.slice(0, 5).map((r, idx) => (
                <button
                  key={r._id ?? r.id ?? idx}
                  onClick={() => goTo(idx)}
                  className={`group w-full flex items-center space-x-4 p-4 transition-all duration-200 text-left ${
                    idx === activeIdx
                      ? 'bg-[#ba1f3d]/5 border-l-4 border-[#ba1f3d]'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  <div
                    data-avatar
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ backgroundColor: idx === activeIdx ? '#ba1f3d' : '#374151', opacity: 0 }}
                  >
                    {(r.customerName ?? r.name ?? 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className={`font-black uppercase tracking-tight text-sm transition-colors duration-200 ${
                      idx === activeIdx ? 'text-[#ba1f3d]' : 'text-gray-700 group-hover:text-gray-900'
                    }`}>
                      {r.customerName ?? r.name ?? 'Customer'}
                    </p>
                    <p className="text-[9px] uppercase tracking-[0.25em] font-black text-gray-400 mt-0.5 truncate">
                      {r.title ?? 'Review'}
                    </p>
                  </div>
                  <div className={`flex-shrink-0 transition-opacity duration-300 ${idx === activeIdx ? 'opacity-100' : 'opacity-30'}`}>
                    <Stars rating={r.rating ?? 5} />
                  </div>
                </button>
              ))}

              {/* Write a review button */}
              <button
                onClick={() => setShowForm(s => !s)}
                className="w-full mt-6 px-6 py-4 border-2 border-gray-200 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 hover:border-[#ba1f3d] hover:text-[#ba1f3d] transition-all flex items-center justify-center space-x-2"
              >
                <Star size={13} />
                <span>{showForm ? 'Cancel' : 'Write a Review'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Review submission form */}
        {showForm && (
          <div className="mt-16 border-t border-gray-100 pt-16 max-w-2xl animate-fade-up">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-3">
              Share Your Experience
            </p>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-10">
              Write a Review
            </h3>
            <ReviewForm onSubmitted={() => { setShowForm(false); fetchReviews(); }} />
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;