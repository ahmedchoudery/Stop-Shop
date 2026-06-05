# Design System: Stop & Shop

## 1. Visual Theme & Atmosphere
Stop & Shop commands a **Premium Utilitarian Minimalism & Editorial UI** aesthetic — the visual language of a high-end fashion catalog translated to a digital workspace platform. The atmosphere is clinical yet warm, restrained, and structurally confident, featuring:
*   **Density (Balanced 4):** Structural macro-whitespace is treated as a premium material. Content width is constrained to a centered grid with generous margins.
*   **Variance (Asymmetric 8):** Layouts embrace offset grids, asymmetrical columns, and clean alignments that break traditional patterns to signal exclusivity.
*   **Motion (Restrained 4):** Animation is fluid, organic, and sparse, prioritizing physical transforms (spring physics) and opacity reveals.
*   **Texture:** A global, hardware-accelerated tactile noise-grain overlay (`opacity: 0.022`) runs behind all layers, simulating high-end physical matte paper.

---

## 2. Color Palette & Roles
The design uses a warm monochrome scale punctuated exclusively by desaturated spot pastels. Rich primaries and neon glows are strictly banned.
*   **Canvas Bone** (`#F7F6F3`) — Primary page background. An off-white warmth that softens the interface.
*   **Pure Surface** (`#FFFFFF`) — Cards, product tiles, drawer panels, and active containers.
*   **Charcoal Ink** (`#111111`) — Primary text, headings, buttons, and brand indicators.
*   **Muted Graphite** (`#787774`) — Body copy, secondary information, and labels.
*   **Whisper Border** (`#EAEAEA`) — Hairline borders and dividers.
*   **Pale Crimson** (`#FDEBEC` / Text: `#9F2F2D`) — Washout red accent for delete operations, critical errors, and sale tags.
*   **Pale Grass** (`#EDF3EC` / Text: `#346538`) — Muted green accent for in-stock badges and success indicators.
*   **Pale Amber** (`#FBF3DB` / Text: `#956400`) — Washout yellow accent for promotions and warning notices.

---

## 3. Typography Rules
Visual hierarchy is established through weight, case, and spacing rather than generic scale modifications.
*   **Display Font:** `Playfair Display` (serif) — Used for hero headlines, section headers, and testimonials. Features tight tracking (`letter-spacing: -0.02em` to `-0.04em`) and condensed line-height (`1.05`).
*   **Body / UI Font:** `'SF Pro Display', 'Geist Sans', var(--font-dm-sans), sans-serif` — Restrained geometric sans-serif for controls, buttons, descriptions, and list values.
*   **Monospace Font:** `'Geist Mono', 'SF Mono', monospace` — For item tags, sizes, pricing digits, and high-density metadata.
*   **Letter-Spacing Character:**
    *   *Controls / Badges:* Wide uppercase tracking (`letter-spacing: 0.35em` to `0.5em`) at tiny sizes (`8px` to `10px`).
    *   *Body Copy:* Regular reading leading (`line-height: 1.6`) with a maximum width of `65` characters per line.
*   **Banned Fonts:** `Inter`, `Roboto`, `Open Sans` are banned. Generic serifs (`Times New Roman`, `Georgia`, `Garamond`) are banned.

---

## 4. Component Stylings
Components are ultra-flat and structural. Heavy drop shadows and generic roundings are rejected.
*   **Buttons:** Sharp-edged rectangles with a tight corner rounding (`rounded-[4px]`). Primary CTAs use solid Charcoal Ink (`#111111`) background with white text, triggering a micro-scale elastic spring (`scale-[0.98]`) on press. No drop shadows.
*   **Cards:** Pure White container fill with crisp `1px solid #EAEAEA` borders and `4px` corner radii. Shadows are practically invisible (`rgba(0,0,0,0.03)`).
*   **Inputs:** Borderless with bottom-border-only (`border-b border-[#EAEAEA]`), focusing dynamically to a bold Charcoal Ink stroke. Labels are positioned strictly above inputs.
*   **Loading States:** Custom skeletal shimmer loaders matching the exact dimensions of cards, sections, or table rows. Circular spinners are banned.
*   **Badges / Tags:** Rounded pill containers (`rounded-full`) using the desaturated pale pastel backgrounds with high-contrast text.

---

## 5. Layout Principles
*   **Grid System:** Asymmetric CSS grids over basic flexbox rows. The layout uses grid column spans to place elements off-center.
*   **No Overlapping:** Elements occupy distinct spatial zones. Absolute-positioned elements must never overlay active text or icons.
*   **Whitespace Rhythm:** Vertical section spacing is structural and generous (`py-24` to `py-32`), treating negative space as a luxury material.
*   **Mobile Collapse:** All columns collapse to a single-column block layout on devices below `768px`.
*   **Full-Height Blocks:** Must use dynamic viewport heights (`min-h-[100dvh]`) to prevent layout jumps on mobile browsers.

---

## 6. Motion & Interaction
*   **Spring Physics:** Standard easing uses weighted spring configurations (`stiffness: 100, damping: 20`) for elements like slide-in drawers and interactive cards. Linear interpolation is banned.
*   **Cascading Reveals:** Entrance sequences are staggered using index-multiplied delays (`animation-delay: calc(var(--index) * 80ms)`) to orchestrate list loading smoothly.
*   **Hardware Acceleration:** Animations must only animate `transform` and `opacity` to avoid layout re-flows.
*   **Interactions:** Hover states are responsive and tactile: cards trigger a subtle lift and shadow shift, while image scales are capped at `1.04` to maintain precision.

---

## 7. Anti-Patterns (Banned)
*   **No Emojis:** Replace all emojis with SVG primitives or clean Phosphor Icons.
*   **No AI Copywriting Clichés:** Do not write "Elevate", "Seamless", "Unleash", "Next-Gen", "Game-changing", or "Delve". Write simple, specific language.
*   **No Pure Black:** Banned (`#000000`). Headings and buttons must resolve to Charcoal Ink (`#111111`).
*   **No Neon / Glow Shadows:** Heavy dropshadows and colorful glows are strictly prohibited.
*   **No 3-Column Equal Grids:** The generic "three cards in a row" marketing feature section is banned. Use horizontal scrollers or asymmetrical bento layouts.
*   **No Centered Heroes:** Layouts must use left-aligned content or asymmetrical splits to signal human craftsmanship.
*   **No Broken Links:** Image links must resolve to valid assets, local SVG placeholders, or `picsum.photos` seeds.