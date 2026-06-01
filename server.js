/**
 * @fileoverview Stop & Shop — Express API Entrypoint
 * Orchestrates modular architecture: models, routes, middlewares, services
 */

import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// Services, Middlewares, Security
import { cacheService } from './src/services/cacheService.js';
import { sanitizeInput, flattenQueryParams } from './src/middleware/security.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { apiLimiter } from './src/middleware/rateLimiters.js';

// Routers
import adminRouter from './src/routes/admin.js';
import publicRouter from './src/routes/public.js';
import customerRouter from './src/routes/customer.js';

// Seed models
import Admin from './src/models/Admin.js';
import Coupon from './src/models/Coupon.js';

dotenv.config();

// ─────────────────────────────────────────────────────────────────
// STARTUP DIAGNOSTICS & GLOBAL HANDLERS
// ─────────────────────────────────────────────────────────────────

const startupLog = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGO_URI_PRESENT: !!(process.env.MONGO_URI ?? process.env.MONGODB_URI),
  JWT_SECRET_PRESENT: !!(process.env.JWT_SECRET ?? process.env.jwt_secret),
  REDIS_URL_PRESENT: !!(process.env.REDIS_URL ?? process.env.REDIS_TLS_URL),
  VERCEL: !!process.env.VERCEL,
  RAILWAY: !!process.env.RAILWAY_STATIC_URL || !!process.env.RAILWAY_ENVIRONMENT,
};

console.log('🚀 Starting API in Modular Mode...');
console.table(startupLog);

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message, err.stack);
  if (!process.env.VERCEL) process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  if (!process.env.VERCEL) process.exit(1);
});

const getEnv = (...keys) => keys.map(k => process.env[k]).find(Boolean);
const isProduction = process.env.NODE_ENV === 'production';

// ─────────────────────────────────────────────────────────────────
// APP SETUP
// ─────────────────────────────────────────────────────────────────

const app = express();
app.set('trust proxy', 1);

// ─────────────────────────────────────────────────────────────────
// PRE-MIDDLEWARE HEALTH & DIAGNOSTIC ROUTES
// ─────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    timestamp: new Date().toISOString(),
  });
});

app.get('/_diag', (_req, res) => {
  res.json({ status: 'alive', uptime: process.uptime(), ...startupLog, memory: process.memoryUsage() });
});

// ─────────────────────────────────────────────────────────────────
// SECURITY & CENTRAL MIDDLEWARES
// ─────────────────────────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc:  ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:'],
      imgSrc:     ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc:    ["'self'", 'https:', 'data:'],
      objectSrc:  ["'none'"],
      mediaSrc:   ["'self'", 'https:'],
      frameSrc:   ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://stop-shop-gamma.vercel.app',
  'https://stop-shop-4da620xej-ahmedchouderys-projects.vercel.app',
  ...(getEnv('ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean),
];

const uniqueOrigins = [...new Set(ALLOWED_ORIGINS)];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = uniqueOrigins.includes(origin)
      || /^https:\/\/stop-shop.*\.vercel\.app$/.test(origin);
    if (allowed) return callback(null, true);
    console.warn(`[CORS] Blocked: ${origin}`);
    callback(null, false);
  },
  credentials: true,
}));

app.use(compression());
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(sanitizeInput);
app.use(flattenQueryParams);

// Apply Global Rate Limiting to standard API requests
app.use('/api', apiLimiter);

// ─────────────────────────────────────────────────────────────────
// ROUTE REGISTRATION (preserving API prefixes exactly)
// ─────────────────────────────────────────────────────────────────

app.use('/api', publicRouter);   // handles `/checkout`, `/newsletter`, `/public/...`
app.use('/api', adminRouter);    // handles `/admin/...`, `/stats/...`, `/orders/...`, `/settings/...`
app.use('/api/customer', customerRouter); // handles `/customer/...`

// ─────────────────────────────────────────────────────────────────
// STATIC FILES & SPA FALLBACK
// ─────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const distPath   = path.resolve(__dirname, './dist');

if (fs.existsSync(distPath)) {
  console.log('✅ Serving static assets from /dist');
  app.use(express.static(distPath, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.includes('/assets/') || filePath.includes('\\assets\\')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }));
} else {
  console.warn('⚠️ /dist not found — frontend not built yet.');
}

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));

app.get('*', (req, res) => {
  const index = path.join(distPath, 'index.html');
  if (fs.existsSync(index)) {
    res.sendFile(index);
  } else if (!req.path.startsWith('/api')) {
    res.status(200).json({ message: 'API running — Frontend not built', path: req.path });
  }
});

// ─────────────────────────────────────────────────────────────────
// CENTRALIZED ERROR BOUNDARY
// ─────────────────────────────────────────────────────────────────

app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────
// SERVER STARTUP & DATABASE SEEDING
// ─────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '5000', 10);
let server;

if (!process.env.VERCEL) {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

// MongoDB Connection and Seeding
const mongoUri = getEnv('MONGO_URI', 'MONGODB_URI');
if (mongoUri) {
  mongoose.connect(mongoUri, { dbName: 'stopshop', maxPoolSize: 10, socketTimeoutMS: 45000, family: 4 })
    .then(async () => {
      console.log('✅ MongoDB connected (db: stopshop)');

      // Seed admin user if configured and none exists
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (adminEmail && adminPassword) {
        try {
          const existingAdmin = await Admin.findOne({ email: adminEmail });
          if (!existingAdmin) {
            const hashed = await bcrypt.hash(adminPassword, 12);
            await Admin.create({
              name: 'Super Admin',
              email: adminEmail,
              password: hashed,
              roles: ['super-admin'],
              isPrimary: true,
            });
            console.log('✅ Admin user seeded');
          }
        } catch (e) {
          console.error('❌ Admin seed error:', e.message);
        }
      }

      // Seed default coupon offered in newsletter
      const exists = await Coupon.findOne({ code: 'CARDINAL20' }).lean();
      if (!exists) {
        await Coupon.create({
          code: 'CARDINAL20', type: 'percentage', value: 20,
          minOrderValue: 0, maxUses: null, isActive: true, expiresAt: null,
        });
        console.log('✅ CARDINAL20 coupon seeded (20% off)');
      }
    })
    .catch(err => console.error('❌ MongoDB error:', err.message));
}

// ─────────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────────

const shutdown = async (sig) => {
  console.log(`[Shutdown] ${sig}`);
  if (server?.close) {
    server.close(async () => {
      await Promise.allSettled([mongoose.connection.close(), cacheService.close()]);
      process.exit(0);
    });
  } else {
    await Promise.allSettled([mongoose.connection.close(), cacheService.close()]);
    if (!process.env.VERCEL) process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

export default app;