/**
 * @fileoverview ReviewsSection — Design Spells Edition
 * Applies: animejs-animation (slide transition, stagger avatars),
 *          design-spells (progress bar auto-play, hover pause, avatar pulse),
 *          design-md (editorial layout, Cardinal Red system)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';
import { useIntersectionObserver } from '../hooks/useUtils.js';

const REVIEWS = [
  {
    id: 1,
    name: 'Ahmed Raza',
    location: 'DHA Karachi',
    rating: 5,
    title: 'Absolutely premium quality',
    review: 'The Cardinal collection is a masterpiece. The fabric quality and the fit are unlike anything I\'ve found in Pakistan before. Absolute elite service.',
    product: 'Signature Cardinal Suit',
    avatar: 'AR',
    color: '#ba1f3d',
    date: '2 weeks ago',
  },
  {
    id: 2,
    name: 'Fatima Khan',
    location: 'Gulberg Lahore',
    rating: 5,
    title: 'Fast delivery, great packaging',
    review: 'The packaging alone felt like a luxury experience. The attention to detail in the Accessories line is stunning. Will definitely be ordering more.',
    product: 'Silk Blend Pocket Square',
    avatar: 'FK',
    color: '#111827',
    date: '1 month ago',
  },
  {
    id: 3,
    name: 'Zidan Sheikh',
    location: 'F-7 Islamabad',
    rating: 5,
    title: 'True luxury experience',
    review: 'True luxury experience. From the packaging to the swift delivery in Islamabad, everything speaks Cardinal quality. Highly recommended for trendsetters.',
    product: 'Elite Leather Chelsea',
    avatar: 'ZS',
    color: '#ba1f3d',
    date: '3 weeks ago',
  },
  {
    id: 4,
    name: 'Hamza Malik',
    location: 'Peshawar',
    rating: 5,
    title: 'Masterclass in Fit',
    review: 'The custom fit measurements for the trousers were spot on. It\'s rare to find such precision in ready-to-wear collections locally.',
    product: 'Slim-Fit Chinos',
    avatar: 'HM',
    color: '#111827',
    date: '1 week ago',
  },
  {
    id: 5,
    name: 'Ayesha Omer',
    location: 'Multan',
    rating: 5,
    title: 'Exceeded expectations',
    review: 'The Summer Linen collection is perfect for Pakistan\'s heat. Breathable, stylish, and the Cardinal accents make it stand out from everything else.',
    product: 'Bespoke Linen Shirt',
    avatar: 'AO',
    color: '#ba1f3d',
    date: '5 days ago',
  },
];

const Stars = ({ rating }) => (
  <div className="flex space-x-0.5">
    {[...Array(5)].map((_, i) => (
      <Star key={i} size={13} className={i < rating ? 'fill-[#ba1f3d] text-[#ba1f3d]' : 'text-gray-200'} />
    ))}
  </div>
);

const ReviewsSection = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const cardRef = useRef(null);
  const progressRef = useRef(null);
  const progressAnim = useRef(null);
  const intervalRef = useRef(null);

  const { ref: sectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.2,
    triggerOnce: true,
  });
  const hasAnimated = useRef(false);

  // ── Entrance ────────────────────────────────────────────────
  useEffect(() => {
    if (!isIntersecting || hasAnimated.current) return;
    hasAnimated.current = true;
    let anime;
    try { anime = require('animejs').default ?? require('animejs'); } catch { return; }

    const heading = sectionRef.current?.querySelector('[data-heading]');
    const rating = sectionRef.current?.querySelector('[data-rating]');
    const avatars = sectionRef.current?.querySelectorAll('[data-avatar]');

    if (heading) {
      anime.set(heading, { opacity: 0, translateY: 40 });
      anime({ targets: heading, opacity: [0, 1], translateY: [40, 0], duration: 800, easing: EASING.FABRIC });
    }
    if (rating) {
      anime.set(rating, { opacity: 0, scale: 0.8 });
      anime({ targets: rating, opacity: [0, 1], scale: [0.8, 1], duration: 600, delay: 200, easing: EASING.SPRING });
    }
    if (avatars?.length) {
      anime.set(avatars, { opacity: 0, scale: 0.8 });
      anime({ targets: avatars, opacity: [0, 1], scale: [0.8, 1], duration: 400, delay: anime.stagger(60, { start: 400 }), easing: EASING.SPRING });
    }
  }, [isIntersecting]);

  // ── Auto-play progress bar ───────────────────────────────────
  const startProgress = useCallback(() => {
    setProgress(0);
    let anime;
    try { anime = require('animejs').default ?? require('animejs'); } catch { return; }

    progressAnim.current?.pause();
    const obj = { value: 0 };
    progressAnim.current = anime({
      targets: obj,
      value: [0, 100],
      duration: 7000,
      easing: 'linear',
      update: () => setProgress(obj.value),
    });
  }, []);

  const goTo = useCallback((idx) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    let anime;
    try { anime = require('animejs').default ?? require('animejs'); } catch {
      setActiveIdx(idx);
      setIsTransitioning(false);
      return;
    }

    // Slide out current
    if (cardRef.current) {
      anime({
        targets: cardRef.current,
        opacity: [1, 0],
        translateX: [0, -30],
        duration: 280,
        easing: EASING.SILK,
        complete: () => {
          setActiveIdx(idx);
          setIsTransitioning(false);

          // Slide in new
          anime({
            targets: cardRef.current,
            opacity: [0, 1],
            translateX: [30, 0],
            duration: 400,
            easing: EASING.FABRIC,
          });
        },
      });
    } else {
      setActiveIdx(idx);
      setIsTransitioning(false);
    }

    startProgress();
  }, [isTransitioning, startProgress]);

  const next = useCallback(() => goTo((activeIdx + 1) % REVIEWS.length), [activeIdx, goTo]);
  const prev = useCallback(() => goTo((activeIdx - 1 + REVIEWS.length) % REVIEWS.length), [activeIdx, goTo]);

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    startProgress();
    intervalRef.current = setInterval(next, 7000);
    return () => {
      clearInterval(intervalRef.current);
      progressAnim.current?.pause();
    };
  }, [activeIdx, isPaused]);

  const review = REVIEWS[activeIdx];

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
          <div data-heading>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-4">
              The Cardinal Experience
            </p>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-gray-900 leading-[0.88]">
              Elite Quality.<br />
              <span className="text-gray-200">Local Legacy.</span>
            </h2>
          </div>

          <div data-rating className="mt-10 md:mt-0 text-right">
            <p className="text-6xl font-black text-gray-900 leading-none">4.9</p>
            <Stars rating={5} />
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2">
              Pakistan's Premium Choice
            </p>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-start">

          {/* Featured review card */}
          <div
            ref={cardRef}
            className="lg:col-span-7 relative overflow-hidden"
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Progress bar — design spell */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gray-100">
              <div
                className="h-full bg-[#ba1f3d] transition-none"
                style={{ width: `${progress}%`, willChange: 'width' }}
              />
            </div>

            <div className="bg-white border border-gray-100 p-10 md:p-16 shadow-sm relative overflow-hidden pt-8">
              {/* Quote watermark */}
              <Quote
                size={100}
                className="text-gray-50 absolute -top-3 -right-3 rotate-12 pointer-events-none"
              />

              <div className="relative z-10">
                <Stars rating={review.rating} />

                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 mt-7 mb-5 leading-tight">
                  "{review.title}"
                </h3>

                <p className="text-gray-500 text-lg font-medium leading-relaxed mb-10 italic">
                  {review.review}
                </p>

                <div className="flex items-center justify-between border-t border-gray-100 pt-8">
                  <div className="flex items-center space-x-5">
                    <div
                      className="w-14 h-14 flex items-center justify-center font-black text-white text-sm tracking-tighter flex-shrink-0"
                      style={{ background: review.color }}
                    >
                      {review.avatar}
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-tighter text-lg text-gray-900">
                        {review.name}
                      </p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-0.5">
                        {review.location} · {review.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-300 mb-1">
                      Verified Purchase
                    </p>
                    <p className="text-xs font-black text-[#ba1f3d] uppercase tracking-tight">
                      {review.product}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nav arrows */}
            <div className="flex items-center space-x-3 mt-5">
              <button
                onClick={prev}
                className="w-12 h-12 border border-gray-200 flex items-center justify-center hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 group"
              >
                <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={next}
                className="w-12 h-12 border border-gray-200 flex items-center justify-center hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 group"
              >
                <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 ml-2">
                0{activeIdx + 1} / 0{REVIEWS.length}
              </span>
            </div>
          </div>

          {/* Review stack */}
          <div className="lg:col-span-5 space-y-2">
            {REVIEWS.map((r, idx) => (
              <button
                key={r.id}
                data-avatar
                onClick={() => goTo(idx)}
                className={`w-full text-left px-5 py-4 border-l-2 transition-all duration-400 group ${
                  idx === activeIdx
                    ? 'border-[#ba1f3d] bg-[#ba1f3d]/3'
                    : 'border-transparent hover:border-gray-200 hover:bg-gray-50/70'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-9 h-9 flex items-center justify-center font-black text-white text-[10px] flex-shrink-0 transition-all duration-300 ${
                      idx === activeIdx ? 'scale-110' : 'opacity-60 group-hover:opacity-100'
                    }`}
                    style={{ background: r.color }}
                  >
                    {r.avatar}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className={`font-black uppercase tracking-tight text-sm transition-colors duration-200 ${
                      idx === activeIdx ? 'text-[#ba1f3d]' : 'text-gray-700 group-hover:text-gray-900'
                    }`}>
                      {r.name}
                    </p>
                    <p className="text-[9px] uppercase tracking-[0.25em] font-black text-gray-400 mt-0.5 truncate">
                      {r.product}
                    </p>
                  </div>
                  <div className={`flex-shrink-0 transition-opacity duration-300 ${idx === activeIdx ? 'opacity-100' : 'opacity-30'}`}>
                    <Stars rating={r.rating} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;