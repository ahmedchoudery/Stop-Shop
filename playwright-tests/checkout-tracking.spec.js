import { test, expect } from '@playwright/test';

test.describe('Checkout and Secure Order Tracking E2E Flow', () => {

  test('should complete a coupon-discounted checkout and track securely via email verification', async ({ page }) => {
    test.setTimeout(180000);

    // Log browser messages for debugging
    page.on('console', msg => { if (msg.type() !== 'log') console.info('PAGE LOG:', msg.text()); });
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

    // ── Step 1: Navigate to home page and seed cart in localStorage ──────────────────
    // Use P001 (Classic White T-Shirt, price: 999) which is created by the seed script.
    // We match all fields that CartContext.syncCartWithDb compares so the item survives sync.
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => {
      const item = {
        _id:           'P001',
        id:            'P001',
        name:          'Classic White T-Shirt',
        price:         999,
        image:         'https://images.unsplash.com/photo-1520975911451-8a1b5e6e5d7e',
        quantity:      1,
        selectedSize:  'L',
        selectedColor: 'White',
        activeColor:   'White',
        stock:         50,
        discount:      0,
        bucket:        'Tops',
      };
      localStorage.setItem('stopshop-cart', JSON.stringify([item]));
    });

    // ── Step 2: Navigate to checkout; wait for CartContext to hydrate ─────────────────
    // We go to checkout directly. CartContext hydrates from localStorage on mount.
    // We then wait explicitly for the checkout form to appear (not the empty-cart guard).
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });

    // Wait for the coupon section heading to confirm form is rendered (not empty-cart guard)
    await expect(page.getByRole('heading', { name: /shipping.*payment/i })).toBeVisible({ timeout: 30000 });

    // ── Step 3: Apply Coupon Code CARDINAL20 ──────────────────────────────────────────
    const couponInput = page.locator('#coupon-code-input');
    await expect(couponInput).toBeVisible({ timeout: 15000 });
    await couponInput.click();
    await couponInput.fill('CARDINAL20');

    // Wait for the Apply button to become enabled (requires non-empty input)
    const applyButton = page.locator('button:has-text("Apply")');
    await expect(applyButton).toBeVisible({ timeout: 5000 });
    await expect(applyButton).toBeEnabled({ timeout: 5000 });
    await applyButton.click();

    // Wait for coupon discount confirmation in the order summary
    await expect(page.getByText('Discount (CARDINAL20)')).toBeVisible({ timeout: 15000 });

    // ── Step 4: Fill out checkout shipping form ──────────────────────────────────────
    await page.getByPlaceholder('Ahmed', { exact: true }).fill('E2E');
    await page.getByPlaceholder('Khan', { exact: true }).fill('Test');
    await page.locator('input[placeholder="ahmed@email.com"]').fill('e2etest@example.com');
    await page.locator('input[placeholder="03001234567"]').first().fill('03001234567');
    await page.getByPlaceholder('House #, Street, Area', { exact: true }).fill('123 Automated Testing Lane');
    await page.getByPlaceholder('Gujrat', { exact: true }).fill('Karachi');
    await page.getByPlaceholder('50700', { exact: true }).fill('74200');

    // ── Step 5: Place order (COD selected by default) ────────────────────────────────
    const placeOrderButton = page.locator('button[type="submit"]');
    await expect(placeOrderButton).toBeVisible({ timeout: 5000 });
    await expect(placeOrderButton).toBeEnabled({ timeout: 5000 });
    await placeOrderButton.click();

    // ── Step 6: Confirm order-success page and extract order ID ──────────────────────
    await expect(page).toHaveURL(/\/order-success/, { timeout: 20000 });
    await expect(page.getByText('Order Confirmed', { exact: true })).toBeVisible({ timeout: 15000 });

    const url = new URL(page.url());
    const orderID = url.searchParams.get('orderID');
    expect(orderID).not.toBeNull();
    expect(orderID).toMatch(/^(ORD-|STOP-)/);

    // ── Step 7: Navigate to Order Tracking page ──────────────────────────────────────
    await page.goto('/track', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/track/);

    // Pre-warm the API route — first hit compiles the route handler in prod/start mode
    // and establishes the DB connection. We don't care about the response.
    await page.evaluate(async () => {
      try { await fetch('/api/public/track/WARMUP?email=warmup@test.com'); } catch { /* expected */ }
    });

    // Wait for the tracking form to be ready
    const orderIdInput = page.locator('input[placeholder="STOP-YYYY-XXXXXX"]');
    await expect(orderIdInput).toBeVisible({ timeout: 15000 });

    // ── Step 8: Attempt tracking with INCORRECT email (should fail) ───────────────────
    await orderIdInput.fill(orderID);
    await page.locator('input[placeholder="your-email@example.com"]').fill('wrong@example.com');
    await page.locator('button[type="submit"]').click();

    // Expect the error message — allow extra time for DB cold start in CI
    await expect(
      page.getByText('No order found matching those details. Please check and try again.')
    ).toBeVisible({ timeout: 30000 });

    // ── Step 9: Track with CORRECT email (should succeed) ────────────────────────────
    await page.locator('input[placeholder="your-email@example.com"]').fill('e2etest@example.com');
    await page.locator('button[type="submit"]').click();

    // Verify order result card and details are visible
    // The result card shows "Order Reference" (not "Order Status")
    await expect(page.locator('text=Order Reference')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(orderID)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('E2E Test', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('123 Automated Testing Lane')).toBeVisible({ timeout: 10000 });
  });

});
