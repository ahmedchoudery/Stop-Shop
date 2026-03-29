# Stop & Shop - E-Commerce Platform

A full-stack e-commerce application built with React, Express.js, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Stop-Shop

# Install dependencies
npm install

# Create .env file (see Configuration section)
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
Stop-Shop/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── ProductCard.jsx
│   │   ├── ProductGrid.jsx
│   │   ├── ProductTable.jsx      # Admin product table
│   │   ├── ProductFilters.jsx    # Product filtering UI
│   │   ├── OrderTable.jsx
│   │   ├── StatsGrid.jsx
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── HomePage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── DashboardHome.jsx
│   │   ├── AdminOrders.jsx
│   │   ├── AdminProducts.jsx
│   │   ├── AdminUsers.jsx
│   │   ├── AdminInventory.jsx
│   │   ├── AdminSettings.jsx
│   │   └── AdminAuditPanel.jsx
│   ├── context/            # React Context providers
│   │   ├── CartContext.jsx
│   │   ├── WishlistContext.jsx
│   │   ├── CurrencyContext.jsx
│   │   └── LocaleContext.jsx
│   ├── layout/             # Layout components
│   ├── services/          # Backend services
│   │   ├── cacheService.js    # Redis caching
│   │   └── auditService.js    # Audit logging
│   ├── middleware/         # Express middleware
│   │   └── security.js       # XSS sanitization
│   ├── schemas/            # Validation schemas
│   │   └── validation.js     # Zod schemas
│   ├── types/              # TypeScript type definitions
│   └── test/               # Test files
├── server.js               # Express backend server
├── vite.config.js          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── vitest.config.js        # Test configuration
```

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/stopshop
# Or use MongoDB Atlas:
# MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/stopshop

# Server
PORT=5000

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Admin Credentials (for initial setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password

# Email (for order notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Redis (Optional - falls back to in-memory cache)
REDIS_URL=redis://localhost:6379
CACHE_TTL=300

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com
```

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

## 🔒 Security Features

- **JWT httpOnly Cookies** - Secure token storage
- **CSRF Protection** - Token-based CSRF validation
- **Rate Limiting** - 5 login attempts per 15 minutes
- **Input Sanitization** - XSS prevention via DOMPurify
- **Zod Validation** - Request body validation
- **Helmet Security Headers** - CSP, X-Frame-Options, etc.
- **Password Hashing** - bcrypt with salt rounds

## 💾 Caching Strategy

The application supports Redis caching with automatic fallback to in-memory caching:

- **Stats endpoints**: 5-minute TTL
- **Public products**: 5-minute TTL
- **Automatic invalidation**: On product/order changes

To enable Redis, add `REDIS_URL` to your `.env` file.

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## 📦 API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/public/products` | List all products |
| GET | `/api/public/settings` | Get public settings |
| POST | `/api/checkout` | Process order |
| POST | `/api/admin/login` | Admin login |

### Protected Endpoints (Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List all orders |
| PATCH | `/api/orders/:id` | Update order status |
| GET | `/api/admin/products` | List admin products |
| POST | `/api/admin/products` | Create product |
| PATCH | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |
| GET | `/api/stats/revenue` | Revenue statistics |
| GET | `/api/stats/orders` | Order statistics |
| GET | `/api/stats/inventory` | Inventory statistics |
| GET | `/api/settings` | Get settings |
| POST | `/api/settings` | Update settings |
| GET | `/api/admin/users` | List admin users |
| POST | `/api/admin/users` | Create admin user |
| DELETE | `/api/admin/users/:id` | Delete admin user |

## 🚢 Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy the dist/ folder to Vercel
```

### Backend (Railway/Render)
```bash
# Set environment variables in Railway dashboard
npm start
```

## 📝 License

MIT License

## 👤 Author

Ahmed Choudery

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)
