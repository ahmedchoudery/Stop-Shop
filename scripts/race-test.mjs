import { spawn } from 'child_process';
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import IdempotencyKey from '../src/models/IdempotencyKey.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stopshop_test?replicaSet=rs0';
const PORT = 3009;
const prdId = 'PRD-RACE-TEST';

async function main() {
  console.log('🏁 Starting Race Condition Concurrency Test...');

  // 1. Connect to DB and seed
  if (mongoose.connection.readyState === 0) {
    const connStrWithoutParams = MONGODB_URI.split('?')[0];
    const pathSegments = connStrWithoutParams.split('/');
    const extractedDbName = pathSegments.slice(3).join('/').split('#')[0];
    const dbName = extractedDbName || (process.env.NODE_ENV === 'test' ? 'stopshop_test' : 'stopshop');
    await mongoose.connect(MONGODB_URI, { dbName });
  }

  // Delete any existing test data
  await Product.deleteOne({ id: prdId });
  await Order.deleteMany({ 'customer.email': { $regex: /race-test-.*@stop-shop-test\.com/ } });
  await IdempotencyKey.deleteMany({ key: { $regex: /race-key-.*/ } });

  // Seed product with variant stock = 1
  const testProduct = await Product.create({
    id: prdId,
    name: 'Race Test Hoodie',
    price: 3000,
    quantity: 1,
    stock: 1,
    colors: ['Black'],
    sizes: ['M'],
    sizeStock: { M: 1 },
    colorStock: { Black: 1 },
    variantMatrix: { 'Black|M': 1 },
    featuredSection: 'pieces',
  });
  console.log(`✅ Product seeded: ${testProduct.name} with stock = 1`);

  // 2. Start Next.js Server on PORT 3009
  console.log(`🚀 Spawning Next.js server on port ${PORT}...`);
  const server = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
    stdio: 'ignore',
    shell: true,
  });

  // Helper to check if server is up
  const healthUrl = `http://127.0.0.1:${PORT}/api/v1/health`;
  let isServerUp = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(healthUrl);
      if (res.ok) {
        isServerUp = true;
        break;
      }
    } catch (e) {
      // wait
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  if (!isServerUp) {
    server.kill('SIGINT');
    throw new Error('Failed to start Next.js test server');
  }
  console.log('✅ Next.js test server is ready!');

  // 3. Fire 20 parallel requests
  console.log('🔥 Dispatching 20 concurrent checkout requests...');
  const requests = Array.from({ length: 20 }).map((_, index) => {
    const email = `race-test-${index}@stop-shop-test.com`;
    const idempotencyKey = `race-key-${index}-${Date.now()}`;
    const payload = {
      customer: {
        name: `Race Customer ${index}`,
        email,
        phone: '03001234567',
        address: '123 Race St',
        city: 'Lahore',
        zip: '54000',
      },
      items: [
        {
          id: prdId,
          name: 'Race Test Hoodie',
          price: 3000,
          quantity: 1,
          selectedSize: 'M',
          selectedColor: 'Black',
        },
      ],
      paymentMethod: 'COD',
      couponCode: '',
      paymentDetails: {},
      total: 3000,
    };

    return fetch(`http://127.0.0.1:${PORT}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    });
  });

  const responses = await Promise.all(requests);
  console.log('✅ All requests completed. Analyzing results...');

  // 4. Assertions
  let successCount = 0;
  let conflictCount = 0;
  let otherCount = 0;

  for (const res of responses) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 201) {
      successCount++;
      console.log(`  [Success] Status 201: Order ID = ${body.orderID}`);
    } else if (res.status === 409) {
      conflictCount++;
      if (body.error?.code === 'OUT_OF_STOCK') {
        console.log('  [Conflict] Status 409: Code OUT_OF_STOCK');
      } else {
        console.log(`  [Conflict] Status 409: Unexpected error code: ${JSON.stringify(body.error)}`);
      }
    } else {
      otherCount++;
      console.log(`  [Error] Status ${res.status}: ${JSON.stringify(body)}`);
    }
  }

  // Refresh stock from DB
  const finalProduct = await Product.findOne({ id: prdId });
  const finalStock = finalProduct ? finalProduct.quantity : -1;
  console.log(`📊 Final database stock for variant: ${finalStock}`);

  // Cleanup DB
  await Product.deleteOne({ id: prdId });
  await Order.deleteMany({ 'customer.email': { $regex: /race-test-.*@stop-shop-test\.com/ } });
  await IdempotencyKey.deleteMany({ key: { $regex: /race-key-.*/ } });
  await mongoose.connection.close();

  // Stop Server
  console.log('🧹 Shutting down test server...');
  server.kill('SIGINT');

  console.log(`--- Summary ---`);
  console.log(`Success: ${successCount}`);
  console.log(`Conflict: ${conflictCount}`);
  console.log(`Other: ${otherCount}`);
  console.log(`Final Stock: ${finalStock}`);

  if (successCount === 1 && conflictCount === 19 && finalStock === 0) {
    console.log('🎉 SUCCESS: Concurrency safety verified successfully!');
    process.exit(0);
  } else {
    console.error('❌ FAILURE: Race condition test failed.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Test execution failed with error:', err.message);
  process.exit(1);
});
