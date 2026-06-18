import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to declare the mock function so it is available inside the hoisted vi.mock factory.
const { mockSendMail } = vi.hoisted(() => ({
  mockSendMail: vi.fn().mockResolvedValue(true),
}));

// Mock mongoose models used by emailService
vi.mock('../models/Product.js', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('../models/Coupon.js', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

// Mock nodemailer using the hoisted mockSendMail
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

// Import emailService functions AFTER mocking
import {
  sendEmail,
  sendAdminNewOrderNotification,
  sendOrderFailedEmail,
  sendOrderStatusEmail,
} from '../services/emailService.js';

describe('Email Service Integration Tests', () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'production'; // so sendEmail doesn't skip dummy addresses
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  describe('sendEmail via Resend / Nodemailer', () => {
    it('should fall back to Nodemailer SMTP when RESEND_API_KEY is not defined', async () => {
      delete process.env.RESEND_API_KEY;
      process.env.EMAIL_USER = 'test@gmail.com';
      process.env.EMAIL_PASS = 'testpass';

      await sendEmail({
        to: 'customer@domain.com',
        subject: 'Hello',
        html: '<p>Test</p>',
      });

      expect(mockSendMail).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should call Resend REST API when RESEND_API_KEY is defined', async () => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      process.env.RESEND_FROM_EMAIL = 'Stop & Shop <orders@stop-shop.com>';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'resend_email_id_123' }),
      });

      await sendEmail({
        to: 'customer@domain.com',
        subject: 'Hello Resend',
        html: '<p>Test Resend</p>',
      });

      expect(mockFetch).toHaveBeenCalledWith('https://api.resend.com/emails', expect.any(Object));
      const fetchArgs = mockFetch.mock.calls[0];
      const requestOptions = fetchArgs[1];
      
      expect(requestOptions.method).toBe('POST');
      expect(requestOptions.headers['Authorization']).toBe('Bearer re_test_key_123');
      
      const body = JSON.parse(requestOptions.body);
      expect(body.from).toBe('Stop & Shop <orders@stop-shop.com>');
      expect(body.to).toEqual(['customer@domain.com']);
      expect(body.subject).toBe('Hello Resend');
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('sendAdminNewOrderNotification', () => {
    it('should dispatch a new order notification email to the admin address', async () => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      process.env.ADMIN_EMAIL = 'admin@stop-shop.com';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_order_notif' }),
      });

      const mockOrder = {
        orderID: 'ORD-SUCCESS123',
        customer: { name: 'Alice Customer', phone: '03001122334', email: 'alice@customer.com' },
        total: 4500,
        paymentMethod: 'Easypaisa',
        paymentDetails: { status: 'Paid' },
      };

      await sendAdminNewOrderNotification(mockOrder);

      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.to).toEqual(['admin@stop-shop.com']);
    });
  });

  describe('sendOrderFailedEmail', () => {
    it('should notify both customer and admin on failed transaction', async () => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      process.env.ADMIN_EMAIL = 'admin@stop-shop.com';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'failed_notif' }),
      });

      const mockOrder = {
        orderID: 'ORD-FAIL123',
        customer: { name: 'Bob Customer', phone: '03009988776', email: 'bob@customer.com' },
        total: 6200,
        paymentMethod: 'ATM Card',
      };

      await sendOrderFailedEmail(mockOrder, 'Insufficient funds on credit card');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      const calls = mockFetch.mock.calls;
      const bodyCustomer = JSON.parse(calls[0][1].body);
      const bodyAdmin = JSON.parse(calls[1][1].body);

      expect(bodyCustomer.to).toEqual(['bob@customer.com']);
      expect(bodyCustomer.subject).toContain('Payment Failed');
      expect(bodyCustomer.html).toContain('Insufficient funds');

      expect(bodyAdmin.to).toEqual(['admin@stop-shop.com']);
      expect(bodyAdmin.subject).toContain('Order Payment Failed');
    });
  });

  describe('sendOrderStatusEmail', () => {
    const mockOrder = {
      orderID: 'ORD-STATUS123',
      customer: { name: 'Charlie Customer', email: 'charlie@customer.com' },
      total: 3500,
    };

    beforeEach(() => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'status_updated' }),
      });
    });

    it('should send "Payment verified" email when status is Paid', async () => {
      await sendOrderStatusEmail(mockOrder, 'Paid');
      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.subject).toContain('Payment verified successfully');
      expect(body.html).toContain('received and verified your payment');
    });

    it('should send "Order dispatched" email when status is Shipped', async () => {
      await sendOrderStatusEmail(mockOrder, 'Shipped');
      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.subject).toContain('has been dispatched');
    });

    it('should send "Order arrived" email when status is Delivered', async () => {
      await sendOrderStatusEmail(mockOrder, 'Delivered');
      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.subject).toContain('has arrived');
    });

    it('should send "Order failed" email when status is Failed', async () => {
      await sendOrderStatusEmail(mockOrder, 'Failed');
      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.subject).toContain('fulfillment failed');
    });
  });
});
