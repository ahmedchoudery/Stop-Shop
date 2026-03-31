/**
 * @fileoverview OrderSuccessPage — Design Spells Edition
 * Fix: replaced require('animejs') with ESM import — confetti bursts, checkmark draws, and stagger timelines are now functional
 * Applies: animejs-animation (confetti burst, checkmark draw, stagger timeline),
 *          design-spells (celebratory moment, order ID reveal, timeline progress),
 *          design-md (Cardinal Red success, editorial typography)
 */

import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home, ArrowRight } from 'lucide-react';
import { EASING } from '../hooks/useAnime.js';

// ─────────────────────────────────────────────────────────────────
// CONFETTI PARTICLE
15: // ─────────────────────────────────────────────────────────────────
16: 
17: const CONFETTI_COLORS = ['#ba1f3d', '#FBBF24', '#111827', '#F63049', '#ffffff'];
18: 
19: const spawnConfetti = (animeInstance) => {
20:   const container = document.getElementById('confetti-container');
21:   if (!container) return;
22: 
23:   for (let i = 0; i < 60; i++) {
24:     const el = document.createElement('div');
25:     const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
26:     const size = Math.random() * 8 + 4;
27:     const isRect = Math.random() > 0.5;
28: 
29:     el.style.cssText = `
30:       position: absolute;
31:       width: ${size}px;
32:       height: ${isRect ? size * 0.4 : size}px;
33:       background: ${color};
34:       border-radius: ${isRect ? '1px' : '50%'};
35:       left: ${Math.random() * 100}%;
36:       top: -20px;
37:       opacity: 1;
38:       pointer-events: none;
39:     `;
40:     container.appendChild(el);
41: 
42:     animeInstance({
43:       targets: el,
44:       translateY: [0, window.innerHeight * (0.6 + Math.random() * 0.4)],
45:       translateX: [(Math.random() - 0.5) * 300],
46:       rotate: [0, Math.random() * 720 * (Math.random() > 0.5 ? 1 : -1)],
47:       opacity: [1, 0],
48:       duration: 1800 + Math.random() * 1200,
49:       delay: Math.random() * 400,
50:       easing: 'cubicBezier(0.25, 0.46, 0.45, 0.94)',
51:       complete: () => el.remove(),
52:     });
53:   }
54: };
55: 
56: // ─────────────────────────────────────────────────────────────────
57: // DELIVERY TIMELINE
58: // ─────────────────────────────────────────────────────────────────
59: 
60: const DeliveryTimeline = () => {
61:   const steps = [
62:     { icon: CheckCircle, label: 'Order Confirmed', sublabel: 'Just now', done: true },
63:     { icon: Package, label: 'Being Packed', sublabel: 'Today', done: true },
64:     { icon: Truck, label: 'Out for Delivery', sublabel: '2–5 days', done: false },
65:     { icon: Home, label: 'Delivered', sublabel: 'Soon!', done: false },
66:   ];
67: 
68:   return (
69:     <div className="w-full max-w-sm mx-auto">
70:       {steps.map((s, i) => (
71:         <div key={i} className="flex items-start space-x-4">
72:           <div className="flex flex-col items-center">
73:             <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
74:               s.done ? 'bg-[#ba1f3d] text-white shadow-lg shadow-red-200/60' : 'bg-gray-100 text-gray-400'
75:             }`}>
76:               <s.icon size={16} />
77:             </div>
78:             {i < steps.length - 1 && (
79:               <div className={`w-0.5 h-8 mt-1 ${s.done ? 'bg-[#ba1f3d]' : 'bg-gray-100'}`} />
80:             )}
81:           </div>
82:           <div className="pt-1.5 pb-6">
83:             <p className={`text-sm font-black uppercase tracking-tight ${s.done ? 'text-gray-900' : 'text-gray-400'}`}>
84:               {s.label}
85:             </p>
86:             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
87:               {s.sublabel}
88:             </p>
89:           </div>
90:         </div>
91:       ))}
92:     </div>
93:   );
94: };
95: 
96: // ─────────────────────────────────────────────────────────────────
97: // MAIN PAGE
98: // ─────────────────────────────────────────────────────────────────
99: 
100: const OrderSuccessPage = () => {
101:   const [params] = useSearchParams();
102:   const orderID = params.get('orderID') ?? 'ORD-XXXXXXXX';
103: 
104:   const containerRef = useRef(null);
105:   const checkRef = useRef(null);
106:   const orderIdRef = useRef(null);
107: 
108:   useEffect(() => {
109:     if (!containerRef.current) return;
110: 
111:     const tl = anime.timeline({ easing: EASING.FABRIC });
112: 
113:     const elements = containerRef.current.querySelectorAll('[data-success]');
114:     anime.set(elements, { opacity: 0, translateY: 30 });
115:     anime.set(checkRef.current, { scale: 0, opacity: 0 });
116: 
117:     tl
118:       // 1. Check icon springs in
119:       .add({
120:         targets: checkRef.current,
121:         scale: [0, 1.15, 1],
122:         opacity: [0, 1],
123:         duration: 700,
124:         easing: EASING.SPRING,
125:       })
126:       // 2. Confetti burst
127:       .add({
128:         duration: 1,
129:         complete: () => spawnConfetti(anime),
130:       }, '-=400')
131:       // 3. Content stagger
132:       .add({
133:         targets: elements,
134:         opacity: [0, 1],
135:         translateY: [30, 0],
136:         duration: 600,
137:         delay: anime.stagger(100),
138:       }, '-=200')
139:       // 4. Order ID scramble reveal
140:       .add({
141:         duration: 1,
142:         complete: () => {
143:           if (!orderIdRef.current) return;
144:           const chars = 'ABCDEF0123456789-';
145:           let iter = 0;
146:           const final = orderID;
147:           const interval = setInterval(() => {
148:             orderIdRef.current.textContent = final
149:               .split('')
150:               .map((c, idx) => {
151:                 if (c === '-') return '-';
152:                 return idx < iter ? c : chars[Math.floor(Math.random() * chars.length)];
153:               })
154:               .join('');
155:             if (iter >= final.length) {
156:               clearInterval(interval);
157:               orderIdRef.current.textContent = final;
158:             }
159:             iter++;
160:           }, 50);
161:         },
162:       }, '+=100');
163: 
164:     return () => tl.pause();
165:   }, [orderID]); // added orderID to dependency array
166: 
167:   return (
168:     <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
169: 
170:       {/* Confetti container */}
171:       <div id="confetti-container" className="fixed inset-0 pointer-events-none z-50" />
172: 
173:       {/* Ambient glow */}
174:       <div
175:         className="absolute inset-0 pointer-events-none"
176:         style={{
177:           background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(186,31,61,0.06) 0%, transparent 70%)',
178:         }}
179:       />
180: 
181:       <div ref={containerRef} className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
182: 
183:         {/* Animated checkmark */}
184:         <div
185:           ref={checkRef}
186:           className="w-24 h-24 bg-[#ba1f3d] rounded-full flex items-center justify-center mb-8 shadow-[0_30px_80px_rgba(186,31,61,0.35)]"
187:           style={{ opacity: 0 }}
188:         >
189:           <CheckCircle size={44} className="text-white" strokeWidth={2} />
190:         </div>
191: 
192:         {/* Heading */}
193:         <div data-success style={{ opacity: 0 }}>
194:           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#ba1f3d] mb-3">
195:             Order Confirmed
196:           </p>
197:           <h1 className="text-5xl font-black uppercase tracking-tighter text-gray-900 mb-4 leading-tight">
198:             Thank You!
199:           </h1>
200:           <p className="text-gray-400 font-medium leading-relaxed mb-8">
201:             Your order has been placed successfully. You'll receive a confirmation email shortly.
202:           </p>
203:         </div>
204: 
205:         {/* Order ID — design spell: scramble reveal */}
206:         <div data-success className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8" style={{ opacity: 0 }}>
207:           <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2">
208:             Order Reference
209:           </p>
210:           <p
211:             ref={orderIdRef}
212:             className="text-2xl font-black font-mono tracking-wider text-[#ba1f3d]"
213:           >
214:             {orderID}
215:           </p>
216:         </div>
217: 
218:         {/* Delivery Timeline */}
219:         <div data-success className="w-full mb-10" style={{ opacity: 0 }}>
220:           <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 text-left">
221:             Delivery Timeline
222:           </p>
223:           <DeliveryTimeline />
224:         </div>
225: 
226:         {/* CTAs */}
227:         <div data-success className="flex flex-col sm:flex-row gap-3 w-full" style={{ opacity: 0 }}>
228:           <Link
229:             to="/"
230:             className="flex-1 flex items-center justify-center space-x-2 py-4 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-gray-900 transition-all duration-300 shadow-xl shadow-red-200/40 btn-shimmer group"
241:           >
242:             <span>Continue Shopping</span>
243:             <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
244:           </Link>
245:           <button
246:             onClick={() => window.print()}
247:             className="flex-1 py-4 border-2 border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all duration-300"
248:           >
249:             Save Invoice
250:           </button>
251:         </div>
252: 
253:         {/* Footer note */}
254:         <p data-success className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mt-8" style={{ opacity: 0 }}>
255:           Questions? WhatsApp us at 0306-84586556
256:         </p>
257:       </div>
258:     </div>
259:   );
260: };
261: 
262: export default OrderSuccessPage;
