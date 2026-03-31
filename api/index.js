/**
 * @fileoverview Vercel Hybrid Wrapper
 * Satisfies the /api folder convention by importing the main Express app
 * from the root server.js and exporting it as a serverless function.
 */

import app from '../server.js';

export default app;
