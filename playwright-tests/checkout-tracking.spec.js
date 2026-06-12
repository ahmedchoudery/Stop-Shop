import { test, expect } from '@playwright/test';

test.describe('Checkout and Secure Order Tracking E2E Flow', () => {

  test('should complete a coupon-discounted checkout and track securely via email verification', async ({ page }) => {
    // Log browser messages for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
    page.on('requestfailed', request => console.error('REQUEST FAILED:', request.url(), request.failure()?.errorText));

    // 1. Visit the home page and click on the first product
    await page.goto('/');

    const productLink = page.locator('article').first();
    await expect(productLink).toBeVisible();

    // Click with retry to handle React hydration delays
    for (let attempt = 0; attempt < 3; attempt++) {
      if (page.url().includes('/product/')) {
        break;
      }
      try {
        await productLink.click();
        await page.waitForURL(/\/product\//, { timeout: 20000 });
        break;
      } catch (e) {
        if (attempt === 2) throw e;
        await page.waitForTimeout(1000);
      }
    }

    // Wait for the main elements to load on the product page
    await expect(page.locator('button:has-text("Add to Bag")')).toBeVisible();

    // Select size if available
    try {
      const sizeButtons = page.locator('div:has(span:has-text("Select Size")) + div button');
      await sizeButtons.first().waitFor({ state: 'visible', timeout: 2000 });
      await sizeButtons.first().click();
    } catch (e) {
      // No size buttons found or timed out (product has no sizes)
    }

    // 2. Add product to bag
    const addToBagButton = page.locator('button:has-text("Add to Bag")');
    await expect(addToBagButton).toBeVisible();
    await addToBagButton.click();

    // Verify added to bag status
    await expect(page.getByText('✓ Added to bag')).toBeVisible();

    // 3. Go to checkout page
    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/checkout/);

    // 4. Apply Coupon Code CARDINAL20
    const couponInput = page.getByPlaceholder('PROMO CODE');
    await expect(couponInput).toBeVisible();
    await couponInput.fill('CARDINAL20');

    const applyButton = page.locator('button:has-text("Apply")');
    await expect(applyButton).toBeVisible();
    await expect(applyButton).toBeEnabled();
    await applyButton.click();

    // Wait for coupon discount to appear in order summary
    await expect(page.getByText('Discount (CARDINAL20)')).toBeVisible();

    // 5. Fill out checkout form details using placeholders
    await page.getByPlaceholder('Ahmed', { exact: true }).fill('E2E');
    await page.getByPlaceholder('Khan', { exact: true }).fill('Test');
    await page.getByPlaceholder('ahmed@email.com', { exact: true }).fill('e2etest@example.com');
    await page.getByPlaceholder('House #, Street, Area', { exact: true }).fill('123 Automated Testing Lane');
    await page.getByPlaceholder('Gujrat', { exact: true }).fill('Karachi');
    await page.getByPlaceholder('50700', { exact: true }).fill('74200');

    // Payment method COD is selected by default, so we can submit the form directly
    const placeOrderButton = page.locator('button[type="submit"]');
    await expect(placeOrderButton).toBeVisible();
    await placeOrderButton.click();

    // 6. Wait for success page navigation and extract order ID
    await expect(page).toHaveURL(/\/order-success/, { timeout: 15000 });
    await expect(page.getByText('Order Confirmed', { exact: true })).toBeVisible({ timeout: 10000 });

    const url = new URL(page.url());
    const orderID = url.searchParams.get('orderID');
    expect(orderID).not.toBeNull();
    expect(orderID).toMatch(/^ORD-/);

    // 7. Go to the Order Tracking page
    await page.goto('/track');
    await expect(page).toHaveURL(/\/track/);

    // 8. Attempt tracking with an INCORRECT email (should fail)
    await page.getByPlaceholder('ORD-XXXXXXXX').fill(orderID);
    await page.getByPlaceholder('your-email@example.com').fill('wrong@example.com');
    await page.locator('button:has-text("Track Order")').click();

    // Assert that the verification error message is displayed
    await expect(page.getByText('No order found matching those details. Please check and try again.')).toBeVisible();

    // 9. Track with the CORRECT email (should succeed)
    await page.getByPlaceholder('your-email@example.com').fill('e2etest@example.com');
    await page.locator('button:has-text("Track Order")').click();

    // Verify order status details and timeline are visible
    await expect(page.locator('text=Order Status')).toBeVisible();
    await expect(page.getByText(orderID)).toBeVisible();
    await expect(page.getByText('E2E Test')).toBeVisible();
    await expect(page.getByText('123 Automated Testing Lane')).toBeVisible();
  });

});
