import React, { useEffect, useState } from 'react';
import { CheckCircle, Package, Truck, Home, ArrowRight, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrderSuccessPage = ({ orderData }) => {
    const [copied, setCopied] = useState(false);
    const orderId = orderData?.orderId || `SS-${Math.floor(100000 + Math.random() * 900000)}`;
    const estimatedDays = Math.floor(3 + Math.random() * 3);

    const copyOrderId = () => {
        navigator.clipboard.writeText(orderId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4 py-16">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-900/10 rounded-full blur-[120px] animate-pulse-slow" />
            </div>

            <div className="relative max-w-lg w-full text-center">
                {/* Success Icon */}
                <div className="relative inline-flex mb-8">
                    <div className="w-28 h-28 bg-green-500/10 rounded-full flex items-center justify-center animate-scale-in">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle size={48} className="text-green-400" strokeWidth={1.5} />
                        </div>
                    </div>
                    {/* Orbiting dot */}
                    <div className="absolute inset-0 animate-spin-slow">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full" />
                    </div>
                </div>

                <div className="animate-fade-up">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-green-400 mb-4">
                        Order Confirmed
                    </p>
                    <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                        Thank You!
                    </h1>
                    <p className="text-gray-400 text-lg font-medium mb-8">
                        Your order has been placed successfully. You'll receive a confirmation email shortly.
                    </p>

                    {/* Order ID */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">Order Reference</p>
                        <div className="flex items-center justify-center space-x-3">
                            <span className="text-2xl font-black text-white font-mono">{orderId}</span>
                            <button
                                onClick={copyOrderId}
                                className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            >
                                {copied ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Delivery Timeline */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6">Delivery Timeline</p>
                        <div className="space-y-4">
                            {[
                                { icon: CheckCircle, label: 'Order Confirmed', status: 'done', time: 'Just now' },
                                { icon: Package, label: 'Being Packed', status: 'active', time: 'Today' },
                                { icon: Truck, label: 'Out for Delivery', status: 'pending', time: `${estimatedDays} days` },
                                { icon: Home, label: 'Delivered', status: 'pending', time: `${estimatedDays + 1} days` },
                            ].map((step, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.status === 'done' ? 'bg-green-500/20 text-green-400' :
                                            step.status === 'active' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-white/5 text-gray-600'
                                        }`}>
                                        <step.icon size={16} />
                                    </div>
                                    <div className="flex-grow">
                                        <p className={`text-sm font-black uppercase tracking-tight ${step.status === 'pending' ? 'text-gray-600' : 'text-white'
                                            }`}>{step.label}</p>
                                    </div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${step.status === 'done' ? 'text-green-400' :
                                            step.status === 'active' ? 'text-yellow-400' : 'text-gray-600'
                                        }`}>{step.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <Link
                        to="/"
                        className="inline-flex items-center space-x-3 bg-white text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-red-600 hover:text-white transition-all shadow-2xl active:scale-95"
                    >
                        <span>Continue Shopping</span>
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessPage;