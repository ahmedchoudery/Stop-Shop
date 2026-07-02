import pino from 'pino';
import pretty from 'pino-pretty';
import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage to hold request-level context (like requestId)
export const requestStorage = new AsyncLocalStorage();

const isProduction = process.env.NODE_ENV === 'production';

// Pino configuration options
const pinoOptions = {
  level: process.env.LOG_LEVEL || 'info',
  mixin() {
    try {
      const { headers } = require('next/headers');
      const reqHeaders = headers();
      const requestId = reqHeaders.get('x-request-id');
      if (requestId) return { requestId };
    } catch (e) {
      // Ignore errors when called outside request context (e.g., build time, startup)
    }
    return {};
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
};

let logger;

if (!isProduction) {
  // Use pino-pretty synchronously as a stream to avoid thread-stream worker thread crashes in Next.js
  const prettyStream = pretty({
    colorize: true,
    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
    ignore: 'pid,hostname',
  });
  logger = pino(pinoOptions, prettyStream);
} else {
  // Use native fast JSON logs in production
  logger = pino(pinoOptions);
}

export default logger;
export { logger };
