async function run() {
  try {
    const res = await fetch('https://stop-shop-gamma.vercel.app/api/health');
    console.log('Health:', await res.json());
    const res2 = await fetch('https://stop-shop-gamma.vercel.app/_diag');
    console.log('Diag:', await res2.json());
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();
