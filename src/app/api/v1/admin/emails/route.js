import { withRoute, ApiError } from '@/lib/api/withRoute';
import mongoose from 'mongoose';
import EmailOutbox from '@/models/EmailOutbox';
import SuppressedEmail from '@/models/SuppressedEmail';
import ProductNotification from '@/models/ProductNotification';
import Product from '@/models/Product';
import { render } from '@react-email/render';
import React from 'react';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Import templates
import OrderConfirmedCustomer from '@/emails/order-confirmed-customer';
import OrderConfirmedAdmin from '@/emails/order-confirmed-admin';
import OrderPaidCustomer from '@/emails/order-paid-customer';
import OrderPaidAdmin from '@/emails/order-paid-admin';
import OrderShippedCustomer from '@/emails/order-shipped-customer';
import OrderShippedAdmin from '@/emails/order-shipped-admin';
import OrderDeliveredCustomer from '@/emails/order-delivered-customer';
import OrderDeliveredAdmin from '@/emails/order-delivered-admin';
import OrderCancelledCustomer from '@/emails/order-cancelled-customer';
import OrderCancelledAdmin from '@/emails/order-cancelled-admin';
import OrderPaymentFailedCustomer from '@/emails/order-payment-failed-customer';
import OrderPaymentFailedAdmin from '@/emails/order-payment-failed-admin';
import OrderRefundedCustomer from '@/emails/order-refunded-customer';
import OrderRefundedAdmin from '@/emails/order-refunded-admin';
import LowStockAlertAdminEmail from '@/emails/low-stock-alert-admin';

const TEMPLATES = {
  'order-confirmed-customer': OrderConfirmedCustomer,
  'order-confirmed-admin': OrderConfirmedAdmin,
  'order-paid-customer': OrderPaidCustomer,
  'order-paid-admin': OrderPaidAdmin,
  'order-shipped-customer': OrderShippedCustomer,
  'order-shipped-admin': OrderShippedAdmin,
  'order-delivered-customer': OrderDeliveredCustomer,
  'order-delivered-admin': OrderDeliveredAdmin,
  'order-cancelled-customer': OrderCancelledCustomer,
  'order-cancelled-admin': OrderCancelledAdmin,
  'order-payment-failed-customer': OrderPaymentFailedCustomer,
  'order-payment-failed-admin': OrderPaymentFailedAdmin,
  'order-refunded-customer': OrderRefundedCustomer,
  'order-refunded-admin': OrderRefundedAdmin,
  'low-stock-alert-admin': LowStockAlertAdminEmail,
};

// Mock data to preview templates if no outbox item is available
const MOCK_PREVIEW_DATA = {
  order: {
    orderID: 'STOP-2026-000421',
    customer: {
      name: 'Ahmed Khan',
      email: 'customer@example.com',
      phone: '03001234567',
      address: 'House 123, Street 5, Phase 8, DHA',
      city: 'Karachi',
      zip: '75500',
    },
    items: [
      { id: '1', name: 'Premium Oxford Shirt', price: 2500, quantity: 2, selectedSize: 'M', selectedColor: '#ffffff | White' },
      { id: '2', name: 'Slim Fit Chino Pants', price: 3500, quantity: 1, selectedSize: '32', selectedColor: '#e5e7eb | Beige' },
    ],
    total: 8500,
    paymentMethod: 'COD',
    courier: 'TCS Express',
    trackingNumber: 'TCS78912345',
    notes: 'Please call before delivery.',
  },
  customerPastOrderCount: 3,
  // Low-stock fallback preview fields
  productId: 'PRD-998877',
  productName: 'Premium Oxford Shirt',
  productImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
  variantId: 'White | M',
  currentStock: 2,
  salesVelocity: 14,
  threshold: 5,
};

export const GET = withRoute({
  requiredRole: 'admin',
  schema: {
    query: z.object({
      type: z.enum(['outbox', 'suppression', 'preview', 'notifications']).default('outbox'),
      status: z.string().optional(),
      page: z.string().transform(val => Math.max(1, parseInt(val) || 1)).default('1'),
      limit: z.string().transform(val => Math.max(1, parseInt(val) || 10)).default('10'),
      idempotencyKey: z.string().optional(),
      template: z.string().optional(),
    }),
  },
  handler: async ({ query }) => {
    const { type, status, page, limit, idempotencyKey, template } = query;

    if (type === 'preview') {
      const activeTemplate = template || 'order-confirmed-customer';
      const TemplateComponent = TEMPLATES[activeTemplate];
      if (!TemplateComponent) {
        throw new ApiError('NOT_FOUND', `Template ${activeTemplate} not found`, 404);
      }

      // If idempotencyKey is provided, load its actual data
      let renderData = MOCK_PREVIEW_DATA;
      if (idempotencyKey) {
        const item = await EmailOutbox.findOne({ idempotencyKey }).lean();
        if (item && item.data) {
          renderData = item.data;
        }
      }

      const html = render(React.createElement(TemplateComponent, renderData));
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (type === 'suppression') {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        SuppressedEmail.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        SuppressedEmail.countDocuments(),
      ]);

      return {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }

    if (type === 'notifications') {
      const skip = (page - 1) * limit;
      const [rawItems, total] = await Promise.all([
        ProductNotification.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ProductNotification.countDocuments(),
      ]);

      const productIds = [...new Set(rawItems.map(item => item.productId))];
      const products = await Product.find({
        $or: [
          { id: { $in: productIds } },
          { _id: { $in: productIds.filter(id => mongoose.isValidObjectId(id)) } }
        ]
      }).lean();

      const productMap = {};
      products.forEach(p => {
        productMap[p.id] = p;
        productMap[p._id.toString()] = p;
      });

      const items = rawItems.map(item => ({
        ...item,
        _id: item._id.toString(),
        productName: productMap[item.productId]?.name || 'Unknown Product',
        productImage: productMap[item.productId]?.image || '',
      }));

      return {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }

    // Default: list outbox
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (idempotencyKey) {
      filter.idempotencyKey = new RegExp(idempotencyKey, 'i');
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      EmailOutbox.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      EmailOutbox.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
});

export const POST = withRoute({
  requiredRole: 'admin',
  schema: {
    body: z.object({
      action: z.enum(['resend', 'suppress', 'unsuppress']),
      idempotencyKey: z.string().optional(),
      email: z.string().optional(),
      reason: z.string().optional(),
    }),
  },
  handler: async ({ body }) => {
    const { action, idempotencyKey, email, reason } = body;

    if (action === 'resend') {
      if (!idempotencyKey) {
        throw new ApiError('VALIDATION', 'idempotencyKey is required for resend action', 400);
      }

      const item = await EmailOutbox.findOne({ idempotencyKey });
      if (!item) {
        throw new ApiError('NOT_FOUND', 'Outbox email record not found', 404);
      }

      item.status = 'pending';
      item.attempts = 0;
      item.nextAttemptAt = new Date();
      item.lastError = '';
      await item.save();

      return { success: true, message: 'Email status reset to pending' };
    }

    if (action === 'suppress') {
      if (!email) {
        throw new ApiError('VALIDATION', 'Email address is required for suppress action', 400);
      }

      const lowercaseEmail = email.toLowerCase().trim();
      const item = await SuppressedEmail.findOneAndUpdate(
        { email: lowercaseEmail },
        { email: lowercaseEmail, reason: reason || 'manual' },
        { upsert: true, new: true }
      );

      return { success: true, message: `${lowercaseEmail} added to suppression list`, data: item };
    }

    if (action === 'unsuppress') {
      if (!email) {
        throw new ApiError('VALIDATION', 'Email address is required for unsuppress action', 400);
      }

      const lowercaseEmail = email.toLowerCase().trim();
      const res = await SuppressedEmail.deleteOne({ email: lowercaseEmail });

      if (res.deletedCount === 0) {
        throw new ApiError('NOT_FOUND', `${lowercaseEmail} not found in suppression list`, 404);
      }

      return { success: true, message: `${lowercaseEmail} removed from suppression list` };
    }
  },
});
