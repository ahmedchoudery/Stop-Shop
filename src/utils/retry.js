import logger from './logger.js';

/**
 * Executes an asynchronous function with exponential backoff and jitter.
 *
 * @param {Function} fn - The asynchronous function to execute.
 * @param {Object} options - Options config.
 * @param {number} options.retries - Maximum retry attempts (default: 3).
 * @param {number} options.factor - Exponential factor (default: 2).
 * @param {number} options.minTimeout - Initial wait time in ms (default: 1000).
 * @param {number} options.maxTimeout - Maximum wait time in ms (default: 10000).
 * @param {string} options.name - Operation label for logs.
 * @returns {Promise<any>}
 */
export async function withRetry(fn, options = {}) {
  const {
    retries = 3,
    factor = 2,
    minTimeout = 1000,
    maxTimeout = 10000,
    name = 'Operation',
  } = options;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt > retries) {
        logger.error(`❌ [Retry] ${name} failed permanently after ${attempt - 1} retries. Error: ${error.message}`);
        throw error;
      }

      // Exponential backoff math: minTimeout * factor^(attempt - 1)
      const baseDelay = minTimeout * Math.pow(factor, attempt - 1);
      // Introduce jitter (random ±15% variance) to prevent thundering herd problem
      const jitter = (Math.random() * 0.3 - 0.15) * baseDelay;
      const delay = Math.min(maxTimeout, Math.max(0, baseDelay + jitter));

      logger.warn(`⚠️ [Retry] ${name} failed (attempt ${attempt}/${retries}). Retrying in ${Math.round(delay)}ms... Error: ${error.message}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export default withRetry;
