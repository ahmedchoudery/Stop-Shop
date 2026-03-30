# Design System: Stop & Shop
**Edition:** Pakistan · 2026 · Cardinal Collection

---

## 1. Visual Theme & Atmosphere

Stop & Shop commands a **Premium Editorial Dark-Luxury** aesthetic — the visual language of a high-end fashion boutique translated to the web. The atmosphere is **Intense, Authoritative, and Aspirational**: bold typographic slabs against surgical white space, punctuated by a single dominant Cardinal Red accent that functions as a status signal rather than decoration.

The mood is deliberately **high-contrast and structurally confident** — nothing is decorative for decoration's sake. Every element earns its place. Typography is oversized and uppercase, carrying the same weight as physical signage. Imagery is desaturated until hover, signaling exclusivity. White space is generous and intentional, creating the breathing room of a luxury store floor rather than a market stall.

Motion philosophy: **Deliberate and Expensive.** Animations feel like fabric falling — never rushed, never cheap. Entrances use expo easing for text, spring physics for interactive elements, and silk-smooth fabric-like transitions between states.

---

## 2. Color Palette & Roles

| Name | Hex | Role |
|------|-----|------|
| **Cardinal Red** | `#ba1f3d` | Primary action, emphasis, brand soul. Used for CTAs, badges, price tags, and active states. Never overused — its scarcity is its power. |
| **Crimson Punch** | `#F63049` | Secondary accent, hover states, sale indicators. Slightly more vibrant than Cardinal for moments that need urgency. |
| **Obsidian Black** | `#111827` | Primary text, headings, backgrounds of premium sections. The dark foundation. |
| **Administrative Gray** | `#8B0000` | Admin sidebar background. Deep wine-burgundy for elevated authority. |
| **Surgical White** | `#FFFFFF` | Page backgrounds, card surfaces. Pure and clinical. |
| **Whisper Gray** | `#F9FAFB` | Section backgrounds, input fields, skeleton loaders. Almost-white warmth. |
| **Graphite** | `#374151` | Body text, secondary information. Readable but recessive. |
| **Ash** | `#9CA3AF` | Labels, placeholders, metadata. Subordinate information. |
| **Amber Gold** | `#FBBF24` | Admin active states, star ratings, promotional accents. The luxury metal note. |
| **Success Green** | `#22C55E` | In-stock badges, success confirmations. Rare but meaningful. |

---

## 3. Typography Rules

**Primary Typeface:** `system-ui, sans-serif` — intentionally choosing the device's native sans for zero-latency rendering and native-quality rendering at all weights.

**Weight Philosophy:** The system uses exclusively **Black (900)** and **Normal (400)** — no in-between weights. This binary creates maximum visual contrast between hierarchy levels.

**Letter-spacing Character:**
- Headlines: `tracking-tighter` (−0.05em) — condensed slab energy, like stamped metal
- Labels / Badges: `tracking-[0.3em]` to `tracking-[0.5em]` — wide-spaced uppercase for luxury label feel
- Body: `tracking-normal` — comfortable reading rhythm

**Case Rules:** All UI labels, navigation, buttons, and badges are **UPPERCASE**. Body copy is sentence case. This binary communicates: *controls are commands, content is human*.

**Size Scale:** The hero uses `text-[9rem]` (144px+) at desktop — intentionally oversized to create wall-text energy. This is not a mistake, it is the aesthetic.

---

## 4. Component Stylings

**Buttons (Primary):**
Sharp-edged rectangles — `rounded-none` on hero CTAs, `rounded-xl` (generously curved, 12px radius) on functional admin buttons. Cardinal Red fill, white text at 10px font size with 0.3em letter-spacing. Hover: `brightness-110` lift + subtle shadow bloom. Active: `scale-95` press-down haptic feedback.

**Buttons (Secondary):**
Border-only style — 2px Obsidian Black border, transparent fill, black text. On hover: fill inverts to Obsidian. Creates a confident "ghost" presence without competing with Primary.

**Product Cards:**
No border radius on image container (full-bleed images). 3D tilt on mouse move using `rotateX/Y` perspective transform. Floating add-to-cart button appears from center on hover. Image desaturated 20% at rest, full color on hover. Category label in Cardinal Red at 9px tracks-wide.

**Cards / Containers (Admin):**
Sharp `rounded-sm` (2px radius) or none. White background, single-pixel `border-gray-100`. Shadow is `shadow-xl shadow-gray-100/50` — diffuse and barely perceptible. The luxury version of "floating."

**Inputs / Forms:**
Borderless with bottom-border-only (`border-b-2`) in light gray, focusing to Cardinal Red. Zero background. Text in `font-bold` black. This creates a "form cut into the surface" effect — editorial, not web-generic.

**Badges:**
Pill-shaped (`rounded-full`) for status indicators (In Stock, Sold Out). Sharp rectangular for product labels (Trending). Always UPPERCASE at 9px, maximum tracking.

**Drawers / Modals:**
Full-height side drawer (Cart, Wishlist). Backdrop blur (`backdrop-blur-sm`) with 50% black overlay. Slides in from right with spring easing. Header always Obsidian Black with white text for authority.

---

## 5. Layout Principles

**Whitespace Strategy:** Generous and structural. Section padding is `py-24` to `py-48` — space is treated as a premium material, not waste. The rule: if in doubt, add more space.

**Grid System:** Max-width `max-w-7xl` (1280px) centered. 12-column logic with responsive collapse to 1 and 2 column. Product grids use `grid-cols-4` on desktop with `gap-12 sm:gap-16` — wide gutters signal premium spacing.

**Hierarchy Method:** Size and weight carry all hierarchy — color is used sparingly as a *signal*, not a differentiator. A 9px uppercase label in Cardinal Red outranks a 14px black label in the visual hierarchy.

**Border-Left Pattern:** Active navigation states use `border-l-4 border-[#FBBF24]` — the gold left-border is a signature UI pattern communicating "you are here" with architectural authority.

**Section Rhythm:** Each section announces itself with a tiny 9px uppercase Cardinal Red label (`text-[9px] font-black uppercase tracking-[0.5em] text-[#ba1f3d]`) before the main headline — like a section divider in a luxury magazine.

---

## 6. Motion & Animation Principles

**Entrance:** Text elements use `translateY: [60px → 0]` with `opacity: [0 → 1]`, staggered by 100–150ms. Easing: `expo.out` (fast deceleration, like fabric settling).

**Hover:** Product cards tilt up to `±8deg` with `perspective: 1000px`. Buttons translate `−2px` on Y axis. All hover transitions `duration-300` to `duration-500`.

**Loading:** Progress bars fill with organic acceleration. Loaders are branded in Cardinal Red.

**Fabric Feel:** The hero 3D scene uses genuine cloth simulation — wind-driven vertex displacement on a planeGeometry creating the sensation of fabric in motion.

**Performance Rules:** All animations use `transform` and `opacity` only (GPU compositor properties). `will-change: transform, opacity` declared on frequently animated elements. No `top/left/width/height` animations.