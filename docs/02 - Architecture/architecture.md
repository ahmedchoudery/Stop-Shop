# App Flow & Architecture Document — Stop & Shop

## 1. System & Tech Stack Overview
Stop & Shop is built on a hybrid architecture designed to optimize page load speeds (using server-side rendering for catalog grids) while maintaining highly interactive dashboard panels for administrators and customer accounts.

- **Frontend Core**: Next.js 14.2 (App Router & Route Handlers), React 18.
- **Client Routing**: Native Next.js file-based routing for public storefront URLs; dynamic client-side `react-router-dom` (Single Page Application Router) nested within Next.js shells under `/admin` and `/account`.
- **Database**: MongoDB (Mongoose ODM) configured as a replica set to allow distributed multi-document ACID transactions.
- **Styling**: Vanilla CSS for typographic editorial styling, combined with Tailwind CSS (v3) for layout grid components.
- **UI & Component System**: Ant Design (v6) initialized with primary desaturated charcoal theme tokens.
- **Animation System**: framer-motion (for hardware-accelerated transitions) + anime.js + GSAP.
- **Telemetry & Tracing**: Sentry (Next.js client/server SDK) + Pino (Structured JSON logging stdout).
- **Email Delivery**: Nodemailer (SMTP) or Resend API backing the Email Outbox processing worker.

---

## 2. Directory Layout & Structure

```
Stop-Shop/
├── .github/workflows/       # GitHub Actions CI configurations (Vitest & Playwright)
├── docs/                    # Obsidian Documentation Vault
├── playwright-tests/        # End-to-End browser test files
├── public/                  # Static assets (images, logos)
├── scripts/                 # Utility scripts (database seeding, index migrations)
└── src/
    ├── app/                 # Next.js Pages, Routing & Route Handlers (API v1)
    │   ├── api/             # Next.js Route Handlers
    │   │   ├── admin/       # Admin console actions
    │   │   ├── v1/          # Public and customer API routes
    │   │   └── webhooks/    # Third-party webhook endpoints
    │   ├── account/         # Customer account views (React Router bound)
    │   ├── admin/           # Admin portal views (React Router bound)
    │   ├── checkout/        # Native Next.js checkout view
    │   ├── product/         # Native Next.js Product detail view
    │   ├── App.jsx          # React Router SPA routes definitions
    │   ├── layout.jsx       # Next.js Root Layout
    │   └── providers.jsx    # React context & AntD ConfigProviders wrapper
    ├── components/          # Reusable UI components (CheckoutForm, Cart, etc.)
    ├── context/             # Global state providers (Cart, Wishlist, Customer, etc.)
    ├── hooks/               # Custom React hooks (useCurrency, useCart, etc.)
    ├── layout/              # Universal site wrappers (Header, Footer, Drawers)
    ├── lib/                 # Core server libraries (db, mongoose, Sentry, withRoute)
    ├── models/              # Mongoose database schemas and collection hooks
    ├── schemas/             # Input verification schemas (Zod validators)
    ├── services/            # Background processes (EmailOutbox, inventory syncing)
    ├── styles/              # Global custom CSS rules (index.css)
    ├── test/                # Unit & integration test files (Vitest)
    ├── utils/               # Common helper utilities (idempotency, logger)
    └── views/               # Page views rendered by Next.js routes
```

---

## 3. Data Flow & Transaction Mechanics

### 3.1 Checkout Request Pipeline
The diagram below details the data flow and boundary checks during order creation:

```
[User Browser]
      │
      ▼  (POST /api/v1/checkout)
[Edge Middleware]  ──► [1] Check Rate Limit (Redis / Local fallback)
      │            ──► [2] CSRF Token Match Check
      │            ──► [3] Inject x-request-id & Secure CSP Nonce
      ▼
[withRoute Wrapper] ──► [4] Establish Database Connection (dbConnect)
      │             ──► [5] Authenticate Token (Admin/Staff/Customer/Public)
      │             ──► [6] Run safeParse Zod Validation on Request Body
      ▼
[Handler Controller] ──► [7] Check & Lock Idempotency Key (idempotency_keys collection)
      │              ──► [8] Initialize MongoDB Transaction Session (withTransaction)
      │                    ├── Validate stock availability (Product.sizeStock / colorStock)
      │                    ├── Apply Coupon codes & increment usage counts
      │                    ├── Create Order record (orders collection)
      │                    ├── Decrement variant stock counts (products collection)
      │                    └── Queue notification log (email_outboxes collection)
      │              ──► [9] Release Lock & Commit Transaction
      ▼
[Response Output] ──► [10] Return JSON order details + x-request-id header
```

### 3.2 Background Outbox Worker Flow
To decouple API response times from third-party email latency, order confirmation notifications follow the outbox pattern:

```
[Mongoose Checkout Transaction]
      │
      ▼ (Atomically inserts log)
[email_outboxes collection] (status: "pending")
      │
      ▼ (Background event loop checks database every 5 seconds)
[processOutbox Worker]
      │
      ├─► Lock Outbox log (status: "processing")
      ├─► Dispatch SMTP / Resend API Mail request
      │     ├── SUCCESS: Mark log as "sent"
      │     └── FAILURE: Increment retryCount (Max 5, exponentially backs off)
      ▼
[Sent Email]
```

---

## 4. Inventory Reservations & Order State Machine

### 4.1 Low Stock Cart Holds (Low Inventory Reservations)
- To prevent cart hoarding and overselling under concurrent checkout races, product variants with stock level `≤ 10` are held atomically when added to the cart or incremented in quantity.
- The `POST /api/v1/reservations` endpoint reserves stock immediately by decrementing variant inventory and inserting a `Reservation` document `{ sku, productId, variantId, qty, userId, expiresAt }`.
- A 1-minute background interval cron runs `releaseExpiredReservations` to release any expired holds (based on `expiresAt` TTL) and restores variant stock atomically.
- Upon successful checkout, reservation holds are fully cleared without re-incrementing stock.

### 4.2 Custom Order Sequences
- Instead of using non-sequential timestamps or randomized order IDs, Stop & Shop implements atomic sequence generation via a dedicated `Counter` model.
- The format matches: `STOP-YYYY-000001` (where `YYYY` is the current year and the sequence is padded to six digits).

### 4.3 Order State Machine Transitions
- States are transitioned via the `transitionOrder` helper inside [state.ts](file:///C:/Users/JAPAN%20COMPUTERS/OneDrive/Desktop/Stop-Shop/src/lib/orders/state.ts).
- Valid transitions are enforced via the `ALLOWED_TRANSITIONS` map:
  - `Pending` ──► `Paid`, `Failed`, `Cancelled`, `Confirmed`, `Processing`
  - `Paid` ──► `Confirmed`, `Processing`, `Cancelled`
  - `Confirmed` ──► `Shipped`, `Cancelled`
  - `Processing` ──► `Shipped`, `Cancelled`
  - `Shipped` ──► `Delivered`, `Returned`, `Partially Returned`
  - `Delivered` ──► `Refunded`, `Returned`, `Partially Returned`
- Transitions log audit trace events to `OrderEvent` collection and enqueue branded status update emails via the email outbox.
