import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { POST as checkoutPOST } from '../app/api/v1/checkout/route.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import IdempotencyKey from '../models/IdempotencyKey.js';

class MockRequest {
  constructor(body, headers) {
    this.bodyData = body;
    this.headersList = new Map(Object.entries(headers || {}));
    this.url = 'http://localhost/api/checkout';
    this.method = 'POST';
    this.headers = {
      get: (name) => this.headersList.get(name.toLowerCase()) || null,
      forEach: (cb) => this.headersList.forEach(cb),
      entries: () => this.headersList.entries(),
    };
  }

  async json() {
    return this.bodyData;
  }

  clone() {
    return new MockRequest(this.bodyData, Object.fromEntries(this.headersList.entries()));
  }
}


describe('Idempotency Key Concurrent Race-Condition tests', () => {
  beforeAll(async () => {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stopshop_test?replicaSet=rs0';
    if (mongoose.connection.readyState === 0) {
      const connStrWithoutParams = uri.split('?')[0];
      const pathSegments = connStrWithoutParams.split('/');
      const extractedDbName = pathSegments.slice(3).join('/').split('#')[0];
      const dbName = extractedDbName || 'stopshop_test';
      await mongoose.connect(uri, { dbName });
    }

    const prdId = 'PRD-Z5KCUVEHE';
    await Product.findOneAndUpdate(
      { id: prdId },
      {
        $setOnInsert: {
          id: prdId,
          name: 'Comfortable T-Shirt',
          price: 1500,
          colors: ['Blue'],
          sizes: ['M'],
          featuredSection: 'drop',
        },
        $set: {
          quantity: 10,
          stock: 10,
          sizeStock: { M: 10 },
          colorStock: { Blue: 10 },
        }
      },
      { upsert: true }
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should process only one checkout request and return duplicate response for concurrent retries', async () => {
    const prdId = 'PRD-Z5KCUVEHE'; // comfortable t-shirt
    await Product.updateOne({ id: prdId }, { $set: { quantity: 10, stock: 10 } });

    const testKey = 'test-idempotency-key-' + Date.now();
    await IdempotencyKey.deleteMany({ key: testKey });
    await Order.deleteMany({ 'customer.email': 'test@idempotent.com' });


    const checkoutPayload = {
      customer: {
        name: 'Idempotency Tester',
        email: 'test@idempotent.com',
        phone: '03001234567',
        address: '123 Test St',
        city: 'Karachi',
        zip: '75400',
      },
      items: [
        {
          id: prdId,
          name: 'Comfortable T-Shirt',
          price: 1500,
          quantity: 1,
          selectedSize: 'M',
          selectedColor: 'Blue',
        },
      ],
      paymentMethod: 'COD',
      couponCode: '',
      paymentDetails: {},
      total: 1500,
    };


    const req1 = new MockRequest(checkoutPayload, {
      'idempotency-key': testKey,
      'x-request-id': 'req-1',
    });

    const req2 = new MockRequest(checkoutPayload, {
      'idempotency-key': testKey,
      'x-request-id': 'req-2',
    });

    const startPrd = await Product.findOne({ id: prdId }).lean();

    // Concurrent dispatch
    const [res1, res2] = await Promise.all([
      checkoutPOST(req1),
      checkoutPOST(req2),
    ]);

    const body1 = await res1.json();
    const body2 = await res2.json();

    const finalPrd = await Product.findOne({ id: prdId }).lean();
    const createdOrdersCount = await Order.countDocuments({ 'customer.email': 'test@idempotent.com' });

    // Clean up
    console.log('RESPONSE 1 BODY:', body1);
    console.log('RESPONSE 2 BODY:', body2);

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(body1.orderID).toBe(body2.orderID);

    expect(startPrd.quantity - finalPrd.quantity).toBe(1);
    expect(createdOrdersCount).toBe(1);
  });
});
