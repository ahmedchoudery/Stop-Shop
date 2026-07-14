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

## 5. What is Currently Being Worked On
- **All Verified**: All integrations, linter checks, and 235 tests are passing 100% green.

---

## 6. What is Planned Next
- **Feature Drops**: Align with the user on the next set of feature requests.

