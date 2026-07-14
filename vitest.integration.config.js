import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    sequence: {
      concurrent: false,
    },
    include: [
      'src/test/checkout.test.js',
      'src/test/idempotency.test.js',
      'src/test/emailOutbox.test.js',
      'src/test/lowStockAlert.test.js'
    ],
  },
});
