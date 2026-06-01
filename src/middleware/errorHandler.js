/**
 * Express centralized global error handling middleware.
 * Sanitizes server stack traces in production environment, returning standard Operational Error payloads.
 * Converts NoSQL CastErrors, ValidationErrors, and Duplicate Keys to standard HTTP statuses.
 *
 * @type {import('express').ErrorRequestHandler}
 */
export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode ?? 500;
  let status = statusCode < 500 ? 'fail' : 'error';
  let message = err.message;

  // ─────────────────────────────────────────────────────────────────
  // DATABASE ERROR CONVERSIONS
  // ─────────────────────────────────────────────────────────────────

  // 1. Mongoose Cast Error (invalid Object ID format)
  if (err.name === 'CastError') {
    statusCode = 400;
    status = 'fail';
    message = `Invalid format for path: ${err.path}`;
  }

  // 2. Mongoose Validation Error (database validation rules failed)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    status = 'fail';
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // 3. Mongo Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    status = 'fail';
    const field = Object.keys(err.keyPattern ?? {}).join(', ') || 'field';
    message = `Duplicate resource value. A record with this ${field} already exists.`;
  }

  if (statusCode >= 500) {
    console.error('[ERROR]', err.message, err.stack);
  }

  res.status(statusCode).json({ 
    status, 
    message: process.env.NODE_ENV === 'production' && statusCode >= 500 
               ? 'An internal error occurred' 
               : message
  });
};
