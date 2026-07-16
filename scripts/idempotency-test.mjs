import { spawn } from 'child_process';
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import IdempotencyKey from '../src/models/IdempotencyKey.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stopshop_test?replicaSet=rs0';
const PORT = 3009;
const prdId = 'PRD-IDEMPOTENCY-TEST';

async function main() {
  console.log('🏁 Starting Idempotency Test...');

  // 1. Connect to DB and seed
  if (mongoose.connection.readyState === 0) {
    const connStrWithoutParams = MONGODB_URI.split('?')[0];
    const pathSegments = connStrWithoutParams.split('/');
    const extractedDbName = pathSegments.slice(3).join('/').split('#')[0];
    const dbName = extractedDbName || (process.env.NODE_ENV === 'test' ? 'stopshop_test' : 'stopshop');
    if (dbName === 'stopshop') {
      console.error('🚨 FATAL: Refusing to run idempotency-test against production database "stopshop".');
      process.exit(1);
    }
    await mongoose.connect(MONGODB_URI, { dbName });
  }

  // Delete any existing test data
  await Product.deleteOne({ id: prdId });
  await Order.deleteMany({ 'customer.email': 'idempotency-test@stop-shop-test.com' });
  await IdempotencyKey.deleteMany({ key: 'idempotency-test-key' });

  // Seed product with variant stock = 10
  const testProduct = await Product.create({
    id: prdId,
    name: 'Idempotency Test Hoodie',
    price: 3000,
    quantity: 10,
    stock: 10,
    colors: ['Black'],
    sizes: ['M'],
    sizeStock: { M: 10 },
    colorStock: { Black: 10 },
    variantMatrix: { 'Black|M': 10 },
    featuredSection: 'pieces',
  });
  console.log(`✅ Product seeded: ${testProduct.name} with stock = 10`);

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

  // 3. Fire 5 serial requests with the same Idempotency-Key
  console.log('🔥 Dispatching 5 sequential requests with the same Idempotency-Key...');
  const responses = [];
  const idempotencyKey = 'idempotency-test-key';
  const payload = {
    customer: {
      name: 'Idempotency Customer',
      email: 'idempotency-test@stop-shop-test.com',
      phone: '03001234567',
      address: '123 Idempotency St',
      city: 'Karachi',
      zip: '75000',
    },
    items: [
      {
        id: prdId,
        name: 'Idempotency Test Hoodie',
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

  for (let i = 0; i < 5; i++) {
    console.log(`  Sending request ${i + 1}...`);
    const res = await fetch(`http://127.0.0.1:${PORT}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    });
    const status = res.status;
    const body = await res.json().catch(() => ({}));
    responses.push({ status, body });
    // wait a small interval
    await new Promise(r => setTimeout(r, 200));
  }

  // 4. Assertions
  const firstRes = responses[0];
  const firstOrderId = firstRes.body.orderID;

  let allMatches = true;
  let allStatusesMatch = true;

  console.log('✅ Responses collected. Performing assertions...');
  responses.forEach((res, index) => {
    console.log(`  Request ${index + 1}: Status = ${res.status}, Order ID = ${res.body.orderID}`);
    if (res.status !== firstRes.status) {
      allStatusesMatch = false;
    }
    if (res.body.orderID !== firstOrderId) {
      allMatches = false;
    }
  });

  // Verify only 1 order created in DB
  const ordersInDb = await Order.find({ 'customer.email': 'idempotency-test@stop-shop-test.com' });
  console.log(`📊 Number of orders in DB: ${ordersInDb.length}`);

  // Refresh stock from DB to make sure it was only decremented by 1
  const finalProduct = await Product.findOne({ id: prdId });
  const finalStock = finalProduct ? finalProduct.quantity : -1;
  console.log(`📊 Final stock in DB: ${finalStock}`);

  // Cleanup DB
  await Product.deleteOne({ id: prdId });
  await Order.deleteMany({ 'customer.email': 'idempotency-test@stop-shop-test.com' });
  await IdempotencyKey.deleteMany({ key: 'idempotency-test-key' });
  await mongoose.connection.close();

  // Stop Server
  console.log('🧹 Shutting down test server...');
  server.kill('SIGINT');

  if (allStatusesMatch && allMatches && ordersInDb.length === 1 && finalStock === 9) {
    console.log('🎉 SUCCESS: Idempotency safety verified successfully!');
    process.exit(0);
  } else {
    console.error('❌ FAILURE: Idempotency test failed.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Test execution failed with error:', err.message);
  process.exit(1);
});
