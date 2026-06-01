import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const getEnv = (...keys) => keys.map(k => process.env[k]).find(Boolean);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: getEnv('EMAIL_USER', 'email_user'),
    pass: getEnv('EMAIL_PASS', 'email_pass'),
  },
});

export const sendEmail = async (options) => {
  try {
    await transporter.sendMail(options);
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
  }
};

const LOW_STOCK_THRESHOLD = 3;

const buildIdQuery = (idParam) => {
  return mongoose.isValidObjectId(idParam)
    ? { $or: [{ id: idParam }, { _id: idParam }] }
    : { id: idParam };
};

/**
 * Checks stock levels after checkout and sends a consolidated
 * email alert listing ALL low-stock items in one email.
 * Never throws — runs fire-and-forget.
 */
export const checkAndAlertLowStock = async (purchasedItems) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || getEnv('EMAIL_USER');
    if (!adminEmail) return; // No admin email configured

    // Find which purchased items now have low stock
    const lowStockItems = [];

    await Promise.all(purchasedItems.map(async (item) => {
      const product = await Product.findOne(buildIdQuery(item.id)).select('name quantity id').lean();
      if (!product) return;

      const remaining = product.quantity ?? 0;
      if (remaining <= LOW_STOCK_THRESHOLD) {
        lowStockItems.push({
          name:      product.name,
          id:        product.id || item.id,
          remaining,
        });
      }
    }));

    if (!lowStockItems.length) return;

    // Sort: 0 stock first, then ascending
    lowStockItems.sort((a, b) => a.remaining - b.remaining);

    const subject = `⚠️ Low Stock Alert — ${lowStockItems.length} item${lowStockItems.length !== 1 ? 's' : ''} need restocking`;

    const itemRows = lowStockItems.map(item =>
      `  • ${item.name} (SKU: ${item.id}) — ${item.remaining === 0 ? '🔴 OUT OF STOCK' : `🟡 ${item.remaining} left`}`
    ).join('\n');

    const text = `
Stop & Shop — Low Stock Alert
==============================

The following items need restocking after a recent order:

${itemRows}

Restock these items in your Admin Panel:
https://stop-shop-gamma.vercel.app/admin/inventory

This is an automated message from your Stop & Shop store.
    `.trim();

    await sendEmail({
      to:      adminEmail,
      subject,
      text,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ba1f3d; padding: 20px 30px;">
            <h1 style="color: white; margin: 0; font-size: 18px; letter-spacing: 2px; text-transform: uppercase;">
              ⚠️ Low Stock Alert
            </h1>
          </div>
          <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb;">
            <p style="color: #374151; font-size: 14px; margin-top: 0;">
              The following items need restocking after a recent order:
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; border-bottom: 1px solid #e5e7eb;">Product</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; border-bottom: 1px solid #e5e7eb;">SKU</th>
                  <th style="padding: 10px 12px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; border-bottom: 1px solid #e5e7eb;">Stock Left</th>
                </tr>
              </thead>
              <tbody>
                ${lowStockItems.map(item => `
                  <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 12px; font-size: 13px; font-weight: bold; color: #111827;">${item.name}</td>
                    <td style="padding: 12px; font-size: 11px; color: #6b7280; font-family: monospace;">${item.id}</td>
                    <td style="padding: 12px; text-align: center;">
                      <span style="background: ${item.remaining === 0 ? '#fee2e2' : '#fef3c7'}; color: ${item.remaining === 0 ? '#dc2626' : '#d97706'}; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                        ${item.remaining === 0 ? 'OUT OF STOCK' : `${item.remaining} left`}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <a href="https://stop-shop-gamma.vercel.app/admin/inventory"
               style="display: inline-block; background: #ba1f3d; color: white; padding: 12px 24px; text-decoration: none; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 10px;">
              Restock Now →
            </a>
          </div>
          <div style="padding: 15px 30px; background: #f9fafb; text-align: center;">
            <p style="color: #9ca3af; font-size: 11px; margin: 0;">
              Stop &amp; Shop · Automated inventory alert
            </p>
          </div>
        </div>
      `,
    });

    console.log(`📧 Low stock alert sent for ${lowStockItems.length} item(s)`);
  } catch (err) {
    console.error('[LowStock] Alert failed:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────
// ORDER STATUS EMAIL
// ─────────────────────────────────────────────────────────────────

const STATUS_ICONS = {
  Shipped:   '📦',
  Delivered: '✅',
};

const STATUS_COLORS = {
  Shipped:   '#2563eb',
  Delivered: '#16a34a',
};

/**
 * Sends a branded order status notification email to the customer.
 * Triggered by admin when marking an order as Shipped or Delivered.
 * Fire-and-forget — never throws so the admin PATCH response is unaffected.
 *
 * @param {{ orderID: string, customer: { name: string, email: string }, total: number }} order
 * @param {'Shipped'|'Delivered'} status
 * @returns {Promise<void>}
 */
export const sendOrderStatusEmail = async (order, status) => {
  if (!['Shipped', 'Delivered'].includes(status)) return;

  const customerEmail = order?.customer?.email;
  if (!customerEmail) return;

  const icon        = STATUS_ICONS[status]  ?? '📋';
  const accentColor = STATUS_COLORS[status] ?? '#ba1f3d';
  const trackUrl    = `https://stop-shop-gamma.vercel.app/track?orderID=${order.orderID}`;
  const subject     = `${icon} Your order ${order.orderID} has been ${status.toLowerCase()}`;

  const deliveryNote = status === 'Delivered'
    ? `<p style="margin: 0 0 20px; font-size: 14px; color: #6b7280; line-height: 1.6;">
         Enjoyed your purchase? Leave a review — it helps others find the perfect item.
       </p>`
    : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">

      <!-- Header -->
      <div style="background: #ba1f3d; padding: 28px 32px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 11px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase;">
          Stop &amp; Shop
        </h1>
      </div>

      <!-- Status badge -->
      <div style="background: ${accentColor}; padding: 24px 32px; text-align: center;">
        <p style="margin: 0 0 6px; font-size: 32px;">${icon}</p>
        <h2 style="margin: 0; color: #fff; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
          Order ${status}!
        </h2>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700;">
          ${order.orderID}
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 32px; background: #ffffff; border: 1px solid #f3f4f6; border-top: none;">
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #374151;">
          Hi <strong>${order.customer?.name ?? 'Valued Customer'}</strong>,
          ${status === 'Shipped'
            ? 'your order is on its way! You should receive it within 2–5 business days.'
            : 'your order has been delivered. We hope you love your new purchase!'}
        </p>

        ${deliveryNote}

        <!-- Order summary -->
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px 24px; margin-bottom: 28px;">
          <p style="margin: 0 0 8px; font-size: 10px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: #9ca3af;">Order Summary</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #6b7280;">Order ID</td>
              <td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-align: right; font-family: monospace;">${order.orderID}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #6b7280;">Status</td>
              <td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-align: right; color: ${accentColor};">${icon} ${status}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #6b7280;">Total</td>
              <td style="padding: 6px 0; font-size: 12px; font-weight: 900; text-align: right;">PKR ${(order.total ?? 0).toLocaleString('en-PK')}</td>
            </tr>
          </table>
        </div>

        <!-- CTA -->
        <div style="text-align: center;">
          <a href="${trackUrl}"
             style="display: inline-block; background: #ba1f3d; color: #fff; padding: 14px 32px; font-size: 10px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; text-decoration: none;">
            Track Your Order &rarr;
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 16px 32px; background: #f9fafb; text-align: center; border: 1px solid #f3f4f6; border-top: none;">
        <p style="margin: 0; color: #9ca3af; font-size: 10px; letter-spacing: 1px;">
          Stop &amp; Shop &nbsp;&middot;&nbsp; Karachi, Pakistan
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to:      customerEmail,
      from:    `"Stop & Shop" <${getEnv('EMAIL_USER', 'email_user')}>`,
      subject,
      html,
    });
    console.log(`📧 [OrderStatus] ${status} email sent → ${customerEmail}`);
  } catch (err) {
    console.error('[OrderStatus] Email failed:', err.message);
  }
};
