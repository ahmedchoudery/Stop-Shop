import React from 'react';
import { X, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const WishlistDrawer = ({ isOpen, onClose }) => {
    const { wishlist, toggleWishlist } = useWishlist();
    const { addToCart, openDrawer } = useCart();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] overflow-hidden">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="absolute inset-y-0 right-0 w-screen max-w-md flex">
                <div className="relative flex flex-col w-full bg-white shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-black text-white">
                        <div className="flex items-center space-x-3">
                            <Heart size={22} className="text-red-500 fill-red-500" />
                            <h2 className="text-lg font-black uppercase tracking-tighter">Wishlist</h2>
                            {wishlist.length > 0 && (
                                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                    {wishlist.length}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-all"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-grow overflow-y-auto p-6">
                        {wishlist.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                                    <Heart size={36} strokeWidth={1} className="text-gray-300" />
                                </div>
                                <div>
                                    <p className="font-black uppercase tracking-widest text-gray-900">Your wishlist is empty</p>
                                    <p className="text-sm text-gray-400 mt-2">Save items you love for later</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="flex items-center space-x-2 text-[11px] font-black uppercase tracking-widest text-red-600 border-b border-red-200 pb-0.5 hover:border-red-600 transition-colors"
                                >
                                    <span>Browse Collection</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {wishlist.map(product => (
                                    <div key={product.id} className="flex space-x-4 group">
                                        <div
                                            onClick={() => { openDrawer('product', product); onClose(); }}
                                            className="w-24 h-28 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
                                        >
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 leading-tight">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                        {product.bucket}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => toggleWishlist(product)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <p className="text-red-600 font-black mt-2">${product.price.toFixed(2)}</p>
                                            <button
                                                onClick={() => {
                                                    addToCart(product);
                                                    toggleWishlist(product);
                                                }}
                                                className="mt-3 flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest bg-black text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all"
                                            >
                                                <ShoppingBag size={12} />
                                                <span>Move to Cart</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WishlistDrawer;