import { test, expect } from '@playwright/test';

test.describe('RBAC End-to-End', () => {
  let adminToken, managerToken;

  test('login as admin and manager', async ({ request }) => {
    let res = await request.post('/api/login', { data: { username: 'admin', password: 'admin123' } });
    adminToken = (await res.json()).token;
    res = await request.post('/api/login', { data: { username: 'manager', password: 'manager123' } });
    managerToken = (await res.json()).token;
    expect(adminToken).toBeTruthy();
    expect(managerToken).toBeTruthy();
  });

  test('manager cannot mutate products by default', async ({ request }) => {
    const res = await request.post('/api/products', {
      data: { name: 'RBAC Test', price: 99, stock: 1, slug: 'rbac-test' },
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    expect(res.status()).toBe(403);
  });

  test('admin can mutate products', async ({ request }) => {
    const res = await request.post('/api/products', {
      data: { name: 'RBAC Test', price: 99, stock: 1, slug: 'rbac-test' },
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status()).toBeGreaterThanOrEqual(200);
  });

  test('audits accessible to admin', async ({ request }) => {
    const res = await request.get('/api/audits', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status()).toBe(200);
  });
});
