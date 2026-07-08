import { test, expect } from '@playwright/test';

test.describe('Admin Authentication & Security Rebuild', () => {

  test.beforeEach(async ({ request }) => {
    // Reset E2E test user 2FA and attempt counters
    const res = await request.post('/api/auth/test-reset');
    expect(res.ok()).toBe(true);
  });

  test('Non-admin cannot reach admin API routes directly', async ({ request }) => {
    // Attempt GET to users admin endpoint without cookies/auth
    const response = await request.get('/api/admin/users');
    expect(response.status()).toBe(401);
  });

  test('Admin Login Flow -> Email OTP Verification -> Access Admin Dashboard', async ({ page }) => {
    // 1. Visit Login page
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Stop & Shop');

    // 2. Submit credentials (pre-seeded default admin)
    await page.fill('input[name="email"]', 'e2e-admin@stop-shop-test.com');
    await page.fill('input[name="password"]', 'vxSk9mUi0/NX6IvZ!Aa1');
    await page.click('button[type="submit"]');

    // 3. Page should transition directly to Security Verification screen (prompting for email code)
    await expect(page.locator('text=Security Verification')).toBeVisible({ timeout: 15000 });

    // 4. Fill static E2E test verification code and submit
    await page.fill('input[placeholder="000000"]', '123456');
    await page.click('button:has-text("Verify Identity")');

    // 5. Successful login leads to /admin dashboard
    await page.waitForURL('**/admin', { timeout: 15000 });
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible({ timeout: 15000 });
  });

});
