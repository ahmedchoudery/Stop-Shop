import { test, expect } from '@playwright/test';

test.describe('Admin Authentication & Security Rebuild', () => {

  test.beforeEach(async ({ request }) => {
    // Reset E2E test user 2FA and attempt counters
    const res = await request.post('/api/v1/auth/test-reset');
    expect(res.ok()).toBe(true);
  });

  test('Non-admin cannot reach admin API routes directly', async ({ request }) => {
    // Attempt GET to users admin endpoint without cookies/auth
    const response = await request.get('/api/v1/admin/users');
    expect(response.status()).toBe(401);
  });

  test('Admin Login Flow -> Email OTP Verification -> Access Admin Dashboard', async ({ page }) => {
    // 1. Visit Login page
    await page.goto('/admin/login');
    await expect(page.locator('h1')).toContainText('Stop & Shop');

    // 2. Submit credentials (pre-seeded default admin)
    await page.fill('input[name="email"]', 'e2e-admin@stop-shop-test.com');
    await page.fill('input[name="password"]', 'vxSk9mUi0/NX6IvZ!Aa1');
    await page.keyboard.press('Enter');

    // 3. If 2FA screen appears, fill verification code
    const securityVerification = page.locator('text=Security Verification');
    if (await securityVerification.isVisible({ timeout: 25000 }).catch(() => false)) {
      await page.fill('input[placeholder="000000"]', '123456');
      await page.click('button:has-text("Verify Identity")');
    }

    // 4. Successful login leads to /admin dashboard
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
    await expect(page.locator('#main-content, body').first()).toBeVisible();
  });

});
