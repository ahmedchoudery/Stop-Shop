import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | success
    const formRef = useRef(null);

    useEffect(() => {
        if (formRef.current) {
            gsap.to(formRef.current, {
                y: -10,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: 'power1.inOut'
            });
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email) return;
        setStatus('loading');
        setTimeout(() => {
            setStatus('success');
        }, 1200);
    };

    return (
        <section className="relative overflow-hidden bg-white py-48 border-t border-gray-50">
            {/* Design Accents */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-[#ba1f3d]/[0.01] -skew-x-12 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-1/4 h-2/3 bg-gray-50/50 -skew-x-12 -translate-x-1/2" />

            <div className="relative max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
                {/* Tag */}
                <div className="inline-flex items-center space-x-4 bg-white border border-gray-100 shadow-sm px-8 py-4 mb-16">
                    <Sparkles size={16} className="text-[#ba1f3d] animate-pulse" />
                    <span className="text-gray-900 text-[10px] font-black uppercase tracking-[0.6em]">The Cardinal Circle</span>
                </div>

                <h2 className="text-5xl sm:text-7xl lg:text-[8rem] font-black text-gray-900 uppercase tracking-tighter leading-[0.8] mb-12">
                    Elevate Your <span className="text-[#ba1f3d]">Wardrobe.</span><br />
                    <span className="text-transparent" style={{ WebkitTextStroke: '2px #ba1f3d' }}>Secure Access.</span>
                </h2>

                <p className="text-gray-400 text-lg md:text-xl font-medium mb-20 max-w-2xl mx-auto leading-relaxed uppercase tracking-tighter opacity-70">
                    Join Pakistan's elite fashion community. Be the first to witness our limited drops and private collections.
                </p>

                {status === 'success' ? (
                    <div className="flex flex-col items-center space-y-8 animate-fade-up">
                        <div className="w-24 h-24 bg-[#ba1f3d] flex items-center justify-center shadow-[0_30px_60px_rgba(186,31,61,0.3)]">
                            <CheckCircle size={40} className="text-white" />
                        </div>
                        <div>
                            <p className="text-gray-900 font-black uppercase tracking-[0.5em] text-3xl">You've Arrived.</p>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-4">Check your inbox for the elite access code.</p>
                        </div>
                    </div>
                ) : (
                    <div ref={formRef} className="max-w-2xl mx-auto">
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-0 shadow-[0_40px_80px_rgba(0,0,0,0.1)] glass border-2 border-gray-900">
                            <div className="relative flex-grow">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="THE-ELITE@DOMAIN.COM"
                                    required
                                    className="w-full bg-transparent px-10 py-7 text-gray-900 placeholder:text-gray-300 font-black uppercase tracking-[0.2em] outline-none text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="bg-[#ba1f3d] hover:bg-gray-900 text-white px-14 py-7 font-black uppercase tracking-[0.4em] text-[10px] transition-all disabled:opacity-70 active:scale-[0.98] flex-shrink-0 flex items-center justify-center space-x-4 border-l-2 border-gray-900"
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
                    </div>
                )}

                <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.5em] mt-16 opacity-50">
                    Privacy first. Exclusivity guaranteed. Use code <span className="text-[#ba1f3d] underline decoration-2 underline-offset-4">CARDINAL20</span>.
                </p>

            </div>
        </section>
    );
};

export default Newsletter;