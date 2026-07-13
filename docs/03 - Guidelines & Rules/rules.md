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

---

## 5. Testing & CI Pipeline Integrity

- **Database Separation**:
  - Standard unit tests (`src/test/*.test.js` except `idempotency.test.js`) must completely mock `mongoose` and run in parallel without connecting to a database.
  - Real database integration tests (like `idempotency.test.js`) must be run under the `integration-tests` job on CI, where MongoDB Replica Set services are running.
- **Replica Set Configuration**: Connections in tests and CI must use the `?replicaSet=rs0` URL parameter to validate transactions properly.
- **Clean CI Runs**: Ensure all ESLint warnings are fixed. The build pipeline will fail if warnings exceed threshold levels.
- **Touch-safe Playwright Specs**: E2E browser tests must run on compiled static production bundles (`npm run build` and `npm run test:e2e`). Utilize desaturated mock values and extended timeouts (60s) to handle database cold-starts.
