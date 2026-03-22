import React from 'react';
import { Zap } from 'lucide-react';

const ITEMS = [
    '✦ FREE SHIPPING ON ORDERS OVER RS. 2000',
    '✦ USE CODE SUMMER20 FOR 20% OFF',
    '✦ NEW ARRIVALS EVERY FRIDAY',
    '✦ PREMIUM FABRICS · CRAFTED IN INDIA',
    '✦ EASY 30-DAY RETURNS',
    '✦ CASHBACK ON UPI PAYMENTS',
];

const MarqueeBar = ({ announcement }) => {
    const items = announcement
        ? [`✦ ${announcement.toUpperCase()}`, ...ITEMS]
        : ITEMS;

    // Duplicate for seamless loop
    const allItems = [...items, ...items];

    return (
        <div className="bg-yellow-400 py-2.5 overflow-hidden group">
            <div className="marquee-track">
                {allItems.map((item, i) => (
                    <span
                        key={i}
                        className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-red-950 px-8 flex-shrink-0"
                    >
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default MarqueeBar;