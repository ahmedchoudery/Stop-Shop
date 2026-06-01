## Summary
Port administrative Express endpoints (admin/customer) into Next.js API Route Handlers

## Environment
- **Product/Service**: Stop-Shop Full-Stack Architecture
- **Version**: Next.js 14+ App Router

## Goal Description
1. Review all administrative endpoints currently defined in `src/routes/admin.js` and `src/routes/customer.js` (Express).
2. Map their Mongoose repository queries and business logic into individual files inside `/src/app/api/admin/` and `/src/app/api/customer/`.
3. Shift authorization checks (`role: 'admin'`) and JWT authentication decoding from Express middleware to Next.js middleware or inline route verification helpers.
4. Update `next.config.js` to eliminate backend port rewrites once the endpoints are natively handled by Next.js.

## Expected Behavior
All administrative actions (inventory tracking, review moderation, analytical graphs, coupon management) resolve natively under the unified Next.js server runtime, eliminating the parallel Express `server.js` service completely in production.

## Impact
**Medium** - Streamlines production hosting, reduces docker/container footprint, shrinks deployment to a single unified Next.js process on Vercel/Railway, and leverages native Next.js scaling.

## Additional Context
Storefront public API routes have already been successfully migrated and verified under `/src/app/api/public/` with fully validated database connectivity models.
