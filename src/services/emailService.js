import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const getEnv = (...keys) => keys.map(k => process.env[k]).find(Boolean);

const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: getEnv('EMAIL_USER', 'email_user'),
    pass: getEnv('EMAIL_PASS', 'email_pass'),
  },
});

export const sendEmail = async (options) => {
  try {
    const toEmail = (options.to || '').toLowerCase().trim();
    if (toEmail.endsWith('@example.com') || toEmail.includes('example.com') || process.env.NODE_ENV === 'test') {
      console.log(`ℹ️ [Email] Suppressing dispatch to dummy/testing address: ${options.to}`);
      return;
    }
    await transporter.sendMail(options);
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
  }
};

const LOW_STOCK_THRESHOLD = 5;

const buildIdQuery = (idParam) => {
  return mongoose.isValidObjectId(idParam)
    ? { $or: [{ id: idParam }, { _id: idParam }] }
    : { id: idParam };
};

/**
 * Standard Dark/Minimalist Email Wrapper Layout
 */
const emailLayout = (title, content, schemaJson = '') => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 40px 20px; color: #111827;">
      ${schemaJson ? `<script type="application/ld+json">${schemaJson}</script>` : ''}
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);">
        <!-- Header -->
        <div style="background-color: #0d0d0d; padding: 24px; text-align: center; border-bottom: 2px solid #ba1f3d;">
          <h1 style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 900; letter-spacing: 5px; text-transform: uppercase;">
            Stop &amp; Shop
          </h1>
          <p style="margin: 4px 0 0; color: #a3a3a3; font-size: 8px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">
            Premium Menswear
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 32px;">
          <h2 style="margin: 0 0 24px; font-size: 18px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #0d0d0d; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px;">
            ${title}
          </h2>
          ${content}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #0d0d0d; padding: 20px; text-align: center; border-top: 1px solid #1f1f1f;">
          <p style="margin: 0; color: #737373; font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
            Stop &amp; Shop &nbsp;&middot;&nbsp; Gujrat &nbsp;&middot;&nbsp; Karachi, Pakistan
          </p>
          <p style="margin: 6px 0 0; color: #404040; font-size: 8px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
            This is an automated transaction message.
          </p>
        </div>
      </div>
    </div>
  `;
};

/**
 * Checks stock levels after checkout and sends a consolidated
 * email alert listing ALL low-stock items and sizes in one email.
 */
export const checkAndAlertLowStock = async (purchasedItems) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || getEnv('EMAIL_USER');
    if (!adminEmail) return;

    const lowStockAlerts = [];

    await Promise.all(purchasedItems.map(async (item) => {
      const product = await Product.findOne(buildIdQuery(item.id))
        .select('name quantity id sizes sizeStock colors')
        .lean();
      if (!product) return;

      // 1. Check total quantity
      const totalQty = product.quantity ?? 0;
      if (totalQty <= LOW_STOCK_THRESHOLD) {
        lowStockAlerts.push({
          name: product.name,
          id: product.id || item.id,
          variant: 'ALL SIZES (Total Stock)',
          remaining: totalQty,
        });
      }

      // 2. Check individual sizeStock maps
      if (product.sizes && product.sizes.length > 0 && product.sizeStock) {
        const sizeStockObj = product.sizeStock instanceof Map
          ? Object.fromEntries(product.sizeStock)
          : product.sizeStock;

        for (const size of product.sizes) {
          const sizeQty = parseInt(sizeStockObj[size]) ?? 0;
          if (sizeQty <= LOW_STOCK_THRESHOLD) {
            lowStockAlerts.push({
              name: product.name,
              id: product.id || item.id,
              variant: `Size ${size}`,
              remaining: sizeQty,
            });
          }
        }
      }
    }));

    if (!lowStockAlerts.length) return;

    // Deduplicate alerts
    const uniqueAlerts = [];
    const seen = new Set();
    for (const alert of lowStockAlerts) {
      const key = `${alert.id}-${alert.variant}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueAlerts.push(alert);
      }
    }

    // Sort: 0 stock first
    uniqueAlerts.sort((a, b) => a.remaining - b.remaining);

    const subject = `⚠️ Low Stock Alert — ${uniqueAlerts.length} item(s) / variants need restocking`;

    const text = `
Stop & Shop — Low Stock Alert
==============================

The following items/variants are running low (stock <= 5):

${uniqueAlerts.map(alert => `• ${alert.name} (SKU: ${alert.id}) [${alert.variant}] — ${alert.remaining === 0 ? '🔴 OUT OF STOCK' : `🟡 ${alert.remaining} remaining`}`).join('\n')}

Restock them in the Admin Panel:
https://stop-shop-gamma.vercel.app/admin/inventory
    `.trim();

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <div style="background: #ba1f3d; padding: 20px 30px;">
          <h1 style="color: white; margin: 0; font-size: 16px; letter-spacing: 2px; text-transform: uppercase; font-weight: 900;">
            ⚠️ Low Stock Alert
          </h1>
        </div>
        <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #374151; font-size: 14px; margin-top: 0; line-height: 1.5;">
            The following product sizes/inventories have dropped to or below the low stock threshold of <strong>5 units</strong>:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <th style="padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #737373;">Product</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #737373;">Variant / Size</th>
                <th style="padding: 10px 12px; text-align: center; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #737373;">Stock Left</th>
              </tr>
            </thead>
            <tbody>
              ${uniqueAlerts.map(alert => `
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px; font-size: 13px; font-weight: bold; color: #171717;">
                    ${escapeHtml(alert.name)}<br>
                    <span style="font-size: 10px; color: #737373; font-weight: normal; font-family: monospace;">SKU: ${escapeHtml(alert.id)}</span>
                  </td>
                  <td style="padding: 12px; font-size: 12px; color: #171717; font-weight: 900; text-transform: uppercase;">
                    ${escapeHtml(alert.variant)}
                  </td>
                  <td style="padding: 12px; text-align: center;">
                    <span style="background: ${alert.remaining === 0 ? '#fee2e2' : '#fef3c7'}; color: ${alert.remaining === 0 ? '#dc2626' : '#d97706'}; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold;">
                      ${alert.remaining === 0 ? 'OUT OF STOCK' : `${alert.remaining} remaining`}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://stop-shop-gamma.vercel.app/admin/inventory"
               style="display: inline-block; background: #ba1f3d; color: white; padding: 12px 28px; text-decoration: none; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; border-radius: 2px;">
              Restock Now &rarr;
            </a>
          </div>
        </div>
        <div style="padding: 15px 30px; background: #f9fafb; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #737373; font-size: 10px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">
            Stop &amp; Shop &nbsp;&middot;&nbsp; Gujrat, Pakistan
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject,
      text,
      html,
    });

    console.log(`📧 Low stock alert sent for ${uniqueAlerts.length} item/variant(s)`);
  } catch (err) {
    console.error('[LowStock] Alert failed:', err.message);
  }
};

/**
 * Sends a detailed order confirmation email to the customer with schema markup.
 */
export const sendOrderConfirmationEmail = async (order) => {
  const customerEmail = order?.customer?.email;
  if (!customerEmail) return;

  const trackUrl = `https://stop-shop-gamma.vercel.app/track?orderID=${order.orderID}`;
  const subject = `Order Confirmed — ${order.orderID}`;

  // Formulate items table rows
  const itemRows = order.items.map(item => {
    const details = [];
    if (item.selectedSize) details.push(`Size: ${item.selectedSize}`);
    if (item.selectedColor) details.push(`Color: ${item.selectedColor.split('|').pop().trim()}`);
    const detailText = details.length > 0
      ? `<p style="margin: 2px 0 0; font-size: 9px; color: #737373; font-weight: bold; text-transform: uppercase;">${details.join(' · ')}</p>`
      : '';

    return `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 12px 0; vertical-align: top;">
          <p style="margin: 0; font-size: 12px; font-weight: 900; text-transform: uppercase; color: #171717;">${escapeHtml(item.name)}</p>
          ${detailText}
          <p style="margin: 4px 0 0; font-size: 10px; color: #737373; font-weight: 500;">Qty: ${item.quantity}</p>
        </td>
        <td style="padding: 12px 0; text-align: right; vertical-align: top; font-size: 12px; font-weight: 900; color: #171717;">
          Rs. ${(item.price * item.quantity).toLocaleString('en-PK')}
        </td>
      </tr>
    `;
  }).join('');

  // Calculate order subtotal
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = Math.max(0, subtotal - order.total);

  // Formulate pricing rows
  let discountRow = '';
  if (discountAmount > 0) {
    discountRow = `
      <tr>
        <td style="padding: 6px 0; font-size: 11px; color: #ba1f3d; font-weight: bold;">DISCOUNT</td>
        <td style="padding: 6px 0; text-align: right; font-size: 11px; color: #ba1f3d; font-weight: bold;">- Rs. ${discountAmount.toLocaleString('en-PK')}</td>
      </tr>
    `;
  }

  // Construct JSON-LD Schema
  const schemaJson = JSON.stringify({
    "@context": "http://schema.org",
    "@type": "Order",
    "merchant": {
      "@type": "Organization",
      "name": "Stop & Shop"
    },
    "orderNumber": order.orderID,
    "priceCurrency": "PKR",
    "price": order.total.toString(),
    "orderStatus": "http://schema.org/OrderProcessing",
    "customer": {
      "@type": "Person",
      "name": order.customer.name
    },
    "billingAddress": {
      "@type": "PostalAddress",
      "streetAddress": order.customer.address,
      "addressLocality": order.customer.city,
      "postalCode": order.customer.zip,
      "addressCountry": "PK"
    },
    "potentialAction": {
      "@type": "TrackAction",
      "target": trackUrl
    }
  });

  const content = `
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #404040;">
      Hi <strong>${escapeHtml(order.customer.name)}</strong>,
    </p>
    <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #404040;">
      Thank you for shopping with us. Your style upgrade is locked in! We are preparing your order and will dispatch it to your address shortly.
    </p>
    
    <div style="background-color: #fcfcfc; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 30px;">
      <p style="margin: 0 0 12px; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #737373;">
        Order Summary
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      
      <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #e5e7eb; padding-top: 12px;">
        <tbody>
          <tr>
            <td style="padding: 6px 0; font-size: 11px; color: #737373;">SUBTOTAL</td>
            <td style="padding: 6px 0; text-align: right; font-size: 11px; color: #171717; font-weight: 700;">Rs. ${subtotal.toLocaleString('en-PK')}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 11px; color: #737373;">SHIPPING</td>
            <td style="padding: 6px 0; text-align: right; font-size: 11px; color: #16a34a; font-weight: bold;">FREE</td>
          </tr>
          ${discountRow}
          <tr style="border-top: 1px dotted #e5e7eb;">
            <td style="padding: 12px 0 0; font-size: 13px; font-weight: 900; color: #0d0d0d; text-transform: uppercase;">TOTAL</td>
            <td style="padding: 12px 0 0; text-align: right; font-size: 18px; font-weight: 900; color: #ba1f3d;">Rs. ${order.total.toLocaleString('en-PK')}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="background-color: #fcfcfc; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 30px;">
      <p style="margin: 0 0 8px; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #737373;">
        Delivery Location
      </p>
      <p style="margin: 0; font-size: 12px; font-weight: bold; color: #171717; line-height: 1.5;">
        ${escapeHtml(order.customer.address)}<br>
        ${escapeHtml(order.customer.city)}${order.customer.zip ? ` - ${escapeHtml(order.customer.zip)}` : ''}<br>
        Pakistan
      </p>
      <p style="margin: 8px 0 0; font-size: 10px; color: #737373;">
        <strong>Payment Method:</strong> ${escapeHtml(order.paymentMethod)}
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 10px;">
      <a href="${trackUrl}"
         style="display: inline-block; background-color: #ba1f3d; color: #ffffff; padding: 14px 32px; font-size: 10px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; text-decoration: none; border-radius: 2px;">
        Track Your Order &rarr;
      </a>
    </div>
  `;

  const html = emailLayout(`Order Confirmed — ${order.orderID}`, content, schemaJson);

  try {
    await sendEmail({
      to: customerEmail,
      from: `"Stop & Shop" <${getEnv('EMAIL_USER', 'email_user')}>`,
      subject,
      html,
    });
    console.log(`📧 [OrderConfirmation] Confirmation email sent to ${customerEmail}`);
  } catch (err) {
    console.error('[OrderConfirmation] Email failed:', err.message);
  }
};

/**
 * Sends a welcome email upon successful account registration.
 */
export const sendWelcomeEmail = async (customer) => {
  const customerEmail = customer?.email;
  if (!customerEmail) return;

  const subject = `Welcome to Stop & Shop — Gujrat's Finest Menswear`;

  const content = `
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #404040;">
      Hi <strong>${escapeHtml(customer.name)}</strong>,
    </p>
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #404040;">
      Welcome to <strong>Stop & Shop</strong>. We are thrilled to have you join our community of individuals who choose style deliberately.
    </p>
    <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #404040;">
      Your account is now active. You can log in anytime to view your profile, save your delivery addresses for seamless checkout, and track your active orders securely.
    </p>
    
    <div style="background-color: #fcfcfc; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 30px;">
      <p style="margin: 0 0 8px; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #737373;">
        Account Details
      </p>
      <p style="margin: 0; font-size: 12px; color: #171717; line-height: 1.5;">
        <strong>Email:</strong> ${escapeHtml(customer.email)}<br>
        <strong>Status:</strong> Verified Account
      </p>
      <p style="margin: 12px 0 0; font-size: 11px; color: #ba1f3d; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
        Use coupon code <strong>CARDINAL20</strong> at checkout for 20% off your first order!
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 10px;">
      <a href="https://stop-shop-gamma.vercel.app/account"
         style="display: inline-block; background-color: #ba1f3d; color: #ffffff; padding: 14px 32px; font-size: 10px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; text-decoration: none; border-radius: 2px;">
        Go to Account Dashboard &rarr;
      </a>
    </div>
  `;

  const html = emailLayout('Welcome to the Club', content);

  try {
    await sendEmail({
      to: customerEmail,
      from: `"Stop & Shop" <${getEnv('EMAIL_USER', 'email_user')}>`,
      subject,
      html,
    });
    console.log(`📧 [WelcomeEmail] Welcome email sent to ${customerEmail}`);
  } catch (err) {
    console.error('[WelcomeEmail] Email failed:', err.message);
  }
};

const STATUS_ICONS = {
  Shipped:   '📦',
  Delivered: '✅',
};

/**
 * Sends a branded order status notification email to the customer.
 */
export const sendOrderStatusEmail = async (order, status) => {
  if (!['Shipped', 'Delivered'].includes(status)) return;

  const customerEmail = order?.customer?.email;
  if (!customerEmail) return;

  const icon = STATUS_ICONS[status] ?? '📋';
  const trackUrl = `https://stop-shop-gamma.vercel.app/track?orderID=${order.orderID}`;
  const subject = `${icon} Your order ${order.orderID} has been ${status.toLowerCase()}`;

  const deliveryNote = status === 'Delivered'
    ? `<p style="margin: 0 0 20px; font-size: 13px; color: #525252; line-height: 1.6; font-weight: 500;">
         Loved your style upgrade? Leave a review on the product page to let us know!
       </p>`
    : `<p style="margin: 0 0 20px; font-size: 13px; color: #525252; line-height: 1.6; font-weight: 500;">
         Your style upgrade is on its way. You can track its shipment path below.
       </p>`;

  const schemaJson = JSON.stringify({
    "@context": "http://schema.org",
    "@type": "Order",
    "merchant": {
      "@type": "Organization",
      "name": "Stop & Shop"
    },
    "orderNumber": order.orderID,
    "priceCurrency": "PKR",
    "price": order.total.toString(),
    "orderStatus": status === 'Shipped' ? "http://schema.org/OrderShipped" : "http://schema.org/OrderDelivered",
    "customer": {
      "@type": "Person",
      "name": order.customer.name
    },
    "potentialAction": {
      "@type": "TrackAction",
      "target": trackUrl
    }
  });

  const content = `
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #404040;">
      Hi <strong>${escapeHtml(order.customer?.name ?? 'Valued Customer')}</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #404040;">
      Your order <strong>${order.orderID}</strong> has been updated to <strong>${status.toUpperCase()}</strong>.
    </p>
    ${deliveryNote}

    <div style="background-color: #fcfcfc; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 30px;">
      <p style="margin: 0 0 8px; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #737373;">
        Order Tracking
      </p>
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #737373;">Order ID</td>
            <td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-align: right; font-family: monospace;">${order.orderID}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #737373;">Current Status</td>
            <td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-align: right; color: ${status === 'Delivered' ? '#16a34a' : '#2563eb'};">
              ${icon} ${status.toUpperCase()}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #737373;">Total Paid</td>
            <td style="padding: 6px 0; font-size: 12px; font-weight: 900; text-align: right;">Rs. ${(order.total ?? 0).toLocaleString('en-PK')}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="text-align: center; margin-top: 10px;">
      <a href="${trackUrl}"
         style="display: inline-block; background-color: #ba1f3d; color: #ffffff; padding: 14px 32px; font-size: 10px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; text-decoration: none; border-radius: 2px;">
        Track Package &rarr;
      </a>
    </div>
  `;

  const html = emailLayout(`Order Updated: ${status}`, content, schemaJson);

  try {
    await sendEmail({
      to:      customerEmail,
      from:    `"Stop & Shop" <${getEnv('EMAIL_USER', 'email_user')}>`,
      subject,
      html,
    });
    console.log(`📧 [OrderStatus] ${status} email sent to ${customerEmail}`);
  } catch (err) {
    console.error('[OrderStatus] Email failed:', err.message);
  }
};
