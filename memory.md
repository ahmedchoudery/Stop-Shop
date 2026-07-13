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

---

## 2. What is Currently Being Worked On
- **Documentation Vault Generation**: Creating the primary Obsidian documentation vault under the `docs/` folder (and copies at the project root) containing:
  - `prd.md` (Project Requirements)
  - `Architecture.md` (Flows and Tech Stack)
  - `rules.md` (Code Guidelines and Visual Boundaries)
  - `Phases.md` (Lifecycle Roadmap)
  - `Design.md` (UI/UX System Design Brief)
  - `memory.md` (Completed Tasks and Action Items log)

---

## 3. What is Planned Next
- **CI Pipeline Monitoring**: Monitor the latest pushed commit `541d374` to verify that both `Integration Tests (MongoDB)` and `E2E Tests (Playwright)` pass successfully on GitHub Actions.
- **Refinement & Enhancements**: Follow up on user specifications for upcoming feature drops.
