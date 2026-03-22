import React, { useState, useEffect, useRef } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const REVIEWS = [
    {
        id: 1,
        name: "Arjun Mehta",
        location: "Mumbai",
        rating: 5,
        title: "Absolutely premium quality",
        review: "I've been shopping at Stop & Shop for 6 months now. The fabric quality is unmatched at this price point. The Classic Red Polo has become my go-to for every occasion.",
        product: "Classic Red Polo",
        avatar: "AM",
        color: "#F63049",
        date: "2 weeks ago"
    },
    {
        id: 2,
        name: "Priya Sharma",
        location: "Ahmedabad",
        rating: 5,
        title: "Fast delivery, great packaging",
        review: "The packaging alone felt like a luxury experience. Cotton Chinos fit perfectly straight off the rack — no tailoring needed. Will definitely be ordering more.",
        product: "Cotton Chinos",
        avatar: "PS",
        color: "#FBBF24",
        date: "1 month ago"
    },
    {
        id: 3,
        name: "Rahul Patel",
        location: "Surat",
        rating: 5,
        title: "Worth every rupee",
        review: "The Oversized Arctic Hoodie is everything. 400GSM weight, incredible softness, and it actually looks like the product photos. Rare for online shopping.",
        product: "Oversized Arctic Hoodie",
        avatar: "RP",
        color: "#22C55E",
        date: "3 weeks ago"
    },
    {
        id: 4,
        name: "Kavya Nair",
        location: "Bangalore",
        rating: 5,
        title: "My new favorite store",
        review: "Ordered the Slim Fit Denim and it arrived in 2 days. The Japanese denim fabric is so premium — you can feel the quality. Already ordered 2 more pairs.",
        product: "Slim Fit Denim",
        avatar: "KN",
        color: "#1D4ED8",
        date: "1 week ago"
    },
    {
        id: 5,
        name: "Aditya Shah",
        location: "Vadodara",
        rating: 5,
        title: "Exceeded expectations",
        review: "The Summer Linen Shirt is perfect for Gujarat's heat. Breathable, stylish, and the Cuban collar is a unique touch. Customer service was also very responsive.",
        product: "Summer Linen Shirt",
        avatar: "AS",
        color: "#8B5CF6",
        date: "5 days ago"
    },
];

const StarDisplay = ({ rating }) => (
    <div className="flex space-x-0.5">
        {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
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
        intervalRef.current = setInterval(next, 5000);
        return () => clearInterval(intervalRef.current);
    }, [activeIdx]);

    const review = REVIEWS[activeIdx];

    return (
        <section className="bg-white py-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-3">Social Proof</p>
                        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-gray-900">
                            Real People.<br />
                            <span className="text-gray-300">Real Reviews.</span>
                        </h2>
                    </div>
                    <div className="mt-8 md:mt-0 flex items-center space-x-3">
                        <div className="text-right">
                            <p className="text-5xl font-black text-gray-900">4.9</p>
                            <StarDisplay rating={5} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Based on 400+ reviews</p>
                        </div>
                    </div>
                </div>

                {/* Main Review Card */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Featured Review */}
                    <div
                        key={activeIdx}
                        className="bg-gray-50 p-10 md:p-14 rounded-2xl relative overflow-hidden group transition-all duration-500"
                        style={{ borderLeft: `4px solid ${review.color}` }}
                    >
                        <Quote size={48} className="text-gray-100 absolute top-6 right-6" />

                        <StarDisplay rating={review.rating} />

                        <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 mt-6 mb-4">
                            "{review.title}"
                        </h3>
                        <p className="text-gray-600 text-base font-medium leading-relaxed mb-8">
                            {review.review}
                        </p>

                        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                            <div className="flex items-center space-x-4">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-sm shadow-lg"
                                    style={{ backgroundColor: review.color }}
                                >
                                    {review.avatar}
                                </div>
                                <div>
                                    <p className="font-black uppercase tracking-tight text-gray-900">{review.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{review.location} · {review.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Purchased</p>
                                <p className="text-xs font-black text-gray-700 uppercase tracking-tight">{review.product}</p>
                            </div>
                        </div>
                    </div>

                    {/* Mini Reviews Stack */}
                    <div className="space-y-3">
                        {REVIEWS.map((r, idx) => (
                            <button
                                key={r.id}
                                onClick={() => goTo(idx)}
                                className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-300 ${idx === activeIdx
                                        ? 'border-gray-900 bg-gray-900 text-white shadow-2xl scale-[1.02]'
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-[10px] flex-shrink-0"
                                            style={{ backgroundColor: r.color }}
                                        >
                                            {r.avatar}
                                        </div>
                                        <div>
                                            <p className={`font-black uppercase tracking-tight text-xs ${idx === activeIdx ? 'text-white' : 'text-gray-900'}`}>
                                                {r.name}
                                            </p>
                                            <p className={`text-[9px] uppercase tracking-widest font-bold ${idx === activeIdx ? 'text-gray-400' : 'text-gray-400'}`}>
                                                {r.product}
                                            </p>
                                        </div>
                                    </div>
                                    <StarDisplay rating={r.rating} />
                                </div>
                            </button>
                        ))}

                        {/* Nav */}
                        <div className="flex items-center space-x-3 pt-4">
                            <button
                                onClick={prev}
                                className="p-3 border-2 border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={next}
                                className="p-3 border-2 border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                                {activeIdx + 1} / {REVIEWS.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ReviewsSection;