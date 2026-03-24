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
        <section className="relative overflow-hidden bg-white py-40 border-t border-gray-100">
            {/* Design Accents */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-[#ba1f3d]/[0.02] -skew-x-12 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-1/4 h-2/3 bg-gray-50 -skew-x-12 -translate-x-1/2" />

            <div className="relative max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
                {/* Tag */}
                <div className="inline-flex items-center space-x-3 bg-white border border-gray-100 shadow-sm px-6 py-3 mb-12">
                    <Sparkles size={16} className="text-[#ba1f3d]" />
                    <span className="text-[#ba1f3d] text-[10px] font-black uppercase tracking-[0.5em]">The Cardinal Circle</span>
                </div>

                <h2 className="text-5xl sm:text-8xl font-black text-gray-900 uppercase tracking-tighter leading-[0.85] mb-8">
                    Elevate Your <span className="text-[#ba1f3d]">Wardrobe.</span><br />
                    Secure <span className="italic font-light text-gray-200">—</span> 20% Off.
                </h2>

                <p className="text-gray-400 text-lg md:text-xl font-medium mb-16 max-w-2xl mx-auto leading-relaxed uppercase tracking-tighter">
                    Join Pakistan's elite fashion community. Be the first to witness our limited drops and private collections.
                </p>

                {status === 'success' ? (
                    <div className="flex flex-col items-center space-y-6 animate-fade-up">
                        <div className="w-20 h-20 bg-[#ba1f3d] rounded-none flex items-center justify-center shadow-2xl">
                            <CheckCircle size={32} className="text-white" />
                        </div>
                        <div>
                            <p className="text-gray-900 font-black uppercase tracking-[0.4em] text-2xl">You've Arrived.</p>
                            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-2">Check your inbox for the elite access code.</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-0 max-w-2xl mx-auto shadow-2xl">
                        <div className="relative flex-grow">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="THE-ELITE@DOMAIN.COM"
                                required
                                className="w-full bg-white border-2 border-gray-900 border-r-0 px-8 py-6 text-gray-900 placeholder:text-gray-300 font-black uppercase tracking-widest outline-none focus:bg-gray-50 transition-all text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="bg-[#ba1f3d] hover:bg-gray-900 text-white px-12 py-6 font-black uppercase tracking-[0.3em] text-xs transition-all disabled:opacity-70 active:scale-[0.98] flex-shrink-0 flex items-center justify-center space-x-4"
                        >
                            {status === 'loading' ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Join Us</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] mt-12">
                    Privacy first. Exclusivity guaranteed. Use code <span className="text-[#ba1f3d]">CARDINAL20</span>.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 mt-32 border-t border-gray-100 pt-16 max-w-3xl mx-auto">
                    {[
                        { num: '50K+', label: 'Elite Members' },
                        { num: 'PKR', label: 'Local Support' },
                        { num: 'Top 1%', label: 'Design Tier' },
                    ].map(stat => (
                        <div key={stat.label} className="text-center group">
                            <p className="text-3xl font-black text-gray-900 tracking-tighter transition-all group-hover:text-[#ba1f3d]">{stat.num}</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mt-2">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Newsletter;