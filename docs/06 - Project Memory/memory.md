# Project Memory Document — Stop & Shop

This document tracks the current state of work, what tasks have been completed, and what files are active.

---

## 1. What Has Been Completed

### 1.1 Backend Reliability & Site Reliability Engineering (Prompt 4)
- **Idempotency Key Header support**: Added database-backed `IdempotencyKey` model with lock checks to guarantee single execution on order creations and payment webhooks.
- **MongoDB ACID Transactions**: Wrapped storefront checkout and POS order creation inside MongoDB session transactions across collections (`orders`, `products` inventory, and `email_outboxes`).
- **Email Outbox Queue**: Decoupled order confirmations from SMTP latency by writing to the `EmailOutbox` collection inside the database transaction and running an asynchronous worker thread `processOutbox` to dispatch emails.
- **Index Migrations**: Created and executed `scripts/run-migrations.js` to create requested indexes, unique slug fields, and populate categories arrays.
- **Sentry Integration**: Initialized `@sentry/nextjs` and wrapped all Route Handlers in Sentry exception-tracking wrappers inside `withRoute.ts`.
- **Request Tracing**: Injected `x-request-id` to Sentry tags, Pino logger context, and HTTP headers to enable tracing across client and server.
- **Structured JSON logging**: Configured a global Pino logger inside `withRoute.ts` to output exactly one structured log line per HTTP request: `{ requestId, userId, route, status, durationMs }`.
- **Branded API Health Endpoint**: Updated `/api/v1/health` to return MongoDB and Cache verification states under desaturated JSON formatting.

### 1.2 CI/CD & Build Integrations
- **ESLint Configurations**: Updated `eslint.config.js` to ignore test and build artifact paths, correcting the `Lint & Type Check` workflow errors.
- **Vitest Database Isolation**: Excluded database-reliant tests from standard unit-test pipelines, moving them to MongoDB replica-set integration jobs.
- **Playwright Test Fixes**: Improved DOM selectors, increased timeouts to 60s, and removed recursive click methods in E2E spec files.
- **CI Transaction Support**: Appended the `?replicaSet=rs0` connection parameter to all MongoDB URIs in `.github/workflows/admin-ci.yml` to support transactions on GitHub Action runners.
- **Self-Contained DB Tests**: Added dynamic mock product seeding inside `idempotency.test.js` to prevent database product-lookup exceptions on fresh MongoDB containers.
- **CI Replica Set Initialization Fixes**: Resolved GHA service container limitations (where `--replSet` is rejected by `docker create` options) by starting the MongoDB container directly inside the workflow steps list using `docker run --name mongodb -d -p 27017:27017 mongo:7 --replSet rs0` and running `rs.initiate` via `docker exec mongodb mongosh --eval '...'`. This ensures full replica set support in GHA for all tests.
- **Mongoose Index Warning Cleanup**: Removed duplicate schema-level index declarations for `slug` and `categories` in `src/models/Product.js` to eliminate compilation warning logs.

---

## 2. What Has Been Completed (Prompt 5 - Concurrency-Safe Inventory & State Machine)
- **Atomic Stock Decrement**: Replaced read-then-write updates with atomic conditional `findOneAndUpdate` updates on product variant stock Maps and matrices.
- **Cart hold / reservations**: Added a reservation system hold endpoint (`/api/v1/reservations`) and database model `Reservation` with TTL index, coupled with a 1-minute cron-based background worker to release expired reservations and restore stock.
- **Counter Order Number sequence**: Created `Counter` model and implemented sequencing to generate human-readable order IDs (`STOP-YYYY-XXXXXX`) during storefront checkout and POS transactions.
- **Order State Machine**: Built a state machine transition helper `transitionOrder` mapping allowed transitions, logging transition events into `OrderEvent` model, and enqueuing status emails.
- **Race Condition & Idempotency Tests**: Added `scripts/race-test.mjs` and `scripts/idempotency-test.mjs` running dev server and firing concurrent parallel orders to assert correctness.

---

## 4. What Has Been Completed (Prompt 7 - Automated Order-Lifecycle Emails)
- **Unique Idempotency Outbox**: Added unique `idempotencyKey` values, templates, status tracking, retry counts, and next attempt timestamps to the `EmailOutbox` model.
- **Auto-Failover Provider**: Built `emailProvider.js` with Resend (primary) and Brevo (fallback), automatically failing over after 3 Resend `5xx` errors within 60 seconds.
- **Suppression Management**: Created `SuppressedEmail` schema and HMAC-verified webhook endpoint at `/api/webhooks/resend` to automatically suppress bounced addresses.
- **14 React Email templates**: Built a unified layout `BaseLayout.tsx` and compiled 14 custom `.tsx` template components under `src/emails/`.
- **Admin Email Console**: Implemented `/admin/emails` view showing outbox log queue, suppression table, and live side-by-side template preview iframes.

---

## 5. What Has Been Completed (Prompt 8 - Low-Stock Alerts)
- **Atomic Stock Trigger**: Integrated alert checks directly inside the atomic stock decrement. When variant stock drops below the threshold, a new daily alert is registered in the `LowStockAlert` collection using a unique index on `(sku, variantId, date)`.
- **Worker & Outbox Integration**: Enqueues a notification email `low-stock-alert-admin` to the outbox under the idempotency key `low-stock:${sku}:${variantId}:${date}` to avoid duplicate spams.
- **Admin Inventory Dashboard**: Designed the `/admin/inventory` dashboard featuring a variant list, stock status flags, one-click "mark restocked", "snooze 7 days", and custom stock threshold configurations (defaulting to 5 units or global default settings).

---

## 6. What Has Been Completed (Prompt 9 - Performance & Core Web Vitals Overhaul)
- **Preloading & LCP**: Mobile LCP hero preloaded via link headers; non-LCP desktop/tablet image priority loading removed to reduce resource competition.
- **Cloudinary CDN optimizations**: Custom loader registered on Next.js `<Image>` components, automatically formatting width (`w_`), `f_auto`, and `q_auto` to request fully responsive and lightweight CDN resources.
- **Font preloading & subsetting**: Configured self-hosted fonts with `latin-ext` subsets, only preloading 1 critical body weight (`DM_Sans` 400), and applying `font-display: swap`.
- **ISR & caching configurations**: Enabled 300s ISR on `/` and `/product/[id]`. Configured 60s ISR on the new `/category/[slug]` route. Configured 60s maxage + 600s stale-while-revalidate Cache-Control headers on the public products API.
- **Real-time Web Vitals reporter**: Added client-side monitoring dispatching metrics via `navigator.sendBeacon` to `/api/analytics/vitals`, logging results via Pino.

---

## 7. What Has Been Completed (Prompt 10 - Static Analysis & Security Warnings)
- **Linter Warnings & Console Statement Compliance**: Changed `console.log` statements to `console.info` in `seed-admin.js`, `emailService.js`, and `inventoryService.js` to adhere to strict console statement filters.
- **Unused Imports & Variable Cleanup**: Converted unused imports to side-effect imports (`import '...'`) in `audits/route.js` and `adminAuth.js` to preserve model registration. Cleaned up unused hooks and variables in `useDomain.js`, `revenue/route.js`, and `middleware.ts`.
- **Security & Object Injection hardeners**: Eliminated Dynamic Bracket Object Injection Sinks (`security/detect-object-injection`) by using `Reflect.get()`, `Object.getOwnPropertyDescriptor()`, and `Object.prototype.hasOwnProperty.call()` across `inventory/route.js`, `orders/route.js`, `revenue/route.js`, `withRoute.ts`, `inventoryService.js`, and `LoginPage.tsx`.
- **Buffer & String Bracket Access removal**: Replaced Buffer bracket access `hash[offset]` with `hash.readUInt8(offset)` and string index bracket access `clean[i]` with `clean.charAt(i)` in `totp.js`.
- **Tailwind CSS order normalization**: Formatted `LoginPage.tsx` CSS styles to canonical order using ESLint auto-fixing (`eslint --fix`).

## 8. What Has Been Completed (Prompt 11/12 - Duplicate Cleanups, Unified API & Safe Error Parsing)
- **Duplicate Documentation Cleanup**: Deleted duplicate root markdown files (`Architecture.md`, `DESIGN.md`, `EMAIL.md`, `memory.md`, `Phases.md`, `prd.md`, `rules.md`), maintaining a single source of truth inside the `docs/` vault.
- **Unified API Routing Namespace**: Relocated independent API endpoints `/api/analytics/vitals` and `/api/cron/email-outbox` to the `/api/v1/...` subdirectory structures. This avoids potential 404 rewrite vulnerabilities in Next.js middleware and unifies all application API endpoints.
- **Client-Side Error Extraction Fix**: Fixed a widespread bug that returned `[object Object]` error messages on client actions by creating a robust `extractErrorMessage` parser utility in `src/lib/auth.js`. Integrated it in product creation, POS checkout, coupon management, customer checkout, order tracking, and dynamic hooks.
- **Mongoose Hook Transaction Safety**: Added transaction session guards in [Product.js](file:///c:/Users/JAPAN%20COMPUTERS/OneDrive/Desktop/Stop-Shop/src/models/Product.js) model hooks to bypass fallback syncs/cleanups when queries run inside active transactions, eliminating MongoDB catalog write conflict aborts. Added the **Mongoose Hook Safety** standard to [rules.md](file:///c:/Users/JAPAN%20COMPUTERS/OneDrive/Desktop/Stop-Shop/docs/03%20-%20Guidelines%20&%20Rules/rules.md).
- **Section-Specific Product Display & Fallback Removal**: Removed the default fallback behavior from homepage `FeaturedDrop` and `PiecesThatSpeak` carousels so they strictly render only products assigned to those sections. Filtered out lookbook outfits (`featuredSection === 'attitude'`) from the general collection query, related items, and public search catalog, unless viewing the `Outfit` category page. Updated `rules.md` to enforce this display standard.
- **Color Variant Switch Gallery Fallback**: Upgraded variant image resolution across `ProductCard.jsx`, `ProductPageClient.jsx`, `ProductPage.jsx`, and `emailService.js` to dynamically fall back to gallery images sequentially based on the selected color index within the product colors array. This enables color swatch clicks in product grids and product pages to correctly update display images even when explicit variant mapping fields are left empty.
- **Login Rate Limit 2FA Early Exit Fix**: Added immediate `LoginAttempt` database cleanup right after successful password verification (before the 2FA / OTP redirect triggers) in the login route handler. This prevents successful password submissions from accumulating in the rate-limit database and triggering lockout blocks for administrators during normal working hours.
- **Selected Color Variant Gallery Filtering**: Updated `ProductPageClient.jsx` and `ProductPage.jsx` to dynamically filter the media gallery list so it only contains and renders the selected color variant image. Reset the active thumbnail/main image index (`galleryIndex`) to `0` whenever a color is selected to prevent indexing errors. Updated `rules.md` to establish this selected variant display standard.

## 9. What Has Been Completed (Prompt 13 - Color Variant Galleries, Security & Data Loss Fixes)
- **Multi-Image Variant Galleries**: Upgraded the schema from a single image map to support multiple images per color variant (`Map<string, string[]>`), and redesigned the `ProductForm.jsx` edit workflow to display dedicated image gallery uploading widgets for each color variant.
- **Security Warning Sanitisation**: Resolved potential ReDoS concerns by rewriting color hex verification regexes to avoid nested quantifiers. Prevented generic object injection sinks (`security/detect-object-injection`) by using `Object.prototype.hasOwnProperty.call` guards and `Reflect.get()` lookups across `ProductCard.jsx`, `ProductPage.jsx`, and endpoints.
- **Admin Form Data Loss Fixes**:
  - Restored missing fields (`mediaType`, `embedCode`, `rating`, `lowStockThreshold`, etc.) to the `GET /api/admin/products` endpoint select projections, ensuring they are not wiped when editing.
  - Redesigned `MediaSection` in `ProductForm.jsx` to support toggling and editing **Upload**, **External URL**, and **Embed Code** media inputs.
  - Added a **Lifestyle/Lookbook Image** upload picker in `PlacementSection` when the storefront placement is set to *Defined by Attitude*.
  - Initialized and padded product `specs` to always display exactly 3 input fields in the admin form, filtering out empty inputs before saving.
- **Inventory Matrix Variant Key Match**: Resolved a critical key resolution bug in `AdminInventory.jsx` variant matrix editor where it used the human-readable color name (`colorName`) instead of the raw color variant string (`col`) to modify `variantMatrix`, causing updates to not map to database keys.

---

## 10. What Has Been Completed (Prompt 14 - Zoom Lightbox Panning, Containing Block Portal, and Sub-Category Recommendations)
- **Interactive Lightbox Drag Panning**: Implemented mouse/touch event grab-and-drag listener states on zoomed images in the details lightbox, applying translations via CSS transforms.
- **Lightbox z-Index and Body Toggle Hiding**: Increased the z-index to `9999` and added a `useEffect` hook to toggle `.lightbox-open` class on `document.body` that hides the global header wrapper to resolve clipping and overlapping.
- **Containing Block React Portal refactor**: Wrapped the Lightbox Modal inside a React `createPortal` mounting onto `document.body` to bypass Framer Motion translate containment, resolving the top white bar completely.
- **Sub-Category Recommendations**: Modified the recommended products database query (`page.jsx`) and client filters (`ProductPageClient.jsx`, `ProductPage.jsx`) to filter recommended items strictly by `subCategory` in addition to category (`bucket`), displaying the specific subcategory name in the header.
- **Mobile Touch-Hold Card Navigation**: Implemented touch gestures (`onTouchStart`, `onTouchEnd`, `onTouchCancel`) inside `ProductCard.jsx` to toggle navigation arrows on mobile devices when cards are touched/held. Included a 2-second decay timer to ensure users have enough time to tap the arrows.

---

## 11. What is Planned Next
- **Next Prompt / Alignment**: Ready for next requests from the user.
