import React, { useState, useEffect, useRef } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const REVIEWS = [
    {
        id: 1,
        name: "Ahmed Raza",
        location: "DHA Karachi",
        rating: 5,
        title: "Absolutely premium quality",
        review: "The Cardinal collection is a masterpiece. The fabric quality and the fit are unlike anything I've found in Pakistan before. Absolute elite service.",
        product: "Signature Cardinal Suit",
        avatar: "AR",
        color: "#ba1f3d",
        date: "2 weeks ago"
    },
    {
        id: 2,
        name: "Fatima Khan",
        location: "Gulberg Lahore",
        rating: 5,
        title: "Fast delivery, great packaging",
        review: "The packaging alone felt like a luxury experience. The attention to detail in the Accessories line is stunning. Will definitely be ordering more.",
        product: "Silk Blend Pocket Square",
        avatar: "FK",
        color: "#111827",
        date: "1 month ago"
    },
    {
        id: 3,
        name: "Zidan Sheikh",
        location: "F-7 Islamabad",
        rating: 5,
        title: "True luxury experience",
        review: "True luxury experience. From the packaging to the swift delivery in Islamabad, everything speaks Cardinal quality. Highly recommended for trendsetters.",
        product: "Elite Leather Chelsea",
        avatar: "ZS",
        color: "#ba1f3d",
        date: "3 weeks ago"
    },
    {
        id: 4,
        name: "Hamza Malik",
        location: "Peshawar",
        rating: 5,
        title: "Masterclass in Fit",
        review: "The custom fit measurements for the trousers were spot on. It's rare to find such precision in ready-to-wear collections locally.",
        product: "Slim-Fit Chinos",
        avatar: "HM",
        color: "#111827",
        date: "1 week ago"
    },
    {
        id: 5,
        name: "Ayesha Omer",
        location: "Multan",
        rating: 5,
        title: "Exceeded expectations",
        review: "The Summer Linen collection is perfect for Pakistan's heat. Breathable, stylish, and the Cardinal accents make it stand out.",
        product: "Bespoke Linen Shirt",
        avatar: "AO",
        color: "#ba1f3d",
        date: "5 days ago"
    },
];

const StarDisplay = ({ rating }) => (
    <div className="flex space-x-0.5">
        {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} className={i < rating ? "fill-[#ba1f3d] text-[#ba1f3d]" : "text-gray-200"} />
        ))}
    </div>
);

const ReviewsSection = () => {
    const [activeIdx, setActiveIdx] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const intervalRef = useRef(null);

    const goTo = (idx) => {
        if (isAnimating) return;
        setIsAnimating(true);
        setActiveIdx(idx);
        setTimeout(() => setIsAnimating(false), 400);
    };

    const next = () => goTo((activeIdx + 1) % REVIEWS.length);
    const prev = () => goTo((activeIdx - 1 + REVIEWS.length) % REVIEWS.length);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setActiveIdx(idx => (idx + 1) % REVIEWS.length);
        }, 8000);
        return () => clearInterval(intervalRef.current);
    }, []);

    const review = REVIEWS[activeIdx];

    return (
        <section className="bg-white py-32 overflow-hidden border-t border-gray-50">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-24">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-4">The Cardinal Experience</p>
                        <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-gray-900 leading-[0.85]">
                            Elite Quality.<br />
                            <span className="text-gray-200">Local Legacy.</span>
                        </h2>
                    </div>
                    <div className="mt-12 md:mt-0 flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-6xl font-black text-gray-900 leading-none">4.9</p>
                            <div className="mt-2"><StarDisplay rating={5} /></div>
                            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-400 mt-3 whitespace-nowrap">Pakistan's Premium Choice</p>
                        </div>
                    </div>
                </div>

                {/* Main Review Card */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                    {/* Featured Review */}
                    <div
                        key={activeIdx}
                        className="lg:col-span-7 bg-white border border-gray-100 p-12 md:p-20 relative overflow-hidden group transition-all duration-500 shadow-sm"
                    >
                        <Quote size={80} className="text-gray-50 absolute -top-4 -right-4 rotate-12" />

                        <div className="relative z-10">
                            <StarDisplay rating={review.rating} />

                            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 mt-8 mb-6 leading-tight">
                                "{review.title}"
                            </h3>
                            <p className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed mb-12 italic">
                                {review.review}
                            </p>

                            <div className="flex items-center justify-between border-t border-gray-100 pt-10">
                                <div className="flex items-center space-x-6">
                                    <div
                                        className="w-16 h-16 flex items-center justify-center font-black text-white text-lg tracking-tighter"
                                        style={{ backgroundColor: review.color }}
                                    >
                                        {review.avatar}
                                    </div>
                                    <div>
                                        <p className="font-black uppercase tracking-tighter text-xl text-gray-900">{review.name}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">{review.location} · {review.date}</p>
                                    </div>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-300 mb-1">Authentic Gear</p>
                                    <p className="text-xs font-black text-[#ba1f3d] uppercase tracking-tighter">{review.product}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mini Reviews Stack */}
                    <div className="lg:col-span-5 space-y-4">
                        {REVIEWS.map((r, idx) => (
                            <button
                                key={r.id}
                                onClick={() => goTo(idx)}
                                className={`w-full text-left p-6 transition-all duration-500 border ${idx === activeIdx
                                        ? 'border-[#ba1f3d] bg-white shadow-xl translate-x-4'
                                        : 'border-transparent bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-6">
                                        <div
                                            className="w-10 h-10 flex items-center justify-center font-black text-white text-xs"
                                            style={{ backgroundColor: r.color }}
                                        >
                                            {r.avatar}
                                        </div>
                                        <div>
                                            <p className={`font-black uppercase tracking-tight text-sm ${idx === activeIdx ? 'text-[#ba1f3d]' : 'text-gray-900'}`}>
                                                {r.name}
                                            </p>
                                            <p className="text-[9px] uppercase tracking-[0.3em] font-black text-gray-400 mt-0.5">
                                                {r.product}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={idx === activeIdx ? 'opacity-100' : 'opacity-30'}>
                                        <StarDisplay rating={r.rating} />
                                    </div>
                                </div>
                            </button>
                        ))}

                        {/* Nav */}
                        <div className="flex items-center space-x-4 pt-10">
                            <button
                                onClick={prev}
                                className="w-14 h-14 border border-gray-100 flex items-center justify-center hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={next}
                                className="w-14 h-14 border border-gray-100 flex items-center justify-center hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
                            >
                                <ChevronRight size={20} />
                            </button>
                            <div className="flex-grow text-right">
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300">
                                    0{activeIdx + 1} / 0{REVIEWS.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ReviewsSection;