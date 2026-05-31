async function check(url) {
  try {
    const res = await fetch(url);
    console.log(url);
    console.log('  Status:', res.status);
    console.log('  Content-Type:', res.headers.get('content-type'));
    console.log('  Content-Length:', res.headers.get('content-length'));
    const buffer = await res.arrayBuffer();
    console.log('  Buffer byteLength:', buffer.byteLength);
  } catch (err) {
    console.error(url, '-> Error:', err.message);
  }
}

async function run() {
  await check("https://res.cloudinary.com/dbxm4lhqa/image/upload/f_auto,q_auto/v1780264405/stopshop/rgtetgfgxfv04q1fecrt.jpg");
  await check("https://res.cloudinary.com/dbxm4lhqa/image/upload/v1780263576/stopshop/hot5ay1dc3obftffjbfo.webp");
  await check("https://res.cloudinary.com/dbxm4lhqa/image/upload/v1780263668/stopshop/yrbj4omctcykebfszb4p.webp");
}

run();
