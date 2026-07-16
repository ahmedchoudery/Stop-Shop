import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import EmailOutbox from '../models/EmailOutbox.js';
import SuppressedEmail from '../models/SuppressedEmail.js';
import { GET as cronGET } from '../app/api/v1/cron/email-outbox/route.js';
import dbConnect from '../lib/db.js';

// Setup MockRequest similar to other tests
class MockRequest {
  constructor(url, headers = {}) {
    this.url = url;
    this.headersList = new Map(Object.entries(headers));
    this.headers = {
      get: (name) => this.headersList.get(name.toLowerCase()) || null,
    };
  }
}

describe('Email Outbox Cron & Failover Integration Tests', () => {
  beforeAll(async () => {
    process.env.RESEND_API_KEY = 're_test_key_123';
    process.env.BREVO_API_KEY = 'br_test_key_123';
    await dbConnect();
  });

  beforeEach(async () => {
    await EmailOutbox.deleteMany({});
    await SuppressedEmail.deleteMany({});
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  it('successfully processes pending outbox item using Resend', async () => {
    // 1. Enqueue mock order outbox email
    const idempotencyKey = `STOP-2026-TEST01:Confirmed`;
    await EmailOutbox.create({
      idempotencyKey,
      template: 'order-confirmed-customer',
      to: 'customer@testoutbox.com',
      data: {
        order: {
          orderID: 'STOP-2026-TEST01',
          customer: { name: 'Test User', email: 'customer@testoutbox.com', address: 'DHA Karachi', city: 'Karachi' },
          items: [{ id: 'P1', name: 'Cool Shirt', price: 2000, quantity: 1, selectedSize: 'M', selectedColor: 'White' }],
          total: 2000,
          paymentMethod: 'COD',
        },
      },
      status: 'pending',
      nextAttemptAt: new Date(Date.now() - 5000), // in the past
    });

    // Mock fetch to intercept Resend API dispatch
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      if (url === 'https://api.resend.com/emails') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'resend_msg_123' }),
        };
      }
      return { ok: false, status: 404 };
    });

    // 2. Trigger Outbox Cron GET route
    const req = new MockRequest('http://localhost/api/cron/email-outbox?bypass=true');
    const response = await cronGET(req);
    const resJson = await response.json();

    expect(resJson.success).toBe(true);
    expect(resJson.processedCount).toBe(1);

    // Verify outbox document status updated to sent
    const updated = await EmailOutbox.findOne({ idempotencyKey });
    expect(updated.status).toBe('sent');
    expect(updated.attempts).toBe(1);

    fetchSpy.mockRestore();
  });

  it('skips sending if recipient is on the suppression list', async () => {
    // 1. Add email to suppression list
    const suppressedEmail = 'banned@testoutbox.com';
    await SuppressedEmail.create({ email: suppressedEmail, reason: 'bounce' });

    // 2. Queue outbox email
    const idempotencyKey = `STOP-2026-TEST02:Confirmed`;
    await EmailOutbox.create({
      idempotencyKey,
      template: 'order-confirmed-customer',
      to: suppressedEmail,
      data: {
        order: {
          orderID: 'STOP-2026-TEST02',
          customer: { name: 'Suppressed User', email: suppressedEmail, address: 'DHA Karachi', city: 'Karachi' },
          items: [{ id: 'P1', name: 'Cool Shirt', price: 2000, quantity: 1 }],
          total: 2000,
          paymentMethod: 'COD',
        },
      },
      status: 'pending',
      nextAttemptAt: new Date(Date.now() - 5000),
    });

    const fetchSpy = vi.spyOn(global, 'fetch');

    // 3. Trigger Outbox Cron GET route
    const req = new MockRequest('http://localhost/api/cron/email-outbox?bypass=true');
    const response = await cronGET(req);
    const resJson = await response.json();

    expect(resJson.success).toBe(true);
    expect(resJson.processedCount).toBe(1);

    // Verify outbox document status updated to sent, but fetch was never called
    const updated = await EmailOutbox.findOne({ idempotencyKey });
    expect(updated.status).toBe('sent');
    expect(updated.lastError).toContain('suppression list');

    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('triggers auto-failover to Brevo after 3 Resend 5xx errors', async () => {
    // 1. Clear outbox queue
    await EmailOutbox.deleteMany({});

    // 2. Enqueue 4 outbox items
    for (let i = 1; i <= 4; i++) {
      await EmailOutbox.create({
        idempotencyKey: `STOP-FAILOVER-0${i}:Confirmed`,
        template: 'order-confirmed-customer',
        to: `failover${i}@test.com`,
        data: {
          order: {
            orderID: `STOP-FAILOVER-0${i}`,
            customer: { name: `User ${i}`, email: `failover${i}@test.com`, address: 'DHA Karachi', city: 'Karachi' },
            items: [{ id: 'P1', name: 'Cool Shirt', price: 2000, quantity: 1 }],
            total: 2000,
            paymentMethod: 'COD',
          },
        },
        status: 'pending',
        nextAttemptAt: new Date(Date.now() - 5000),
      });
    }

    // Mock fetch: Resend returns 500 Internals; Brevo returns 201 Created
    let resendCalls = 0;
    let brevoCalls = 0;

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      if (url === 'https://api.resend.com/emails') {
        resendCalls++;
        return {
          ok: false,
          status: 500,
          text: async () => 'Internal Server Error',
        };
      }
      if (url === 'https://api.brevo.com/v3/smtp/email') {
        brevoCalls++;
        return {
          ok: true,
          status: 201,
          json: async () => ({ messageId: 'brevo_msg_123' }),
        };
      }
      return { ok: false, status: 404 };
    });

    // 3. Trigger Outbox Cron
    const req = new MockRequest('http://localhost/api/cron/email-outbox?bypass=true');
    const response = await cronGET(req);
    const resJson = await response.json();

    expect(resJson.success).toBe(true);

    // Verify failover calls:
    // First 3 items fail Resend 500, then immediate failover triggers Brevo.
    // The 4th item should bypass Resend entirely and route directly to Brevo!
    expect(resendCalls).toBe(3);
    expect(brevoCalls).toBe(2); // 3rd and 4th items succeeded via Brevo

    // Clear failures from provider memory for clean state
    fetchSpy.mockRestore();
  });
});
