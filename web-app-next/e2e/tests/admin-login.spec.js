import { test, expect } from '@playwright/test'

test('admin login works', async ({ page }) => {
  // Go to admin login page
  await page.goto('/admin')
  // Fill login form
  await page.fill('input[placeholder="Username"]', 'admin')
  await page.fill('input[placeholder="Password"]', 'admin123')
  await page.click('button:has-text("Login")')
  // Expect to reach admin panel
  await expect(page).toHaveURL(/admin/)
})
