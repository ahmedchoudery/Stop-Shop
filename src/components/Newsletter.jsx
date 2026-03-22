import React, { useState } from 'react';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | success

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email) return;
        setStatus('loading');
        setTimeout(() => {
            setStatus('success');
        }, 1200);
    };

    return (
        <section className="relative overflow-hidden bg-[#0A0A0A] py-28">
            {/* Animated BG */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/20 rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-yellow-500/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-red-600/10 rounded-full blur-[60px]" />
            </div>

            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
                backgroundSize: '60px 60px'
            }} />

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
                {/* Tag */}
                <div className="inline-flex items-center space-x-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-5 py-2 mb-8">
                    <Sparkles size={14} className="text-yellow-400" />
                    <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em]">Exclusive Members Only</span>
                </div>

                <h2 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-6">
                    Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-400">20% Off</span><br />
                    Your First Order
                </h2>

                <p className="text-gray-400 text-lg font-medium mb-12 max-w-xl mx-auto leading-relaxed">
                    Join the Stop & Shop inner circle. Be the first to know about drops, exclusive deals, and styling secrets.
                </p>

                {status === 'success' ? (
                    <div className="flex flex-col items-center space-y-4 animate-fade-up">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle size={32} className="text-green-400" />
                        </div>
                        <p className="text-white font-black uppercase tracking-widest text-lg">You're In!</p>
                        <p className="text-gray-400 text-sm">Check your inbox for your 20% discount code.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto">
                        <div className="relative flex-grow w-full">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-5 text-white placeholder:text-gray-600 font-medium outline-none focus:border-red-500/50 focus:bg-white/8 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-red-600 hover:bg-red-500 text-white px-8 py-5 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-red-900/50 disabled:opacity-70 active:scale-95 flex-shrink-0"
                        >
                            {status === 'loading' ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Subscribe</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mt-6">
                    No spam. Unsubscribe anytime. Use code <span className="text-yellow-400">SUMMER20</span> at checkout.
                </p>

                {/* Stats */}
                <div className="flex justify-center divide-x divide-white/10 mt-16 border-t border-white/5 pt-12">
                    {[
                        { num: '12K+', label: 'Subscribers' },
                        { num: '4.9★', label: 'Member Rating' },
                        { num: 'Free', label: 'Shipping Perks' },
                    ].map(stat => (
                        <div key={stat.label} className="px-10 text-center">
                            <p className="text-2xl font-black text-white">{stat.num}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Newsletter;