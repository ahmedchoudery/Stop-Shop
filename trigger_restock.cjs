async function run() {
  const url = 'https://stop-shop-gamma.vercel.app/api/v1/cron/restock-notify?bypass=true';

  console.log('Sending GET request to:', url);
  try {
    const res = await fetch(url);
    console.log('Response Status:', res.status);
    const text = await res.text();
    console.log('Response Body:', text);
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

run();
