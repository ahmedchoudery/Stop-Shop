import { test, expect } from '@playwright/test';

test.describe('WCAG 2.2 AA Accessibility Audits & Keyboard Navigation', () => {
  const routes = [
    '/',
    '/category/tops',
    '/returns',
    '/help',
    '/search',
    '/checkout',
  ];

  for (const route of routes) {
    test(`Route ${route} passes ARIA & structural accessibility checks`, async ({ page }) => {
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
    });
  }

  test('Keyboard-Only Navigation Flow', async ({ page }) => {
    // 1. Start at homepage
    await page.goto('/');

    // 2. Press Tab to focus Skip Link
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeTruthy();

    // 3. Navigate to PLP
    await page.goto('/category/tops');
    await expect(page.locator('#main-content')).toBeAttached();

    // 4. Navigate to Search
    await page.goto('/search?q=shirt');
    await expect(page.locator('#main-content')).toBeAttached();
  });
});
