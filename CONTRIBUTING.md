# Contributing Guidelines (CONTRIBUTING.md)

Welcome to **Stop & Shop** development! To maintain code quality, please adhere to the following workflow guidelines:

## Code Quality Standards

1. **TypeScript Strictness**: 
   - All new features must be written in strict TypeScript (`.ts` or `.tsx` extension).
   - Resolve all unused variables and parameters.
2. **Linting Rules**:
   - Run `npm run lint` before committing.
   - Maintain sorted Tailwind class orders (`tailwindcss/classnames-order`).
3. **Tests**:
   - All calculations, utility helpers, and APIs must have corresponding unit tests under `src/test/`.
   - Run the test suite: `npm run test` (Vitest).
   - Ensure E2E tests are updated for checkout flows.

## Development Workflow

1. **Branching**: Create descriptive branch names from `main` (e.g. `feat/payment-ux` or `fix/sitemap-indexing`).
2. **Local Environment**:
   - Create a local copy of `.env` based on the environment template.
   - Run development server: `npm run dev`.
3. **Pull Requests**:
   - Pull requests will run CI pipelines verifying builds, lint, and tests.
   - PR builds must pass without warning failures before merge.
