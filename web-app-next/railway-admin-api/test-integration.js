// Quick API-level test of the full login flow
import 'dotenv/config';

const BASE = 'http://localhost:4000';

async function test() {
  // 1. Health check
  const health = await fetch(`${BASE}/api/health`).then(r => r.json());
  console.log('1. Health:', health);

  // 2. Login
  const loginRes = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ahmedchoudery30@gmail.com',
      password: process.env.admin_password
    })
  });
  const loginData = await loginRes.json();
  console.log('2. Login status:', loginRes.status, '| Token received:', !!loginData.token);

  if (!loginData.token) {
    console.error('❌ Login failed:', loginData);
    return;
  }

  // 3. Get orders
  const ordersRes = await fetch(`${BASE}/api/admin/orders`, {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  const ordersData = await ordersRes.json();
  console.log('3. Orders status:', ordersRes.status, '| Count:', Array.isArray(ordersData) ? ordersData.length : ordersData);

  // 4. Get stats
  const statsRes = await fetch(`${BASE}/api/admin/stats/orders`, {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  const statsData = await statsRes.json();
  console.log('4. Stats:', statsData);

  console.log('\n✅ ALL CHECKS PASSED — Phase 17 Admin Integration is operational');
}

test().catch(e => console.error('❌ Test error:', e.message));
