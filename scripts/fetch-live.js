async function run() {
  try {
    const res = await fetch('https://stop-shop-gamma.vercel.app/api/public/products');
    if (!res.ok) throw new Error('status ' + res.status);
    const products = await res.json();
    console.log('Total products from live Vercel:', products.length);
    products.forEach(p => {
      console.log(`Product ID: ${p.id}, Name: ${p.name}`);
      console.log(`  image: "${p.image}"`);
      console.log(`  gallery:`, p.gallery);
      console.log(`  variantImages:`, p.variantImages);
      console.log('--------------------------------------------------');
    });
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

run();
