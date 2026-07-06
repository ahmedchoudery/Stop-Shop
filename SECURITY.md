# Security Policy (SECURITY.md)

## Supported Versions

Only the latest release on the `main` branch is actively supported with security patches.

| Version | Supported |
| :--- | :---: |
| 1.x.x (Current) | Yes |
| < 1.x.x | No |

## Reporting a Vulnerability

We take the security of **Stop & Shop** seriously. If you find a security vulnerability, please do NOT create a public issue. Instead, report it privately:

1. **Email**: Send detailed vulnerability reports to `security@stop-shop-ecommerce.com` (or contact the store admin at `ahmedchoudery30@gmail.com`).
2. **Details**: Include affected files/routes, steps to reproduce, and potential impact.
3. **Response**: We will acknowledge receipt within 48 hours and coordinate a patch release.

---

## Security Header Policy & Cookie Hardening

We enforce production-grade security headers, cookie properties, and CORS controls across all paths in the application:

### 1. HTTP Security Headers
The following HTTP security headers are set for every route (via `next.config.js` and `src/middleware.ts`):
- **Strict-Transport-Security**: Forced HTTPS transport with `max-age=63072000; includeSubDomains; preload`.
- **X-Frame-Options**: Set to `DENY` to prevent clickjacking.
- **X-Content-Type-Options**: Set to `nosniff` to prevent MIME-sniffing.
- **Referrer-Policy**: Set to `strict-origin-when-cross-origin`.
- **Permissions-Policy**: Restricted API features (`geolocation=()`, `camera=()`, `microphone=()`, `payment=()`).
- **Cross-Origin-Opener-Policy**: Set to `same-origin`.
- **Cross-Origin-Resource-Policy**: Set to `same-site`.

### 2. Content Security Policy (CSP)
We implement a strict Content Security Policy to eliminate cross-site scripting (XSS) risks:
- **No `unsafe-inline`**: All inline scripts and styles are blocked by default.
- **Dynamic Nonces**: A cryptographically secure random nonce is generated on every request and passed down to required inline script elements (e.g. Analytics and Pixels) using `next/headers` and the React context.
- **Strict Host Whitelist**:
  - `default-src 'self'`
  - `script-src 'self' 'nonce-<nonce>'` (with HMR dev-mode fallbacks)
  - `style-src 'self' 'nonce-<nonce>'` (with dev-mode fallback to `unsafe-inline`)
  - `img-src 'self' https://res.cloudinary.com`
  - `font-src 'self' https://fonts.gstatic.com`
  - `connect-src 'self' https://api.resend.com`

### 3. Cookie Hardening
All authentication cookies (e.g., `auth_token`) are strictly hardened:
- **`HttpOnly`**: Set to true to prevent access from client-side scripts.
- **`Secure`**: Set to true to ensure transmission over HTTPS only.
- **`SameSite=Lax`**: Defends against CSRF attacks.
- **`Path=/`**: Restricts the scope of the cookie.

### 4. Cross-Origin Resource Sharing (CORS) Lock
All API endpoints (`/api/*`), except webhooks (`/api/webhooks/*`), are locked to the application's same origin only. Cross-origin API calls are blocked with a `403 Forbidden` response at the middleware level.
