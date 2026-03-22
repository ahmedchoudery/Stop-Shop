import React, { useState, useEffect } from 'react';
import { X, Ruler, Info } from 'lucide-react';

// --- Size Data ---
const SIZE_DATA = {
    Tops: {
        headers: ['Size', 'Chest', 'Shoulder', 'Length', 'Sleeve'],
        unit_cm: [
            ['XS', '86–91', '42', '68', '62'],
            ['S', '91–96', '44', '70', '63'],
            ['M', '96–101', '46', '72', '64'],
            ['L', '101–106', '48', '74', '65'],
            ['XL', '106–111', '50', '76', '66'],
            ['XXL', '111–116', '52', '78', '67'],
        ],
        unit_in: [
            ['XS', '34–36', '16.5', '26.8', '24.4'],
            ['S', '36–38', '17.3', '27.6', '24.8'],
            ['M', '38–40', '18.1', '28.3', '25.2'],
            ['L', '40–42', '18.9', '29.1', '25.6'],
            ['XL', '42–44', '19.7', '29.9', '26.0'],
            ['XXL', '44–46', '20.5', '30.7', '26.4'],
        ],
        howTo: [
            { label: 'Chest', desc: 'Measure around the fullest part of your chest, keeping the tape horizontal.' },
            { label: 'Shoulder', desc: 'Measure from the edge of one shoulder to the other across your back.' },
            { label: 'Length', desc: 'Measure from the highest point of the shoulder down to the hem.' },
            { label: 'Sleeve', desc: 'Measure from the shoulder seam to the end of the cuff.' },
        ],
    },
    Bottoms: {
        headers: ['Size', 'Waist', 'Hips', 'Inseam', 'Rise'],
        unit_cm: [
            ['XS', '68–72', '88–92', '76', '25'],
            ['S', '72–76', '92–96', '77', '26'],
            ['M', '76–80', '96–100', '78', '27'],
            ['L', '80–84', '100–104', '79', '28'],
            ['XL', '84–88', '104–108', '80', '29'],
            ['XXL', '88–92', '108–112', '81', '30'],
        ],
        unit_in: [
            ['XS', '27–28', '35–36', '30', '9.8'],
            ['S', '28–30', '36–38', '30.3', '10.2'],
            ['M', '30–32', '38–39', '30.7', '10.6'],
            ['L', '32–33', '39–41', '31.1', '11.0'],
            ['XL', '33–35', '41–42', '31.5', '11.4'],
            ['XXL', '35–36', '42–44', '31.9', '11.8'],
        ],
        howTo: [
            { label: 'Waist', desc: 'Measure around your natural waistline, just above your belly button.' },
            { label: 'Hips', desc: 'Measure around the fullest part of your hips and buttocks.' },
            { label: 'Inseam', desc: 'Measure from your crotch down to the bottom of your ankle.' },
            { label: 'Rise', desc: 'Measure from the crotch seam to the top of the waistband.' },
        ],
    },
    Footwear: {
        headers: ['Size (IN)', 'Size (EU)', 'Size (UK)', 'Foot Length (cm)', 'Foot Length (in)'],
        unit_cm: [
            ['6', '39', '5.5', '24.1', '9.5"'],
            ['7', '40', '6.5', '24.8', '9.8"'],
            ['8', '41', '7.5', '25.4', '10.0"'],
            ['9', '42', '8.5', '26.0', '10.2"'],
            ['10', '43', '9.5', '26.7', '10.5"'],
            ['11', '44', '10.5', '27.3', '10.7"'],
            ['12', '45', '11.5', '28.0', '11.0"'],
        ],
        unit_in: [
            ['6', '39', '5.5', '24.1', '9.5"'],
            ['7', '40', '6.5', '24.8', '9.8"'],
            ['8', '41', '7.5', '25.4', '10.0"'],
            ['9', '42', '8.5', '26.0', '10.2"'],
            ['10', '43', '9.5', '26.7', '10.5"'],
            ['11', '44', '10.5', '27.3', '10.7"'],
            ['12', '45', '11.5', '28.0', '11.0"'],
        ],
        howTo: [
            { label: 'Foot Length', desc: 'Stand on a flat surface and measure from your heel to the tip of your longest toe.' },
            { label: 'Width', desc: 'Measure across the widest part of your foot (usually across the ball).' },
        ],
    },
};

const CATEGORY_LABELS = {
    Tops: '👕 Tops & Shirts',
    Bottoms: '👖 Bottoms & Jeans',
    Footwear: '👟 Footwear',
};

const SizeChartModal = ({ isOpen, onClose, defaultCategory = 'Tops' }) => {
    const [activeTab, setActiveTab] = useState(defaultCategory);
    const [unit, setUnit] = useState('cm'); // 'cm' | 'in'
    const [showHowTo, setShowHowTo] = useState(false);

    // sync default category when product changes
    useEffect(() => {
        setActiveTab(defaultCategory);
    }, [defaultCategory]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!isOpen) return null;

    const data = SIZE_DATA[activeTab];
    const rows = unit === 'cm' ? data.unit_cm : data.unit_in;

    return (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-slide-up">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                            <Ruler size={18} className="text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tighter text-gray-900">Size Guide</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Find your perfect fit</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        {/* Unit Toggle */}
                        <div className="flex items-center bg-gray-100 rounded-xl p-1">
                            {['cm', 'in'].map(u => (
                                <button
                                    key={u}
                                    onClick={() => setUnit(u)}
                                    className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${unit === u ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-900"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex border-b border-gray-100 px-6 flex-shrink-0">
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`py-4 mr-6 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === key
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Scrollable Body */}
                <div className="overflow-y-auto flex-grow p-6">

                    {/* Fit tip banner */}
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-6 flex items-start space-x-3">
                        <span className="text-lg">💡</span>
                        <p className="text-xs font-bold text-yellow-800 leading-relaxed">
                            <span className="font-black uppercase tracking-wide">Pro tip: </span>
                            If you're between sizes, size up for a relaxed fit or size down for a slim fit. Our fabrics have slight stretch.
                        </p>
                    </div>

                    {/* Size Table */}
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900 text-white">
                                    {data.headers.map((h, i) => (
                                        <th
                                            key={h}
                                            className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'sticky left-0 bg-gray-900 z-10 rounded-tl-xl' : ''}`}
                                        >
                                            {h}
                                            {h !== 'Size' && h !== 'Size (IN)' && h !== 'Size (EU)' && h !== 'Size (UK)' && (
                                                <span className="ml-1 text-gray-400 normal-case font-bold">
                                                    ({unit})
                                                </span>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {rows.map((row, rIdx) => (
                                    <tr
                                        key={rIdx}
                                        className="hover:bg-red-50/50 transition-colors group"
                                    >
                                        {row.map((cell, cIdx) => (
                                            <td
                                                key={cIdx}
                                                className={`px-4 py-3 text-sm transition-colors ${cIdx === 0
                                                        ? 'font-black text-gray-900 sticky left-0 bg-white group-hover:bg-red-50/50 z-10'
                                                        : 'font-medium text-gray-600'
                                                    }`}
                                            >
                                                {cIdx === 0 ? (
                                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 group-hover:bg-red-100 group-hover:text-red-700 rounded-lg text-xs font-black transition-colors">
                                                        {cell}
                                                    </span>
                                                ) : cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* How to Measure Accordion */}
                    <div className="mt-6">
                        <button
                            onClick={() => setShowHowTo(p => !p)}
                            className="flex items-center justify-between w-full py-4 border-t border-gray-100 group"
                        >
                            <div className="flex items-center space-x-2">
                                <Info size={15} className="text-gray-400" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-900 transition-colors">
                                    How to Measure
                                </span>
                            </div>
                            <span className={`text-gray-400 text-lg font-light transition-transform duration-300 ${showHowTo ? 'rotate-45' : ''}`}>+</span>
                        </button>

                        {showHowTo && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 animate-fade-up">
                                {data.howTo.map(({ label, desc }) => (
                                    <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">{label}</p>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{desc}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Still unsure CTA */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400 font-bold">Still not sure?</p>
                        <a
                            href="https://wa.me/919876543210"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-[11px] font-black uppercase tracking-widest bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-500 transition-all"
                        >
                            <span>💬</span>
                            <span>Ask on WhatsApp</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SizeChartModal;