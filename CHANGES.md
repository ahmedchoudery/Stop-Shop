# Stop & Shop — Refactored Codebase

## Skills Applied

| Skill | Files Affected |
|-------|---------------|
| **javascript-pro** | server.js, auth.js, api.js, all hooks |
| **javascript-mastery** | All JS files (const, optional chaining, `??`) |
| **nodejs-best-practices** | server.js, cacheService.js, auditService.js, middleware |
| **react-patterns** | CartContext, WishlistContext, all pages |
| **react-ui-patterns** | ErrorBoundary, DashboardHome, LoginPage, CheckoutPage |
| **nextjs-best-practices** | web-app-next/app/admin/page.jsx, products/[slug]/page.js |
| **typescript-expert** | src/types/index.ts, JSDoc throughout |

---

## New Files Created

```
src/
├── types/
│   └── index.ts              ← Branded types, discriminated unions, all interfaces
├── hooks/
│   ├── useAsync.js           ← Race-condition-safe async state hook
│   ├── useDomain.js          ← Products, orders, stats, settings, users hooks
│   └── useUtils.js           ← debounce, localStorage, intersection observer, etc.
├── services/
│   └── supabaseService.js    ← Storage, analytics, realtime, reviews
├── components/
│   └── ErrorBoundary.jsx     ← ErrorBoundary class + AsyncContent + ErrorState
└── .claude/
    └── settings.json         ← Supabase MCP server config
```

---

## Key Improvements Per File

### `server.js`
- Custom error classes (`AppError`, `AuthenticationError`, etc.)
- `requireRole()` middleware for RBAC
- Centralized error handler with proper status codes
- `sendEmail()` never throws — fire-and-forget
- `getOrSet()` cache-aside pattern everywhere
- `Promise.allSettled()` for graceful shutdown
- Separate rate limiter for checkout (stricter)
- Logout endpoint added

### `src/context/CartContext.jsx`
- Converted from `useState` to `useReducer` (pure reducer)
- All action types frozen as constants
- Stable `useCallback` on every action creator
- `useMemo` on context value to prevent unnecessary re-renders

### `src/lib/auth.js`
- `adminLogin()` function with user-friendly error mapping
- `handleAuthError()` uses `window.location.replace()` (no back-button to protected page)
- Token stored in both cookie and localStorage for resilience

### `src/schemas/validation.js`
- Type inference via `z.infer<typeof schema>`
- `validateRequest()` returns structured `{ field, message }` error arrays
- All schemas exported with JSDoc types

### `src/services/cacheService.js`
- TTL config map (per-key TTLs)
- `getOrSet()` cache-aside pattern
- `invalidateMany()` uses `Promise.allSettled()`
- Exponential backoff retry strategy
- Graceful degradation if Redis is down

### `src/components/ErrorBoundary.jsx`
- Class-based `ErrorBoundary` with `getDerivedStateFromError`
- `AsyncContent` component enforces react-ui-patterns rules:
  - Error shown first
  - Loading only when `!data`
  - Empty state for arrays

### `src/pages/LoginPage.jsx`
- Button disabled during loading (react-ui-patterns rule)
- Post-login redirect to intended URL (`location.state.from`)
- Field-level + global error display
- Password show/hide toggle

---

## Supabase MCP Setup

### Step 1: Add MCP Server
```bash
# In your project root terminal:
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=tvvatsvudsxsyejlgvhl"
```

### Step 2: Authenticate
```bash
# In a regular terminal (not inside Claude):
claude /mcp
```
This opens OAuth — sign in with your Supabase account.

### Step 3: Install Supabase client
```bash
npm install @supabase/supabase-js
```

### Step 4: Add environment variables
```bash
# .env
SUPABASE_URL=https://tvvatsvudsxsyejlgvhl.supabase.co
SUPABASE_ANON_KEY=your_anon_key_from_supabase_dashboard
SUPABASE_SERVICE_KEY=your_service_role_key  # Server only!
NEXT_PUBLIC_SUPABASE_URL=https://tvvatsvudsxsyejlgvhl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Step 5: Create Supabase tables (run in Supabase SQL editor)
```sql
-- Analytics events
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  product_id TEXT,
  order_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter subscribers
CREATE TABLE newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product reviews
CREATE TABLE product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);
```

---

## Usage: New Hooks

```jsx
// OLD (manual fetch in component)
useEffect(() => {
  fetch('/api/admin/products')
    .then(r => r.json())
    .then(setProducts);
}, []);

// NEW (domain hook)
import { useProducts } from '../hooks/useDomain.js';
const { products, loading, error, createProduct, updateProduct, deleteProduct } = useProducts();
```

```jsx
// OLD (localStorage directly in context)
const saved = localStorage.getItem('key');

// NEW (custom hook with SSR safety)
import { useLocalStorage } from '../hooks/useUtils.js';
const [value, setValue, removeValue] = useLocalStorage('key', defaultValue);
```

```jsx
// OLD (no race condition protection)
const [loading, setLoading] = useState(false);
useEffect(() => {
  setLoading(true);
  fetchData().then(setData).finally(() => setLoading(false));
}, []);

// NEW (race condition safe, loading only when !data)
import { useAsync } from '../hooks/useAsync.js';
const [{ data, loading, error }, { execute }] = useAsync(fetchData, { initialData: [] });
```

---

## What Makes This Stand Out

1. **Zero loading flash** — `AsyncContent` shows spinner only when `loading && !data`
2. **Race conditions eliminated** — `useAsync` ignores stale responses via call ID counter
3. **Predictable cart state** — pure reducer, every change traceable in React DevTools
4. **Branded TypeScript types** — can't accidentally pass `OrderId` where `ProductId` expected
5. **Cache-aside everywhere** — `getOrSet()` reduces DB load without complexity
6. **Supabase storage** — product images on CDN instead of base64 in MongoDB
7. **Realtime dashboard** — `subscribeToOrders()` gives live order notifications
8. **Audit trail** — never throws, never breaks operations
9. **Security layered** — sanitization + Zod validation + JWT + CSRF = 4 layers
10. **Graceful shutdown** — `Promise.allSettled()` closes DB + Redis + HTTP in parallel