async function run() {
  try {
    const htmlRes = await fetch('https://stop-shop-gamma.vercel.app/');
    const html = await htmlRes.text();
    
    // Find all script tags or assets
    const regex = /\/assets\/[^"'>]+\.js/g;
    const matches = html.match(regex);
    console.log('Compiled JS Assets found on Vercel homepage:', matches);
    
    if (matches && matches.length > 0) {
      for (const assetUrl of matches) {
        const fullUrl = 'https://stop-shop-gamma.vercel.app' + assetUrl;
        console.log('Checking asset:', fullUrl);
        const assetRes = await fetch(fullUrl);
        const code = await assetRes.text();
        if (code.includes('variantImages')) {
          console.log('  -> Contains "variantImages"!');
        }
        if (code.includes('cache-buster') || code.includes('?_t=')) {
          console.log('  -> Contains "?_t=" Cache Buster!');
        }
        if (code.includes('currentImage =')) {
          console.log('  -> Contains "currentImage ="!');
        }
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();
