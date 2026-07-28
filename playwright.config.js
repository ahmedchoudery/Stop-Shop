import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright-tests',
  timeout: process.env.CI ? 180000 : 120000, // 180s in CI, 120s locally
  fullyParallel: false, // Sequenced to prevent database write conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker avoids database write collisions
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // Always start fresh in CI
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 180000, // 3 min — next start can be slow on CI cold runners
  },
});

