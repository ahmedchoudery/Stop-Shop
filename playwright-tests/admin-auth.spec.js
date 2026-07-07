import { test, expect } from '@playwright/test';
import crypto from 'crypto';

// Re-implement lightweight base32 decoding for the test context
function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.replace(/=+$/, '').toUpperCase();
  const out = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) throw new Error('Invalid base32 char');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

// Generate active TOTP code dynamically for E2E validation
function generateTotp(secret) {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);

  const countBuf = Buffer.alloc(8);
  countBuf.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(countBuf);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0xf;
  const binary = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);

  return (binary % 1000000).toString().padStart(6, '0');
}

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

  test('Admin Login Flow -> 2FA Setup -> Verify and Access Admin Dashboard', async ({ page }) => {
    // Intercept login API response to retrieve generated TOTP secret
    let secret = '';
    await page.route('**/api/admin/login', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      if (json.secret) {
        secret = json.secret;
      }
      await route.fulfill({ response, json });
    });

    // 1. Visit Login page
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Stop & Shop');

    // 2. Submit credentials (pre-seeded default admin)
    await page.fill('input[name="email"]', 'ahmedchoudery30@gmail.com');
    await page.fill('input[name="password"]', 'vxSk9mUi0/NX6IvZ!Aa1');
    await page.click('button[type="submit"]');

    // 3. Page should transition to 2FA Setup screen (since user is logging in for the first time)
    await expect(page.locator('text=Enable Two-Factor (2FA)')).toBeVisible({ timeout: 10000 });
    
    // Generate valid TOTP code
    expect(secret).not.toBe('');
    const totpCode = generateTotp(secret);

    // 4. Fill code and submit setup
    await page.fill('input[placeholder="000000"]', totpCode);
    await page.click('button:has-text("Verify & Enable 2FA")');

    // 5. Successful login leads to /admin dashboard
    await page.waitForURL('**/admin', { timeout: 10000 });
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible();

    // 6. Test login again after 2FA is activated (verification flow)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'ahmedchoudery30@gmail.com');
    await page.fill('input[name="password"]', 'vxSk9mUi0/NX6IvZ!Aa1');
    await page.click('button[type="submit"]');

    // User is prompted for 2FA Verification (not setup)
    await expect(page.locator('text=Security Verification')).toBeVisible({ timeout: 10000 });
    
    const nextTotpCode = generateTotp(secret);
    await page.fill('input[placeholder="000000"]', nextTotpCode);
    await page.click('button:has-text("Verify Identity")');

    await page.waitForURL('**/admin', { timeout: 10000 });
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible();
  });

});
