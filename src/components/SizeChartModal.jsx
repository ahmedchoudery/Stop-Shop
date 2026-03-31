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
14: // ─────────────────────────────────────────────────────────────────
15: 
16: const SIZE_DATA = {
17:   Tops: {
18:     headers: ['Size', 'Chest', 'Shoulder', 'Length', 'Sleeve'],
19:     cm: [
20:       ['XS', '86–91', '42', '68', '62'],
21:       ['S', '91–96', '44', '70', '63'],
22:       ['M', '96–101', '46', '72', '64'],
23:       ['L', '101–106', '48', '74', '65'],
24:       ['XL', '106–111', '50', '76', '66'],
25:       ['XXL', '111–116', '52', '78', '67'],
26:     ],
27:     in: [
28:       ['XS', '34–36', '16.5', '26.8', '24.4'],
29:       ['S', '36–38', '17.3', '27.6', '24.8'],
30:       ['M', '38–40', '18.1', '28.3', '25.2'],
31:       ['L', '40–42', '18.9', '29.1', '25.6'],
32:       ['XL', '42–44', '19.7', '29.9', '26.0'],
33:       ['XXL', '44–46', '20.5', '30.7', '26.4'],
34:     ],
35:     howTo: [
36:       { label: 'Chest', desc: 'Measure around the fullest part of your chest, tape horizontal.' },
37:       { label: 'Shoulder', desc: 'Edge of one shoulder to the other across your back.' },
38:       { label: 'Length', desc: 'Highest point of shoulder down to hem.' },
39:       { label: 'Sleeve', desc: 'Shoulder seam to end of cuff.' },
40:     ],
41:   },
42:   Bottoms: {
43:     headers: ['Size', 'Waist', 'Hips', 'Inseam', 'Rise'],
44:     cm: [
45:       ['XS', '68–72', '88–92', '76', '25'],
46:       ['S', '72–76', '92–96', '77', '26'],
47:       ['M', '76–80', '96–100', '78', '27'],
48:       ['L', '80–84', '100–104', '79', '28'],
49:       ['XL', '84–88', '104–108', '80', '29'],
50:       ['XXL', '88–92', '108–112', '81', '30'],
51:     ],
52:     in: [
53:       ['XS', '27–28', '35–36', '30', '9.8'],
54:       ['S', '28–30', '36–38', '30.3', '10.2'],
55:       ['M', '30–32', '38–39', '30.7', '10.6'],
56:       ['L', '32–33', '39–41', '31.1', '11.0'],
57:       ['XL', '33–35', '41–42', '31.5', '11.4'],
58:       ['XXL', '35–36', '42–44', '31.9', '11.8'],
59:     ],
60:     howTo: [
61:       { label: 'Waist', desc: 'Natural waistline, just above belly button.' },
62:       { label: 'Hips', desc: 'Fullest part of hips and buttocks.' },
63:       { label: 'Inseam', desc: 'Crotch down to bottom of ankle.' },
64:       { label: 'Rise', desc: 'Crotch seam to top of waistband.' },
65:     ],
66:   },
67:   Footwear: {
68:     headers: ['IN', 'EU', 'UK', 'cm', 'inches'],
69:     cm: [
70:       ['6', '39', '5.5', '24.1', '9.5"'],
71:       ['7', '40', '6.5', '24.8', '9.8"'],
72:       ['8', '41', '7.5', '25.4', '10.0"'],
73:       ['9', '42', '8.5', '26.0', '10.2"'],
74:       ['10', '43', '9.5', '26.7', '10.5"'],
75:       ['11', '44', '10.5', '27.3', '10.7"'],
76:       ['12', '45', '11.5', '28.0', '11.0"'],
77:     ],
78:     in: [
79:       ['6', '39', '5.5', '24.1', '9.5"'],
80:       ['7', '40', '6.5', '24.8', '9.8"'],
81:       ['8', '41', '7.5', '25.4', '10.0"'],
82:       ['9', '42', '8.5', '26.0', '10.2"'],
83:       ['10', '43', '9.5', '26.7', '10.5"'],
84:       ['11', '44', '10.5', '27.3', '10.7"'],
85:       ['12', '45', '11.5', '28.0', '11.0"'],
86:     ],
87:     howTo: [
88:       { label: 'Foot Length', desc: 'Stand on flat surface, measure heel to longest toe tip.' },
89:       { label: 'Width', desc: 'Across the widest part of your foot (ball).' },
90:     ],
91:   },
92: };
93: 
94: const TABS = [
95:   { key: 'Tops', label: '👕 Tops' },
96:   { key: 'Bottoms', label: '👖 Bottoms' },
97:   { key: 'Footwear', label: '👟 Footwear' },
98: ];
99: 
100: // ─────────────────────────────────────────────────────────────────
101: // MAIN COMPONENT
102: // ─────────────────────────────────────────────────────────────────
103: 
104: const SizeChartModal = ({ isOpen, onClose, defaultCategory = 'Tops', highlightSize }) => {
105:   const [activeTab, setActiveTab] = useState(defaultCategory);
106:   const [unit, setUnit] = useState('cm');
107:   const [showHowTo, setShowHowTo] = useState(false);
108:   const tableRef = useRef(null);
109:   const pillRef = useRef(null);
110:   const tabRefs = useRef({});
111: 
112:   useScrollLock(isOpen);
113: 
114:   useEffect(() => {
115:     if (defaultCategory && SIZE_DATA[defaultCategory]) {
116:       setActiveTab(defaultCategory);
117:     }
118:   }, [defaultCategory, isOpen]);
119: 
120:   // Keyboard close
121:   useEffect(() => {
122:     if (!isOpen) return;
123:     const onKey = (e) => { if (e.key === 'Escape') onClose(); };
124:     window.addEventListener('keydown', onKey);
125:     return () => window.removeEventListener('keydown', onKey);
126:   }, [isOpen, onClose]);
127: 
128:   // Animate pill on tab change
129:   useEffect(() => {
130:     const tab = tabRefs.current[activeTab];
131:     const pill = pillRef.current;
132:     if (!tab || !pill) return;
133: 
134:     anime({
135:       targets: pill,
136:       left: tab.offsetLeft,
137:       width: tab.offsetWidth,
138:       duration: 300,
139:       easing: EASING.SPRING,
140:     });
141:   }, [activeTab]);
142: 
143:   // Stagger table rows on tab switch
144:   useEffect(() => {
145:     if (!tableRef.current || !isOpen) return;
146: 
147:     const rows = tableRef.current.querySelectorAll('tbody tr');
148:     anime.set(rows, { opacity: 0, translateX: -10 });
149:     anime({
150:       targets: rows,
151:       opacity: [0, 1],
152:       translateX: [-10, 0],
153:       duration: 300,
154:       delay: anime.stagger(40),
155:       easing: EASING.QUART_OUT,
164:     });
165:   }, [activeTab, isOpen]);
166: 
167:   // How-to accordion
168:   const toggleHowTo = () => {
169:     setShowHowTo(p => !p);
170:     const el = document.querySelector('[data-howto-content]');
171:     if (!el) return;
172:     if (!showHowTo) {
173:       el.style.maxHeight = '0px';
174:       el.style.overflow = 'hidden';
175:       anime({ targets: el, maxHeight: [0, 400], duration: 400, easing: EASING.SPRING });
176:     } else {
177:       anime({ targets: el, maxHeight: [400, 0], duration: 300, easing: EASING.SILK, complete: () => { el.style.maxHeight = ''; } });
178:     }
179:   };
180: 
181:   if (!isOpen) return null;
182: 
183:   const data = SIZE_DATA[activeTab];
184:   const rows = unit === 'cm' ? data.cm : data.in;
185: 
186:   return (
187:     <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
188:       {/* Backdrop */}
189:       <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
190: 
191:       {/* Modal */}
192:       <div className="relative bg-white w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-slide-up">
193: 
194:         {/* Header */}
195:         <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
196:           <div className="flex items-center space-x-3">
197:             <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
200:               <Ruler size={16} className="text-[#ba1f3d]" />
201:             </div>
202:             <div>
203:               <h2 className="text-base font-black uppercase tracking-tighter text-gray-900">Size Guide</h2>
204:               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Find your perfect fit</p>
205:             </div>
206:           </div>
207: 
208:           <div className="flex items-center space-x-3">
209:             {/* Unit toggle — design spell */}
210:             <div className="relative flex items-center bg-gray-100 rounded-xl p-1">
211:               <div
212:                 className="absolute h-6 bg-white rounded-lg shadow-sm transition-none"
213:                 style={{
214:                   width: '36px',
215:                   left: unit === 'cm' ? '4px' : 'calc(50% + 0px)',
216:                   willChange: 'left',
217:                   transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
218:                 }}
219:               />
220:               {['cm', 'in'].map(u => (
221:                 <button
222:                   key={u}
223:                   onClick={() => setUnit(u)}
224:                   className={`relative z-10 w-9 py-1 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${
225:                     unit === u ? 'text-gray-900' : 'text-gray-400'
226:                   }`}
227:                 >
228:                   {u}
229:                 </button>
230:               ))}
231:             </div>
232: 
233:             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all hover:rotate-90 transform text-gray-400">
234:               <X size={18} />
235:             </button>
236:           </div>
237:         </div>
238: 
239:         {/* Category Tabs — sliding pill */}
240:         <div className="relative border-b border-gray-100 px-4 flex-shrink-0">
241:           {/* Pill */}
242:           <div
243:             ref={pillRef}
244:             className="absolute bottom-0 h-0.5 bg-[#ba1f3d] pointer-events-none"
245:             style={{ willChange: 'left, width' }}
246:           />
247:           <div className="flex">
248:             {TABS.map(({ key, label }) => (
249:               <button
250:                 key={key}
251:                 ref={el => { tabRefs.current[key] = el; }}
252:                 onClick={() => setActiveTab(key)}
253:                 className={`py-4 px-4 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${
254:                   activeTab === key ? 'text-[#ba1f3d]' : 'text-gray-400 hover:text-gray-700'
255:                 }`}
256:               >
257:                 {label}
258:               </button>
259:             ))}
260:           </div>
261:         </div>
262: 
263:         {/* Body */}
264:         <div className="overflow-y-auto flex-grow p-5">
265: 
266:           {/* Pro tip */}
267:           <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-5 flex items-start space-x-3">
268:             <span className="text-base flex-shrink-0">💡</span>
269:             <p className="text-xs font-bold text-yellow-800 leading-relaxed">
270:               <span className="font-black">Pro tip: </span>
271:               Between sizes? Size up for relaxed fit, size down for slim. Our fabrics have slight stretch.
272:             </p>
273:           </div>
274: 
275:           {/* Table */}
276:           <div ref={tableRef} className="overflow-x-auto rounded-xl border border-gray-100 mb-5">
277:             <table className="w-full text-left border-collapse">
278:               <thead>
279:                 <tr className="bg-gray-900 text-white">
280:                   {data.headers.map((h, i) => (
281:                     <th
282:                       key={h}
283:                       className={`px-4 py-3 text-[9px] font-black uppercase tracking-widest ${i === 0 ? 'sticky left-0 bg-gray-900 z-10' : ''}`}
284:                     >
285:                       {h}
286:                       {i > 0 && activeTab !== 'Footwear' && (
287:                         <span className="ml-1 text-gray-400 normal-case text-[8px]">({unit})</span>
288:                       )}
289:                     </th>
290:                   ))}
291:                 </tr>
292:               </thead>
293:               <tbody className="divide-y divide-gray-50">
294:                 {rows.map((row, rIdx) => {
295:                   const isHighlighted = highlightSize && row[0] === highlightSize;
296:                   return (
297:                     <tr
298:                       key={rIdx}
299:                       className={`group transition-colors duration-150 ${
300:                         isHighlighted
301:                           ? 'bg-[#ba1f3d]/5 border-l-2 border-[#ba1f3d]'
302:                           : 'hover:bg-gray-50/70'
303:                       }`}
304:                     >
305:                       {row.map((cell, cIdx) => (
306:                         <td
307:                           key={cIdx}
308:                           className={`px-4 py-3 text-sm transition-colors ${
309:                             cIdx === 0
310:                               ? `font-black sticky left-0 z-10 ${isHighlighted ? 'bg-[#ba1f3d]/5 text-[#ba1f3d]' : 'bg-white group-hover:bg-gray-50/70 text-gray-900'}`
311:                               : `font-medium text-gray-600 ${isHighlighted ? 'text-gray-700' : ''}`
312:                           }`}
313:                         >
314:                           {cIdx === 0 ? (
315:                             <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black transition-all ${
316:                               isHighlighted
317:                                 ? 'bg-[#ba1f3d] text-white shadow-md'
318:                                 : 'bg-gray-100 group-hover:bg-gray-200 text-gray-700'
319:                             }`}>
320:                               {cell}
321:                             </span>
322:                           ) : cell}
323:                         </td>
324:                       ))}
325:                     </tr>
326:                   );
327:                 })}
328:               </tbody>
329:             </table>
330:           </div>
331: 
332:           {/* How to measure accordion */}
333:           <div className="border-t border-gray-100 pt-4">
334:             <button
335:               onClick={toggleHowTo}
336:               className="flex items-center justify-between w-full py-2 group"
337:             >
338:               <div className="flex items-center space-x-2">
339:                 <Info size={14} className="text-gray-400" />
340:                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-900 transition-colors">
341:                   How to Measure
342:                 </span>
343:               </div>
344:               <span
345:                 className="text-gray-400 text-xl font-light transition-transform duration-300"
346:                 style={{ transform: showHowTo ? 'rotate(45deg)' : 'none' }}
347:               >
348:                 +
349:               </span>
350:             </button>
351: 
352:             {showHowTo && (
353:               <div data-howto-content className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 animate-fade-up">
354:                 {data.howTo.map(({ label, desc }) => (
355:                   <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
356:                     <p className="text-[9px] font-black uppercase tracking-widest text-[#ba1f3d] mb-1">{label}</p>
357:                     <p className="text-xs text-gray-500 font-medium leading-relaxed">{desc}</p>
358:                   </div>
359:                 ))}
360:               </div>
361:             )}
362:           </div>
363: 
364:           {/* WhatsApp CTA */}
365:           <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
366:             <p className="text-xs text-gray-400 font-bold">Still not sure?</p>
367:             <a
368:               href="https://wa.me/923068458656"
369:               target="_blank"
370:               rel="noopener noreferrer"
371:               className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-500 transition-all duration-200 btn-shimmer"
372:             >
373:               <MessageCircle size={12} />
374:               <span>Ask on WhatsApp</span>
375:             </a>
376:           </div>
377:         </div>
378:       </div>
379:     </div>
380:   );
381: };
382: 
383: export default SizeChartModal;
