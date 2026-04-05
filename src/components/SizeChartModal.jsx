/**
 * @fileoverview SizeChartModal — Design Spells Edition
 * Fix: replaced require('animejs') with ESM import — tab transitions, row staggers, and accordion springs are now functional
 * Applies: animejs-animation (tab content slide, table row stagger),
 *          design-spells (unit toggle morphing, highlighted active size, accordion spring)
 */

import React, { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import { X, Ruler, Info, MessageCircle } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';
import { useScrollLock } from '../hooks/useUtils.js';

// ─────────────────────────────────────────────────────────────────
// SIZE DATA
// ─────────────────────────────────────────────────────────────────

const SIZE_DATA = {
  Tops: {
    headers: ['Size', 'Chest', 'Shoulder', 'Length', 'Sleeve'],
    cm: [
      ['XS', '86–91', '42', '68', '62'],
      ['S', '91–96', '44', '70', '63'],
      ['M', '96–101', '46', '72', '64'],
      ['L', '101–106', '48', '74', '65'],
      ['XL', '106–111', '50', '76', '66'],
      ['XXL', '111–116', '52', '78', '67'],
    ],
    in: [
      ['XS', '34–36', '16.5', '26.8', '24.4'],
      ['S', '36–38', '17.3', '27.6', '24.8'],
      ['M', '38–40', '18.1', '28.3', '25.2'],
      ['L', '40–42', '18.9', '29.1', '25.6'],
      ['XL', '42–44', '19.7', '29.9', '26.0'],
      ['XXL', '44–46', '20.5', '30.7', '26.4'],
    ],
    howTo: [
      { label: 'Chest', desc: 'Measure around the fullest part of your chest, tape horizontal.' },
      { label: 'Shoulder', desc: 'Edge of one shoulder to the other across your back.' },
      { label: 'Length', desc: 'Highest point of shoulder down to hem.' },
      { label: 'Sleeve', desc: 'Shoulder seam to end of cuff.' },
    ],
  },
  Bottoms: {
    headers: ['Size', 'Waist', 'Hips', 'Inseam', 'Rise'],
    cm: [
      ['XS', '68–72', '88–92', '76', '25'],
      ['S', '72–76', '92–96', '77', '26'],
      ['M', '76–80', '96–100', '78', '27'],
      ['L', '80–84', '100–104', '79', '28'],
      ['XL', '84–88', '104–108', '80', '29'],
      ['XXL', '88–92', '108–112', '81', '30'],
    ],
    in: [
      ['XS', '27–28', '35–36', '30', '9.8'],
      ['S', '28–30', '36–38', '30.3', '10.2'],
      ['M', '30–32', '38–39', '30.7', '10.6'],
      ['L', '32–33', '39–41', '31.1', '11.0'],
      ['XL', '33–35', '41–42', '31.5', '11.4'],
      ['XXL', '35–36', '42–44', '31.9', '11.8'],
    ],
    howTo: [
      { label: 'Waist', desc: 'Natural waistline, just above belly button.' },
      { label: 'Hips', desc: 'Fullest part of hips and buttocks.' },
      { label: 'Inseam', desc: 'Crotch down to bottom of ankle.' },
      { label: 'Rise', desc: 'Crotch seam to top of waistband.' },
    ],
  },
  Footwear: {
    headers: ['IN', 'EU', 'UK', 'cm', 'inches'],
    cm: [
      ['6', '39', '5.5', '24.1', '9.5"'],
      ['7', '40', '6.5', '24.8', '9.8"'],
      ['8', '41', '7.5', '25.4', '10.0"'],
      ['9', '42', '8.5', '26.0', '10.2"'],
      ['10', '43', '9.5', '26.7', '10.5"'],
      ['11', '44', '10.5', '27.3', '10.7"'],
      ['12', '45', '11.5', '28.0', '11.0"'],
    ],
    in: [
      ['6', '39', '5.5', '24.1', '9.5"'],
      ['7', '40', '6.5', '24.8', '9.8"'],
      ['8', '41', '7.5', '25.4', '10.0"'],
      ['9', '42', '8.5', '26.0', '10.2"'],
      ['10', '43', '9.5', '26.7', '10.5"'],
      ['11', '44', '10.5', '27.3', '10.7"'],
      ['12', '45', '11.5', '28.0', '11.0"'],
    ],
    howTo: [
      { label: 'Foot Length', desc: 'Stand on flat surface, measure heel to longest toe tip.' },
      { label: 'Width', desc: 'Across the widest part of your foot (ball).' },
    ],
  },
};

const TABS = [
  { key: 'Tops', label: '👕 Tops' },
  { key: 'Bottoms', label: '👖 Bottoms' },
  { key: 'Footwear', label: '👟 Footwear' },
];

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

const SizeChartModal = ({ isOpen, onClose, defaultCategory = 'Tops', highlightSize }) => {
  const [activeTab, setActiveTab] = useState(defaultCategory);
  const [unit, setUnit] = useState('cm');
  const [showHowTo, setShowHowTo] = useState(false);
  const tableRef = useRef(null);
  const pillRef = useRef(null);
  const tabRefs = useRef({});

  useScrollLock(isOpen);

  useEffect(() => {
    if (defaultCategory && SIZE_DATA[defaultCategory]) {
      setActiveTab(defaultCategory);
    }
  }, [defaultCategory, isOpen]);

  // Keyboard close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Animate pill on tab change
  useEffect(() => {
    const tab = tabRefs.current[activeTab];
    const pill = pillRef.current;
    if (!tab || !pill) return;

    anime({
      targets: pill,
      left: tab.offsetLeft,
      width: tab.offsetWidth,
      duration: 300,
      easing: EASING.SPRING,
    });
  }, [activeTab]);

  // Stagger table rows on tab switch
  useEffect(() => {
    if (!tableRef.current || !isOpen) return;

    const rows = tableRef.current.querySelectorAll('tbody tr');
    anime.set(rows, { opacity: 0, translateX: -10 });
    anime({
      targets: rows,
      opacity: [0, 1],
      translateX: [-10, 0],
      duration: 300,
      delay: anime.stagger(40),
      easing: EASING.QUART_OUT,
    });
  }, [activeTab, isOpen]);

  // How-to accordion
  const toggleHowTo = () => {
    setShowHowTo(p => !p);
    const el = document.querySelector('[data-howto-content]');
    if (!el) return;
    if (!showHowTo) {
      el.style.maxHeight = '0px';
      el.style.overflow = 'hidden';
      anime({ targets: el, maxHeight: [0, 400], duration: 400, easing: EASING.SPRING });
    } else {
      anime({ targets: el, maxHeight: [400, 0], duration: 300, easing: EASING.SILK, complete: () => { el.style.maxHeight = ''; } });
    }
  };

  if (!isOpen) return null;

  const data = SIZE_DATA[activeTab];
  const rows = unit === 'cm' ? data.cm : data.in;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <Ruler size={16} className="text-[#ba1f3d]" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tighter text-gray-900">Size Guide</h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Find your perfect fit</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Unit toggle — design spell */}
            <div className="relative flex items-center bg-gray-100 rounded-xl p-1">
              <div
                className="absolute h-6 bg-white rounded-lg shadow-sm transition-none"
                style={{
                  width: '36px',
                  left: unit === 'cm' ? '4px' : 'calc(50% + 0px)',
                  willChange: 'left',
                  transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
              {['cm', 'in'].map(u => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`relative z-10 w-9 py-1 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${
                    unit === u ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>

            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all hover:rotate-90 transform text-gray-400">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Tabs — sliding pill */}
        <div className="relative border-b border-gray-100 px-4 flex-shrink-0">
          {/* Pill */}
          <div
            ref={pillRef}
            className="absolute bottom-0 h-0.5 bg-[#ba1f3d] pointer-events-none"
            style={{ willChange: 'left, width' }}
          />
          <div className="flex">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                ref={el => { tabRefs.current[key] = el; }}
                onClick={() => setActiveTab(key)}
                className={`py-4 px-4 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${
                  activeTab === key ? 'text-[#ba1f3d]' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-grow p-5">

          {/* Pro tip */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-5 flex items-start space-x-3">
            <span className="text-base flex-shrink-0">💡</span>
            <p className="text-xs font-bold text-yellow-800 leading-relaxed">
              <span className="font-black">Pro tip: </span>
              Between sizes? Size up for relaxed fit, size down for slim. Our fabrics have slight stretch.
            </p>
          </div>

          {/* Table */}
          <div ref={tableRef} className="overflow-x-auto rounded-xl border border-gray-100 mb-5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white">
                  {data.headers.map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[9px] font-black uppercase tracking-widest ${i === 0 ? 'sticky left-0 bg-gray-900 z-10' : ''}`}
                    >
                      {h}
                      {i > 0 && activeTab !== 'Footwear' && (
                        <span className="ml-1 text-gray-400 normal-case text-[8px]">({unit})</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, rIdx) => {
                  const isHighlighted = highlightSize && row[0] === highlightSize;
                  return (
                    <tr
                      key={rIdx}
                      className={`group transition-colors duration-150 ${
                        isHighlighted
                          ? 'bg-[#ba1f3d]/5 border-l-2 border-[#ba1f3d]'
                          : 'hover:bg-gray-50/70'
                      }`}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`px-4 py-3 text-sm transition-colors ${
                            cIdx === 0
                              ? `font-black sticky left-0 z-10 ${isHighlighted ? 'bg-[#ba1f3d]/5 text-[#ba1f3d]' : 'bg-white group-hover:bg-gray-50/70 text-gray-900'}`
                              : `font-medium text-gray-600 ${isHighlighted ? 'text-gray-700' : ''}`
                          }`}
                        >
                          {cIdx === 0 ? (
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black transition-all ${
                              isHighlighted
                                ? 'bg-[#ba1f3d] text-white shadow-md'
                                : 'bg-gray-100 group-hover:bg-gray-200 text-gray-700'
                            }`}>
                              {cell}
                            </span>
                          ) : cell}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* How to measure accordion */}
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={toggleHowTo}
              className="flex items-center justify-between w-full py-2 group"
            >
              <div className="flex items-center space-x-2">
                <Info size={14} className="text-gray-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-900 transition-colors">
                  How to Measure
                </span>
              </div>
              <span
                className="text-gray-400 text-xl font-light transition-transform duration-300"
                style={{ transform: showHowTo ? 'rotate(45deg)' : 'none' }}
              >
                +
              </span>
            </button>

            <div data-howto-content className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 overflow-hidden" style={{ maxHeight: '0px' }}>
              {data.howTo.map(({ label, desc }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#ba1f3d] mb-1">{label}</p>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-bold">Still not sure?</p>
            <a
              href="https://wa.me/923068458656"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-500 transition-all duration-200 btn-shimmer"
            >
              <MessageCircle size={12} />
              <span>Ask on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeChartModal;
