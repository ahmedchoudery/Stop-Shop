# Stop & Shop — Premium Editorial E-Commerce Store

Stop & Shop is a full-stack, bespoke e-commerce platform built for high-end clothing and fashion retail. Modeled after global fashion houses, the application delivers a lightning-fast, secure, and visually stunning shopping experience featuring custom micro-interactions, responsive editorial hero blocks, and an enterprise-grade administration suite.

---

## Key Features

*   **Premium Editorial Design**: Modern layouts with curated OKLCH color palettes, strict typography hierarchies, and hardware-accelerated 3D parallax hover states on product cards.
*   **Intelligent Hero Overlay**: Fully responsive viewport campaigns on desktop, tablet, and mobile, structured to prevent typography from obscuring campaign models.
*   **Frictionless Checkout Flow**: A Pakistan-optimized 2-column payment grid supporting local channels (Cash on Delivery, Easypaisa, JazzCash, ATM Cards, and Bank Transfer) with customer profile auto-fill.
*   **Wishlist & Cart Drawers**: Responsive slide-out panels with stagger-loaded items, spring-based micro-interactions, and high-contrast empty states.
*   **Live Order Tracking**: Instant tracking references generated upon checkout, with a dedicated `/track` view for real-time delivery status updates.
*   **Real-Time Admin Dashboard**: Sales analytics, revenue charts, best-selling product lists, payment method breakdowns, and interactive business flow managers.
*   **Enterprise Administration tools**: CSV import/export managers for bulk product adjustments, audit log panels, and coupon management boards.

---

## Tech Stack

*   **Core**: React 18 & Next.js 14 (App Router)
*   **Backend API**: Next.js Route Handlers (Express-style logic in `/api`)
*   **Database**: MongoDB & Mongoose Object Data Modeling (ODM)
*   **Caching Layer**: Redis Cache (with automatic fallback to in-memory cache)
*   **Validation**: Zod Schemas
*   **Authentication**: JWT stored in `httpOnly` secure cookies
*   **Animations**: GSAP, Anime.js, Framer Motion
*   **Styling**: Tailwind CSS & Vanilla CSS (using OKLCH design tokens)
*   **Testing**: Vitest & Playwright

---

## Prerequisites

Ensure you have the following installed on your local machine:
*   **Node.js**: Version 20.19.0 or higher (specified in `.nvmrc`)
*   **MongoDB**: A running local MongoDB instance or a MongoDB Atlas connection string
*   **Git**: For version control
*   **Redis** (Optional): A local Redis server if you wish to run the performance caching layer locally

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/ahmedchoudery/Stop-Shop.git
cd Stop-Shop
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment template to create your local `.env` file:
```bash
cp .env.example .env
```
Open `.env` in your editor and configure your credentials. See the [Environment Variables](#environment-variables) section below for details.

### 4. Database Setup & Seeding
Initialize the database, reset the admin credentials, and populate the store with catalog products:
```bash
# 1. Reset/Upsert admin credentials and normalize categories
node scripts/admin_fix.js

# 2. Seed default collection products and coupon codes
node scripts/seed.js
```

### 5. Start Development Server
Run the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Architecture

### Directory Structure
```
Stop-Shop/
├── public/                 # Static assets (images, hero JPGs)
├── scripts/                # Database seed, fix, and migration scripts
│   ├── admin_fix.js        # Configures admin user from env & trims categories
│   ├── seed.js             # Cleans DB and inserts catalog items
│   └── purge-database.js   # DB reset utility
├── src/
│   ├── app/                # Next.js App Router endpoints & layouts
│   │   ├── api/            # Backend API routes (checkout, products, stats)
│   │   │   └── checkout/   # Post checkout endpoint
│   │   ├── admin/          # Admin routing
│   │   ├── layout.jsx      # Global HTML Root Layout
│   │   └── providers.jsx   # State context providers
│   ├── components/         # Reusable UI Components
│   │   ├── PowerOfChoiceHero.jsx # Full-bleed editorial hero
│   │   ├── CheckoutForm.jsx      # Multi-method payment form
│   │   ├── WishlistDrawer.jsx    # Slide-in saved items panel
│   │   ├── ProductCard.jsx       # 3D tilting product grid item
│   │   └── ...
│   ├── views/              # Main page views
│   │   ├── HomePage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── OrderSuccessPage.jsx
│   │   └── AdminAnalytics.jsx
│   ├── context/            # React Context Providers
│   │   ├── CartContext.tsx
│   │   └── WishlistContext.jsx
│   ├── models/             # Mongoose schemas
│   ├── schemas/            # Zod validation rules
│   ├── services/           # Backend services (cache, email, inventory)
│   └── styles/             # Stylesheets (index.css with OKLCH tokens)
├── package.json            # Scripts & dependencies configuration
├── tailwind.config.js      # Tailwind theme parameters
└── tsconfig.json           # TypeScript configuration
```

### Data Flow Lifecycle

1.  **User Action**: Shopper clicks "Place Order" inside [CheckoutForm.jsx](file:///c:/Users/JAPAN%20COMPUTERS/OneDrive/Desktop/Stop-Shop/src/components/CheckoutForm.jsx).
2.  **Frontend Validation**: Inputs are validated against client schemas.
3.  **API Dispatch**: Form is serialized and sent to Next.js route handler `/api/checkout`.
4.  **Zod Schema Validation**: Request payload is safely parsed in `/api/checkout/route.js` via `checkoutSchema`.
5.  **Database Transaction**:
    *   Finds purchased items in Mongoose `Product` collection.
    *   Validates stock availability (overall and size-specific).
    *   Deducts quantity and registers a transaction in Mongoose `Order` collection.
6.  **Cache Invalidation**: Invalidates Redis cache keys (`stats_revenue`, `stats_orders`, `public_products`).
7.  **Fulfillment Notification**: Triggers email confirmation and launches background check for low stock alerts.
8.  **Routing Redirect**: Redirects user to [OrderSuccessPage.jsx](file:///c:/Users/JAPAN%20COMPUTERS/OneDrive/Desktop/Stop-Shop/src/views/OrderSuccessPage.jsx) demonstrating their unique order reference.

---

## Environment Variables

The application reads configurations from `.env` in the root folder.

### Required Fields
| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `MONGO_URI` | MongoDB Atlas / Local connection URL | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key used to encrypt user auth tokens | *A random 64-character string* |
| `ADMIN_EMAIL` | Credentials for logging in to the admin panel | `admin@example.com` |
| `ADMIN_PASSWORD`| Password for logging in to the admin panel | `your-secure-password` |

### Optional Performance & Third-Party Integrations
| Variable | Description | Default / Fallback |
| :--- | :--- | :--- |
| `PORT` | Local web server port | `5001` |
| `REDIS_URL` | Redis server URL for analytics and catalog cache | Falls back to in-memory caching |
| `CACHE_TTL` | Cache duration in seconds | `300` (5 minutes) |
| `email_user` | Gmail/SMTP username to send order receipts | - |
| `email_pass` | Gmail App Password for SMTP authentication | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary credentials for product image storage | - |

---

## Available Scripts

Use the following commands from the root directory:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js server in development mode |
| `npm run build` | Builds the production bundle |
| `npm run start` | Runs the compiled production server |
| `npm run lint` | Runs ESLint analysis across javascript and typescript files |
| `npm run test` | Runs unit/integration test suite via Vitest |
| `npm run test:e2e` | Runs Playwright browser integration tests |
| `node scripts/seed.js` | Drops product and coupon collections and inserts fresh seed data |
| `node scripts/admin_fix.js` | Configures the primary administrator account using `.env` details |

---

## Testing

The application maintains unit tests, context integration tests, and full end-to-end user flow tests.

### Running Test Suites
```bash
# Run unit and service tests (Vitest)
npm run test

# Run UI e2e integration tests (Playwright)
npm run test:e2e
```

---

## Deployment

### 1. Build and Run Production Locally
```bash
npm run build
npm run start
```

### 2. NextJS Frontend (Vercel)
Connect the repository to your Vercel Dashboard. Vercel detects Next.js settings automatically. Make sure to define `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in Vercel's Environment Variables settings.

### 3. Backend & Database (Railway / Atlas)
Set up a MongoDB Atlas cluster and get the connection string. On Railway (or other cloud providers), link the repository, configure the port to run `npm run start`, and define your `.env` parameters in their dashboard.

---

## Troubleshooting

### Storefront displays "No Pieces Found"
*   **Cause**: The database connection succeeded but the `Product` collection is empty.
*   **Solution**: Run the seeding script to populate items:
    ```bash
    node scripts/seed.js
    ```

### Admin login fails with correct credentials
*   **Cause**: The MongoDB database was reset or seeded after editing the `.env` settings, causing a mismatch.
*   **Solution**: Re-run the admin configuration script to update the database values with your current `.env` properties:
    ```bash
    node scripts/admin_fix.js
    ```

### ESLint warnings on build
*   **Cause**: Hydration issues or unused declarations.
*   **Solution**: Clean files or run `npm run lint` locally to pinpoint the exact line causing the warnings.
