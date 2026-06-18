import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockProductExists, mockNotificationCreate } = vi.hoisted(() => ({
  mockProductExists: vi.fn(),
  mockNotificationCreate: vi.fn(),
}));

vi.mock('../lib/db.js', () => ({
  default: vi.fn().mockResolvedValue(true),
  dbConnect: vi.fn().mockResolvedValue(true),
}));

vi.mock('../models/Product.js', () => ({
  default: {
    exists: mockProductExists,
  },
}));

vi.mock('../models/ProductNotification.js', () => ({
  default: {
    create: mockNotificationCreate,
  },
}));

import { POST } from '../app/api/public/notify-me/route.js';

describe('POST /api/public/notify-me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const makeJsonRequest = (body) => {
    return {
      json: async () => body,
    };
  };

  it('should reject requests with missing email', async () => {
    const req = makeJsonRequest({ productId: 'PRD-1' });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Email is required');
  });

  it('should reject requests with invalid email format', async () => {
    const req = makeJsonRequest({ email: 'invalid-email', productId: 'PRD-1' });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Enter a valid email address');
  });

  it('should reject requests with missing productId', async () => {
    const req = makeJsonRequest({ email: 'customer@domain.com' });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Product ID is required');
  });

  it('should reject if referenced product does not exist', async () => {
    mockProductExists.mockResolvedValueOnce(null);
    const req = makeJsonRequest({ email: 'customer@domain.com', productId: 'PRD-NOTFOUND' });
    const response = await POST(req);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Product not found');
  });

  it('should successfully save a valid request', async () => {
    mockProductExists.mockResolvedValueOnce({ _id: 'prod-id' });
    mockNotificationCreate.mockResolvedValueOnce({ _id: 'notif-id' });

    const req = makeJsonRequest({
      email: 'customer@domain.com',
      productId: 'PRD-1',
      selectedSize: 'M',
      selectedColor: 'Charcoal',
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.message).toContain('Notification request saved');
    expect(mockNotificationCreate).toHaveBeenCalledWith({
      email: 'customer@domain.com',
      productId: 'PRD-1',
      selectedSize: 'M',
      selectedColor: 'Charcoal',
      notified: false,
    });
  });

  it('should return 200 OK and friendly message if already registered (duplicate index check)', async () => {
    mockProductExists.mockResolvedValueOnce({ _id: 'prod-id' });
    const duplicateError = new Error('Duplicate key');
    duplicateError.code = 11000;
    mockNotificationCreate.mockRejectedValueOnce(duplicateError);

    const req = makeJsonRequest({
      email: 'customer@domain.com',
      productId: 'PRD-1',
      selectedSize: 'M',
      selectedColor: 'Charcoal',
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toContain('already on the notification list');
  });
});
