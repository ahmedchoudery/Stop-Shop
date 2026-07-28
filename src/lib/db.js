import mongoose from 'mongoose';
import { withRetry } from '../utils/retry.js';
import { releaseExpiredReservations } from '../services/reservationService.js';
import logger from '../utils/logger.js';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

if (!global.reservationCronStarted) {
  global.reservationCronStarted = true;
  // Expired reservations cron check every 1 minute
  setInterval(() => {
    releaseExpiredReservations().catch(err =>
      logger.error({ err: err.message }, '[Reservation Cron Interval] Error releasing expired reservations')
    );
  }, 60000);
  logger.info('[Reservation Service] Expired reservation cleanup cron registered.');
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const connStrWithoutParams = MONGODB_URI.split('?')[0];
    const pathSegments = connStrWithoutParams.split('/');
    // The dbName is the segment after the hosts part (index 3)
    const extractedDbName = pathSegments.slice(3).join('/').split('#')[0];
    const dbName = extractedDbName || (process.env.NODE_ENV === 'test' ? 'stopshop_test' : 'stopshop');

    const opts = {
      dbName,
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
      socketTimeoutMS: 45000,
      family: 4,
      bufferCommands: false,
    };

    cached.promise = withRetry(
      async () => {
        return mongoose.connect(MONGODB_URI, opts);
      },
      { name: 'MongoDB Connection', retries: 5, minTimeout: 1000, maxTimeout: 10000 }
    ).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
export { dbConnect };
