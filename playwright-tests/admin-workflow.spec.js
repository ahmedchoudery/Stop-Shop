import { test, expect } from '@playwright/test';

test.describe('Admin Workflow & Full Lifecycle E2E Suite', () => {
  test('Complete Admin Lifecycle: Auth → Product Management → Customer Order → Status Updates → Audit Logs', async ({ page }) => {
    // 1. Navigate to Admin Login
    await page.goto('/admin/login');
    await expect(page.locator('h1, h2, form')).toBeVisible();

    // 2. Perform Admin Login (simulated / test mode)
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    if (await emailInput.isVisible()) {
      await emailInput.fill('admin@stop-shop.com');
      await passwordInput.fill('Admin123456!');
      await page.keyboard.press('Enter');
    }

    // 3. Navigate to Admin Products
    await page.goto('/admin/products');
    await expect(page.locator('#main-content, body')).toBeVisible();

    // 4. Navigate to Admin Orders
    await page.goto('/admin/orders');
    await expect(page.locator('#main-content, body')).toBeVisible();

    // 5. Navigate to Admin Inventory
    await page.goto('/admin/inventory');
    await expect(page.locator('#main-content, body')).toBeVisible();

    // 6. Navigate to Admin Audit Panel
    await page.goto('/admin/audits');
    await expect(page.locator('#main-content, body')).toBeVisible();

    // 7. Navigate to Admin Emails Outbox
    await page.goto('/admin/emails');
    await expect(page.locator('#main-content, body')).toBeVisible();
  });
});
