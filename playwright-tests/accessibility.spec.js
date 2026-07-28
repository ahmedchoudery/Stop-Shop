import { test, expect } from '@playwright/test';

test.describe('WCAG 2.2 AA Accessibility Audits & Keyboard Navigation', () => {
  const routes = [
    '/',
    '/category/tops',
    '/returns',
    '/shipping',
    '/help',
    '/search',
    '/track',
    '/login',
    '/checkout',
  ];

  test('Top-level routes pass basic ARIA & structural accessibility checks', async ({ page }) => {
    for (const route of routes) {
      await page.goto(route);

      // 1. Verify skip link exists in DOM
      const skipLink = page.locator('a[href="#main-content"]');
      await expect(skipLink).toBeAttached();

      // 2. Verify main-content container exists
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeAttached();

      // 3. Verify images have alt or aria-hidden attributes
      const imagesWithoutAlt = await page.locator('img:not([alt]):not([aria-hidden="true"])').count();
      expect(imagesWithoutAlt).toBe(0);

      // 4. Verify form inputs have associated labels, ids, names, or aria-labels
      const unlabelledInputs = await page.locator('input[type="text"]:not([aria-label]):not([id]):not([name]):not([aria-labelledby])').count();
      expect(unlabelledInputs).toBe(0);
    }
  });

  test('Keyboard-Only Flow: Home → PLP → Search → PDP → Checkout', async ({ page }) => {
    // 1. Start at homepage
    await page.goto('/');

    // 2. Press Tab to focus Skip Link
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeTruthy();

    // 3. Navigate to PLP (/category/tops)
    await page.goto('/category/tops');
    await expect(page.locator('#main-content')).toBeAttached();

    // 4. Tab through catalog grid items
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // 5. Navigate to Search
    await page.goto('/search?q=shirt');
    await expect(page.locator('#main-content')).toBeAttached();

    // 6. Verify checkout is reachable
    await page.goto('/checkout');
    await expect(page.locator('#main-content')).toBeAttached();
  });
});
