Phase 1.2 Admin: Quick Start Guide

What’s included
- Admin UI with: View Orders, Bulk Import, Bulk Delete, and per-product stock editing
- Backend admin API endpoints for CRUD, bulk import, and order management
- Client-side UI wired to admin API with token-based auth MVP

Local run steps
1) Launch admin API:
   node web-app-next/railway-admin-api/server.js
   (default port 5001)
2) Launch cart API:
   node web-app-next/railway-cart-api/server.js
   (default port 5000)
3) Launch frontend:
   cd web-app-next
   npm install
   NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:5001 NEXT_PUBLIC_CART_API_BASE=http://localhost:5000 npm run dev
4) Navigate to http://localhost:3000/admin and login:
   Username: admin
   Password: admin123

Important endpoints (admin API)
- POST /api/login
- GET /api/products
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id
- POST /api/products/bulk
- POST /api/products/bulk-delete
- GET /api/orders
- PUT /api/orders/:orderId
- PUT /api/products/:id/sizeStock

Endpoints (upstream cart API bridge)
- POST /cart/add
- GET /cart/:cartId
- POST /cart/update
- DELETE /cart/:cartId/:cartItemId
- POST /checkout

Data persistence
- MVP uses JSON files; plan migration to a real DB later.

Notes
- The auth token is a MVP; for production, implement robust RBAC and session management.
- CSV bulk imports expect a reasonable header schema; refer to the admin UI for accepted fields.
