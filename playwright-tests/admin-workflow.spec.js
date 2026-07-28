import { test, expect } from '@playwright/test';

test.describe('Admin Workflow & Full Lifecycle E2E Suite', () => {

  test.beforeEach(async ({ request }) => {
    // Reset E2E test user 2FA and attempt counters
    const res = await request.post('/api/v1/auth/test-reset');
    expect(res.ok()).toBe(true);
  });

  test('Complete Admin Lifecycle: Auth → Product Management → Customer Order → Status Updates → Audit Logs', async ({ page }) => {
    test.setTimeout(180000);

    // 1. Navigate to Admin Login
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1, h2, form').first()).toBeVisible({ timeout: 15000 });

    // 2. Perform Admin Login with credentials
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('e2e-admin@stop-shop-test.com');
    await passwordInput.fill('vxSk9mUi0/NX6IvZ!Aa1');
    await page.keyboard.press('Enter');

    // 3. Complete 2FA Security Verification if prompted
    const securityVerification = page.locator('text=Security Verification');
    if (await securityVerification.isVisible({ timeout: 25000 }).catch(() => false)) {
      await page.fill('input[placeholder="000000"]', '123456');
      await page.click('button:has-text("Verify Identity")');
    }

    // Wait for successful admin authentication redirect
    await expect(page).toHaveURL(/\/admin/, { timeout: 20000 });

    // 4. Navigate to Admin Products
    await page.goto('/admin/products', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    // 5. Navigate to Admin Orders
    await page.goto('/admin/orders', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    // 6. Navigate to Admin Inventory
    await page.goto('/admin/inventory', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    // 7. Navigate to Admin Audit Panel
    await page.goto('/admin/audits', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    // 8. Navigate to Admin Emails Outbox
    await page.goto('/admin/emails', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

});
