# Coding Standards & AI Guidelines — Stop & Shop

This document serves as the source of truth for coding standards, libraries allowed, error handling practices, and visual boundary conditions for Stop & Shop. All AI tools and developers must adhere to these rules.

---

## 1. Allowed Tech Stack & Core Libraries

### 1.1 Backend & Utilities
- **Next.js Route Handlers**: Standard method for APIs.
- **ORM**: Mongoose (`mongoose`). Never write raw MongoDB driver queries unless performing low-level operations.
- **Validation**: Zod (`zod`) schemas are mandatory for all POST/PUT body and GET query inputs.
- **Logging**: Pino (`pino` and `@/utils/logger.js`) is the standard logger. Never use `console.log` in production-facing API handlers.
- **Telemetry**: Sentry (`@sentry/nextjs`). Route handlers must be wrapped in Sentry scopes using the global `withRoute` middleware.

### 1.2 Frontend & Animation
- **Component Styling**: Ant Design (v6) component library, styled via global `ConfigProvider` tokens.
- **Custom layouts**: Tailwind CSS (v3) utility classes for simple grids, paired with custom vanilla CSS (`src/styles/index.css`) for fine editorial details.
- **Motion**: framer-motion (standard for React components) or GSAP (for 3D or timeline parallax animations).

---

## 2. API & Route Handler Constraints

- **Mandatory Wrapper**: All Next.js route handlers must be defined via the global `withRoute` utility in `src/lib/api/withRoute.ts`.
  ```typescript
  export const POST = withRoute({
    requiredRole: 'public',
    schema: { body: checkoutSchema },
    handler: async ({ req, body, user, requestId }) => {
      // route logic here
    }
  });
  ```
- **Authentication**: Route configurations must specify `requiredRole`: `'admin' | 'staff' | 'customer' | 'public'`. Authentication checks, JWT decodes, and database connections are automatically executed inside the wrapper.
- **Error Formatting**: Never return raw custom Error responses. Always throw `ApiError(code, message, status, details)` to standardise responses.
- **JSON Request Logging**: The global `withRoute` wrapper logs exactly one pino log line per request containing:
  `{ requestId, userId, route, status, durationMs }`. Do not add secondary console logging for request timings.

---

## 3. Database & Transaction Boundary Rules

- **ACID Transactions**: Every checkout operation, stock modification, inventory balance change, or coupon redemption must run within a session transaction (`session.withTransaction(...)`).
- **Index Definitions**: Every collection index must be defined in the schema model file and executed inside database migration scripts.
- **Case-Insensitive Collation**: Customer and admin authentication email searches must configure case-insensitive collations:
  `{ email: 1 }, { collation: { locale: 'en', strength: 2 }, unique: true }`.
- **Dual-Write Safety**: Do not trigger mail SMTP calls inside transaction blocks. Write to the `EmailOutbox` collection instead, letting the outbox worker pick up and execute mail processing asynchronously.
- **Mongoose Hook Safety**: Post-save/delete model hooks (`post('save')`, `post('findOneAndDelete')`, etc.) must check for active transaction sessions (`doc.$session()` or `this.options?.session`) and skip fallback queries if a session is present. This prevents concurrent out-of-transaction database writes from triggering write conflicts and aborting active transactions.

---

## 4. UI/UX Visual Boundary Rules

- **Minimalist Aesthetic**: Maintain a desaturated, high-contrast bone-and-charcoal editorial layout. Saturated colors are banned except for the desaturated brand crimson highlight (`#BA1F3D`).
- **Corner Radii Constraints**:
  - `radius-none` (`0px`) - Default for banners, headers, footers.
  - `radius-sm` (`2px`) - Small tags.
  - `radius-md` (`4px`) - The project standard for buttons, input boxes, and card components.
  - Never exceed `radius-lg` (`8px`) or use arbitrary values like `rounded-xl` or `rounded-2xl`.
- **Typography Consistency**:
  - Headings & Banners: Playfair Display (Serif).
  - Body & Form labels: DM Sans / SF Pro Display (Sans-Serif).
  - Order numbers, transaction records, currencies, metadata: Monospace (Geist Mono).
- **No Placeholders**: Never write mock products, default layouts, or placeholder URLs in source files. Maintain realistic fashion metadata.
- **Section-Specific Product Display**:
  - Products must only display in the section(s) explicitly assigned by the admin (no fallback to general catalog lists inside section carousels like `Featured Drop` or `Pieces That Speak`).
  - Lookbook outfits (`featuredSection === 'attitude'`) must be excluded from the general collection lists, catalog pages, related items, and search results, unless the user explicitly filters by the `Outfit` category.
- **Variant Image Fallback Standard**: Color variant swatches on product cards and product pages must resolve images by checking the explicit `variantImages` map first, and then sequentially falling back to the `gallery` array based on the index position of the selected color within the `colors` array (where index 0 matches the main product image and index `i > 0` matches `gallery[i - 1]`). This guarantees that variant switching remains fully functional even if explicit image URLs are blank.
- **Selected Color Variant Display**: On product details pages, only the image(s) corresponding to the selected color variant should be rendered in the media gallery grid. The main gallery must dynamically switch to a single-image array containing only the selected variant image (or fall back to displaying the full default catalog set only if no variant image is resolved).
- **Variant Matrix Key Parity**: The keys in `variantMatrix` and related stock maps must always use the raw color identifier (e.g. `#FF0000|Red|M` which includes the hex color prefix) instead of the human-readable name (`Red|M`) to ensure consistency across the checkout, inventory panel, database, and client product details.
- **Editorial/Lookbook Media Uploads**: Admin interfaces must provide dedicated image upload pickers for Lookbook/Lifestyle images when products are mapped to the *Defined by Attitude* storefront strip, and support tabbed selection for different product media formats (direct upload, external image/video URLs, or customizable video embed frames).
- **Sub-Category Recommendations**: Recommended product sections on details pages must strictly filter products matching the current product's `bucket` (category) AND `subCategory`. The section header must dynamically reflect this subcategory name (e.g., "From Polos"). No generic fallback categories should be displayed.
- **Mobile Touch-Hold Card Navigation**: Product cards in mobile views must support dynamic touch-hold state transitions (`onTouchStart` and `onTouchEnd` callbacks). When a user presses/holds a card, the image slide navigation arrows must become visible immediately, remaining visible for 2 seconds after touch release to enable easy variant image switching on touch screens. Stop event propagation on arrow buttons to prevent routing clicks.
- **Featured Section Isolation**: The public featured products API must strictly filter items using the incoming `section` query parameter (e.g., `?section=pieces`). Cache keys for featured sections must be isolated per-section (e.g., `public:products_featured_pieces`) and automatically invalidated alongside `public:products` on product updates using wildcard prefix-matched keys to avoid layout leakage. Override global next.config.js headers in Route Handlers by returning explicit `no-store, no-cache, must-revalidate` `Cache-Control` response headers to prevent CDN/Edge nodes from serving stale products, and trigger Next.js `revalidatePath('/')` on write endpoints (POST, PATCH, DELETE) to refresh static page caches.
- **Storefront Placement & Routing Rules**:
  - Products placed in *Pieces that speak for themselves* must display in both the *Pieces* section carousel and the main *Collection* catalog grid.
  - Products placed in *The drop you've been waiting for* must display in both *The drop* section carousel and the main *Collection* catalog grid.
  - Products placed in *Defined by Attitude* must display in the *Defined by Attitude* editorial strip ONLY.
  - Products placed in *Collection* must display in the *Collection* catalog grid ONLY.
- **Pieces That Speak Carousel Card Style (`PiecesCard`)**:
  - The card features a distinct light editorial theme: a warm cream background (`bg-[#FAF9F6]`), subtle gray border (`border-gray-150/70`), and inner container padding (`p-4`).
  - Typography must match the original editorial look: category/sub-category on the left, star ratings (`★★★★★`) on the right, bold uppercase serif product title below, and spacious price.
  - Color swatches are styled in the original shape/size (`w-3.5 h-3.5 rounded-[4px]`) and positioned on a dedicated row below the price to avoid layout clutter, leaving enough space for up to **6 colors** cleanly.
  - Product photo switching arrows appear overlaying the image on laptop hover or mobile touch-hold.
- **The Drop You've Been Waiting For Card Style (`CarouselCard`)**:
  - Keeps its distinct existing dark theme layout (black-tinted background, white text typography, large background numbered indices `01`, `02`).
  - Incorporates the exact same layout functionality as the Pieces card: photo-switching navigation arrows on laptop hover / mobile touch-hold, and a dedicated bottom row showing up to **6 color swatches** of size `w-3.5 h-3.5 rounded-[4px]`.
  - Employs the transparent equal-height placeholder spacer to ensure all cards remain exactly aligned in height.
- **Collection Section Card Style (`ProductCard`)**:
  - Remains a flat, transparent/borderless card flush with the main catalog grid.
  - Color swatches must be styled at the original size (`w-3.5 h-3.5 rounded-[4px]`) and positioned next to the price in the footer, with extra space allowed to prevent layout collisions.
- **Jeans & Footwear Size Presets**: The admin dashboard product form must present numeric size preset pills:
  - Waist sizes (`28`, `30`, `32`, `34`, `36`, `38`) when `subCategory === 'Jeans'`.
  - Shoe/Slipper sizes (`7`, `8`, `9`, `10`, `11`) when `subCategory === 'Shoes' || subCategory === 'Slippers'`.
  - Otherwise, standard alphabet-based variants (`XS`, `S`, `M`, `L`, `XL`, `XXL`).
- **Diagonal Sold-out Badges**: Out-of-stock sizes and colors on the product detail client page must render with a visual diagonal red strikethrough SVG badge overlay (`stroke="#BA1F3D"` or `#a41f22`) to indicate sold-out availability, without changing the circular/box shape border.
- **Restock Notification Modal & Auto-Selection**: A dedicated "Notify when Available" button (background `#a41f22`, white text) must render under "Add to Bag" if any variant is out of stock. When clicked, it opens a portal-mounted modal. If only one size is out of stock, it must be automatically pre-selected in the modal state (`notifySize`); if only one color is out of stock, it must be automatically pre-selected in the modal state (`notifyColor`), preventing empty strings from being submitted for single out-of-stock items.
- **Immediate Restock Email Trigger**: Restock waitlist matches must be evaluated immediately inside the database inventory sync hook (`syncInventory`) when stock increases. The system must pre-render the JSX restock notification email template and dispatch it instantly to the customer's inbox, updating the notification record to `notified: true`. Product matching queries must check both the SKU (`id` string) and Mongoose `_id` string to prevent ID representation mismatches.


---

## 5. Testing & CI Pipeline Integrity

- **Database Separation**:
  - Standard unit tests (`src/test/*.test.js` except `idempotency.test.js`) must completely mock `mongoose` and run in parallel without connecting to a database.
  - Real database integration tests (like `idempotency.test.js`) must be run under the `integration-tests` job on CI, where MongoDB Replica Set services are running.
- **Replica Set Configuration**: Connections in tests and CI must use the `?replicaSet=rs0` URL parameter to validate transactions properly.
- **Clean CI Runs**: Ensure all ESLint warnings are fixed. The build pipeline will fail if warnings exceed threshold levels.
- **Touch-safe Playwright Specs**: E2E browser tests must run on compiled static production bundles (`npm run build` and `npm run test:e2e`). Utilize desaturated mock values and extended timeouts (60s) to handle database cold-starts.
