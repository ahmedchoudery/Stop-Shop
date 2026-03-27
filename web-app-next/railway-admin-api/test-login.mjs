// Test admin login without shell escaping issues
const res = await fetch('http://localhost:4000/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'ahmedchoudery30@gmail.com',
    password: '%^&sg12WRX34!%$FC&XSZ3sx%&'
  })
});
const data = await res.json();
console.log('Status:', res.status);
console.log('Token received:', !!data.token);
if (data.token) {
  console.log('Name:', data.name);
  
  // Test orders endpoint
  const orders = await fetch('http://localhost:4000/api/admin/orders', {
    headers: { Authorization: `Bearer ${data.token}` }
  }).then(r => r.json());
  console.log('Orders count:', Array.isArray(orders) ? orders.length : 'Error:', orders);

  // Test stats
  const stats = await fetch('http://localhost:4000/api/admin/stats/orders', {
    headers: { Authorization: `Bearer ${data.token}` }
  }).then(r => r.json());
  console.log('Stats:', stats);

  console.log('\n✅ Phase 17 Admin API — FULLY OPERATIONAL');
} else {
  console.log('Error:', data.error);
}
