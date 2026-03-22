import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { Star } from 'lucide-react';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const RecentlyViewedSection = () => {
    const { recentlyViewed, clearViewed } = useRecentlyViewed();
    const { openDrawer, addToCart } = useCart();
    const { toggleWishlist, isWishlisted } = useWishlist();
    const scrollRef = useRef(null);

    if (recentlyViewed.length === 0) return null;

    const scroll = (dir) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * 280, behavior: 'smooth' });
    };

    return (
        <section className="bg-white py-16 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Clock size={18} className="text-gray-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">
                                Recently Viewed
                            </h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                {recentlyViewed.length} item{recentlyViewed.length !== 1 ? 's' : ''} browsed
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Scroll arrows — hidden on mobile since touch scroll works */}
                        <button
                            onClick={() => scroll(-1)}
                            className="hidden sm:flex p-2 border border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => scroll(1)}
                            className="hidden sm:flex p-2 border border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            onClick={clearViewed}
                            className="flex items-center space-x-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-600 border border-transparent hover:border-red-100 hover:bg-red-50 rounded-xl transition-all"
                        >
                            <X size={13} />
                            <span>Clear</span>
                        </button>
                    </div>
                </div>

                {/* Horizontal Scroll Container */}
                <div
                    ref={scrollRef}
                    className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {recentlyViewed.map((product, idx) => (
                        <RecentCard
                            key={`${product.id}-${idx}`}
                            product={product}
                            onOpen={() => openDrawer('product', product)}
                            onAddToCart={() => addToCart(product)}
                            isWishlisted={isWishlisted(product.id)}
                            onWishlist={() => toggleWishlist(product)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

const RecentCard = ({ product, onOpen, onAddToCart, isWishlisted, onWishlist }) => {
    const outOfStock = product.stock === 0;

    return (
        <div className="flex-shrink-0 w-52 group">
            {/* Image */}
            <div
                onClick={onOpen}
                className="relative w-full aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden cursor-pointer mb-3"
            >
                <img
                    src={product.image}
                    alt={product.name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${outOfStock ? 'grayscale opacity-60' : ''}`}
                />

                {/* Out of stock overlay */}
                {outOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg shadow-lg">
                            Sold Out
                        </span>
                    </div>
                )}

                {/* Quick add hover overlay */}
                {!outOfStock && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
                            className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
                        >
                            + Add to Cart
                        </button>
                    </div>
                )}

                {/* Wishlist heart */}
                <button
                    onClick={(e) => { e.stopPropagation(); onWishlist(); }}
                    className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-all ${isWishlisted
                            ? 'bg-red-500 text-white'
                            : 'bg-white/90 text-gray-400 opacity-0 group-hover:opacity-100'
                        }`}
                >
                    <svg
                        width="14" height="14"
                        viewBox="0 0 24 24"
                        fill={isWishlisted ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                </button>
            </div>

            {/* Info */}
            <div className="px-1">
                <h3
                    onClick={onOpen}
                    className="text-sm font-black uppercase tracking-tight text-gray-900 leading-tight cursor-pointer hover:text-red-600 transition-colors line-clamp-1"
                >
                    {product.name}
                </h3>

                <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-black text-red-600">${product.price.toFixed(2)}</p>
                    <div className="flex items-center space-x-0.5 opacity-50">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} className={i < (product.rating || 4) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                        ))}
                    </div>
                </div>

                {/* Color dots */}
                {product.colors && product.colors.length > 0 && (
                    <div className="flex items-center space-x-1.5 mt-2">
                        {product.colors.slice(0, 4).map(color => (
                            <div
                                key={color}
                                className="w-3 h-3 rounded-full border border-gray-200"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        {product.colors.length > 4 && (
                            <span className="text-[9px] text-gray-400 font-bold">+{product.colors.length - 4}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentlyViewedSection;