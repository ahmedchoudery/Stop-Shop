import React, { useState, useEffect, useRef } from 'react';
import { X, Search, ArrowRight, TrendingUp } from 'lucide-react';
import { useCart } from '../context/CartContext';

const TRENDING_SEARCHES = ['Polo Shirts', 'Linen Shirts', 'Canvas Sneakers', 'Slim Denim', 'Hoodies'];

const SearchOverlay = ({ isOpen, onClose, products = [] }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const inputRef = useRef(null);
    const { openDrawer } = useCart();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            setQuery('');
            setResults([]);
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }
        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.bucket?.toLowerCase().includes(query.toLowerCase()) ||
            p.subCategory?.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered.slice(0, 6));
    }, [query, products]);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex flex-col" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            {/* Search Container */}
            <div
                className="relative z-10 max-w-3xl w-full mx-auto mt-24 px-4"
                onClick={e => e.stopPropagation()}
            >
                {/* Input */}
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search for products, styles..."
                        className="w-full bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder:text-white/40 text-xl font-medium py-6 pl-16 pr-16 rounded-2xl outline-none focus:border-white/50 focus:bg-white/15 transition-all"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Results or Trending */}
                <div className="mt-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
                    {query && results.length === 0 && (
                        <div className="p-8 text-center">
                            <p className="text-white/60 font-medium uppercase tracking-widest text-sm">No results for "{query}"</p>
                        </div>
                    )}

                    {query && results.length > 0 && (
                        <div className="divide-y divide-white/10">
                            {results.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => { openDrawer('product', product); onClose(); }}
                                    className="w-full flex items-center space-x-4 p-4 hover:bg-white/10 transition-all group text-left"
                                >
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-white font-black uppercase tracking-tight text-sm">{product.name}</p>
                                        <p className="text-white/50 text-xs uppercase tracking-widest mt-1">{product.bucket} · {product.subCategory}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-red-400 font-black">${product.price.toFixed(2)}</p>
                                        <ArrowRight size={16} className="text-white/30 group-hover:text-white ml-auto mt-1 transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {!query && (
                        <div className="p-6">
                            <div className="flex items-center space-x-2 mb-4">
                                <TrendingUp size={16} className="text-yellow-400" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Trending Searches</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {TRENDING_SEARCHES.map(term => (
                                    <button
                                        key={term}
                                        onClick={() => setQuery(term)}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all hover:border-white/40"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-white/20 text-xs font-bold uppercase tracking-widest mt-6">
                    Press ESC or click outside to close
                </p>
            </div>
        </div>
    );
};

export default SearchOverlay;