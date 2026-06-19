import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';

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

const makeAbsoluteUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const host = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://stop-shop-gamma.vercel.app';
  return `${host.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getVariantImage = (product, color) => {
  if (!color || !product.variantImages) return null;

  const imagesObj = product.variantImages instanceof Map
    ? Object.fromEntries(product.variantImages)
    : product.variantImages;

  if (typeof imagesObj !== 'object') return null;

  const searchColor = color.trim().toLowerCase();
  const searchParts = searchColor.split('|').map(p => p.trim());
  const searchHex = searchParts[0];
  const searchName = searchParts[1] || '';

  if (imagesObj[color]) return imagesObj[color];

  for (const [key, val] of Object.entries(imagesObj)) {
    const keyLower = key.trim().toLowerCase();
    if (keyLower === searchColor) return val;

    const keyParts = keyLower.split('|').map(p => p.trim());
    const keyHex = keyParts[0];
    const keyName = keyParts[1] || '';

    if (searchHex && keyHex === searchHex) return val;
    if (searchName && keyName && keyName === searchName) return val;
    if (keyLower === searchHex || keyLower === searchName) return val;
  }

  return null;
};

const getTrackingUrl = (courier, trackingNumber) => {
  if (!trackingNumber) return '';
  const c = (courier || '').toLowerCase();
  if (c.includes('tcs')) {
    return `https://www.tcsexpress.com/tracking?tracking-number=${encodeURIComponent(trackingNumber)}`;
  }
  if (c.includes('leopard')) {
    return `https://www.leopardscourier.com/tracking?track-number=${encodeURIComponent(trackingNumber)}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent((courier || '') + ' tracking ' + trackingNumber)}`;
};

const generateItemRowsHtml = async (items) => {
  try {
    const productIds = items.map(item => item.id);
    const products = await Product.find({ id: { $in: productIds } }).lean();
    const productMap = new Map(products.map(p => [p.id, p]));

    return items.map(item => {
      const product = productMap.get(item.id);
      const rawImg = product ? (getVariantImage(product, item.selectedColor) || product.image) : '';
      const imageUrl = makeAbsoluteUrl(rawImg);

      const details = [];
      if (item.selectedSize) details.push(`Size: ${item.selectedSize}`);
      if (item.selectedColor) details.push(`Color: ${item.selectedColor.split('|').pop().trim()}`);
      const detailText = details.length > 0
        ? `<p style="margin: 2px 0 0; font-size: 9px; color: #737373; font-weight: bold; text-transform: uppercase;">${details.join(' · ')}</p>`
        : '';

      const imageCol = imageUrl
        ? `<td style="padding: 12px 0; vertical-align: top; width: 80px;">
             <img src="${imageUrl}" alt="${escapeHtml(item.name)}" style="width: 64px; height: 64px; object-fit: cover; border: 1px solid #e5e7eb; border-radius: 4px;" />
           </td>`
        : `<td style="padding: 12px 0; vertical-align: top; width: 80px;">
             <div style="width: 64px; height: 64px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #9ca3af; font-weight: bold; text-transform: uppercase;">S&S</div>
           </td>`;

      return `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          ${imageCol}
          <td style="padding: 12px 12px; vertical-align: top;">
            <p style="margin: 0; font-size: 12px; font-weight: 900; text-transform: uppercase; color: #171717;">${escapeHtml(item.name)}</p>
            ${detailText}
            <p style="margin: 4px 0 0; font-size: 10px; color: #737373; font-weight: 500;">Qty: ${item.quantity}</p>
          </td>
          <td style="padding: 12px 0; text-align: right; vertical-align: top; font-size: 12px; font-weight: 900; color: #171717; white-space: nowrap;">
            Rs. ${(item.price * item.quantity).toLocaleString('en-PK')}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('[generateItemRowsHtml] Error generating rows:', err.message);
    return items.map(item => `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 12px 0; vertical-align: top;">
          <p style="margin: 0; font-size: 12px; font-weight: 900; text-transform: uppercase; color: #171717;">${escapeHtml(item.name)}</p>
          <p style="margin: 4px 0 0; font-size: 10px; color: #737373; font-weight: 500;">Qty: ${item.quantity}</p>
        </td>
        <td style="padding: 12px 0; text-align: right; vertical-align: top; font-size: 12px; font-weight: 900; color: #171717;">
          Rs. ${(item.price * item.quantity).toLocaleString('en-PK')}
        </td>
      </tr>
    `).join('');
  }
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

    const resendApiKey = getEnv('RESEND_API_KEY');
    if (resendApiKey) {
      const defaultFrom = getEnv('RESEND_FROM_EMAIL') || 'Stop & Shop <onboarding@resend.dev>';
      const from = options.from || defaultFrom;
      const to = Array.isArray(options.to) ? options.to : [options.to];

      const payload = {
        from,
        to,
        subject: options.subject,
        html: options.html,
      };
      if (options.text) {
        payload.text = options.text;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Resend API error: ${response.status} - ${errText}`);
      }

      const resData = await response.json();
      console.log(`📧 [Resend] Email dispatched successfully to ${options.to}. ID: ${resData.id}`);
      return resData;
    }

    await transporter.sendMail(options);
    console.log(`📧 [Nodemailer] Email sent successfully to ${options.to}`);
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
        .select('name quantity id sizes sizeStock colors colorStock')
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

      // 3. Check individual colorStock maps
      if (product.colors && product.colors.length > 0 && product.colorStock) {
        const colorStockObj = product.colorStock instanceof Map
          ? Object.fromEntries(product.colorStock)
          : product.colorStock;

        for (const color of product.colors) {
          const colorQty = parseInt(colorStockObj[color]) ?? 0;
          if (colorQty <= LOW_STOCK_THRESHOLD) {
            lowStockAlerts.push({
              name: product.name,
              id: product.id || item.id,
              variant: `Color ${color.split('|').pop().trim()}`,
              remaining: colorQty,
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

  const trackUrl = makeAbsoluteUrl(`/track?orderID=${order.orderID}&email=${encodeURIComponent(customerEmail)}`);
  const subject = `Order Confirmed — ${order.orderID}`;

  // Formulate items table rows with images
  const itemRows = await generateItemRowsHtml(order.items);

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

  let couponText = 'Check our website for active seasonal promotions and discount codes!';
  try {
    const activeCoupon = await Coupon.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
    if (activeCoupon) {
      const offVal = activeCoupon.type === 'percentage' ? `${activeCoupon.value}%` : `Rs. ${activeCoupon.value}`;
      couponText = `Use coupon code <strong>${activeCoupon.code.toUpperCase()}</strong> at checkout for ${offVal} off your first order!`;
    }
  } catch (err) {
    console.error('[WelcomeEmail] Failed to fetch active coupon:', err.message);
  }

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
        ${couponText}
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
  Paid:      '💳',
  Shipped:   '📦',
  Delivered: '✅',
  Failed:    '❌',
};

/**
 * Sends a branded order status notification email to the customer.
 */
export const sendOrderStatusEmail = async (order, status) => {
  if (!['Paid', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Failed', 'Refunded'].includes(status)) return;

  if (status === 'Confirmed') {
    return sendOrderConfirmationEmail(order);
  }

  const customerEmail = order?.customer?.email;
  if (!customerEmail) return;

  const STATUS_ICONS = {
    Paid:      '💳',
    Confirmed: '📋',
    Shipped:   '📦',
    Delivered: '✅',
    Cancelled: '❌',
    Failed:    '❌',
    Refunded:  '💵',
  };

  const icon = STATUS_ICONS[status] ?? '📋';
  const trackUrl = makeAbsoluteUrl(`/track?orderID=${order.orderID}&email=${encodeURIComponent(customerEmail)}`);

  let subject = `${icon} Your order ${order.orderID} has been ${status.toLowerCase()}`;
  if (status === 'Paid') {
    subject = `${icon} Payment verified successfully for order ${order.orderID}`;
  } else if (status === 'Shipped') {
    subject = `${icon} Your order ${order.orderID} has been dispatched`;
  } else if (status === 'Delivered') {
    subject = `${icon} Your order ${order.orderID} has arrived`;
  } else if (status === 'Cancelled') {
    subject = `${icon} Order Cancelled — ${order.orderID}`;
  } else if (status === 'Failed') {
    subject = `${icon} Order payment/fulfillment failed — ${order.orderID}`;
  } else if (status === 'Refunded') {
    subject = `${icon} Order Refunded — ${order.orderID}`;
  }

  let deliveryNote = '';
  if (status === 'Paid') {
    deliveryNote = `<p style="margin: 0 0 20px; font-size: 13px; color: #525252; line-height: 1.6; font-weight: 500;">
         We have received and verified your payment. Your order is now in preparation and will be dispatched soon.
       </p>`;
  } else if (status === 'Delivered') {
    deliveryNote = `<p style="margin: 0 0 20px; font-size: 13px; color: #525252; line-height: 1.6; font-weight: 500;">
         Loved your style upgrade? Leave a review on the product page to let us know!
       </p>`;
  } else if (status === 'Shipped') {
    deliveryNote = `<p style="margin: 0 0 20px; font-size: 13px; color: #525252; line-height: 1.6; font-weight: 500;">
         Your style upgrade is on its way. You can track its shipment path below.
       </p>`;
  } else if (status === 'Failed') {
    deliveryNote = `<p style="margin: 0 0 20px; font-size: 13px; color: #525252; line-height: 1.6; font-weight: 500;">
         Unfortunately, we encountered an issue processing or fulfilling your order. The transaction status has been updated to Failed. Please contact support if you need assistance.
       </p>`;
  } else if (status === 'Cancelled') {
    deliveryNote = `<p style="margin: 0 0 20px; font-size: 13px; color: #525252; line-height: 1.6; font-weight: 500;">
         We regret to inform you that your order has been cancelled. If you did not request this or have questions, please reach out to us.
       </p>`;
  } else if (status === 'Refunded') {
    deliveryNote = `<p style="margin: 0 0 20px; font-size: 13px; color: #525252; line-height: 1.6; font-weight: 500;">
         A refund has been successfully initiated for your order. The funds will be credited back to your original payment method.
       </p>`;
  }

  // 1. Shipped Details Card
  let shippingInfoBlock = '';
  if (status === 'Shipped') {
    const courierName = order.courier || 'TCS Express';
    const trackingNo = order.trackingNumber || 'N/A';
    const trackingUrl = getTrackingUrl(courierName, trackingNo);
    
    shippingInfoBlock = `
      <div style="background-color: #fcfcfc; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 30px;">
        <p style="margin: 0 0 12px; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #737373;">
          Courier &amp; Tracking Details
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
          <tbody>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #737373;">Courier Service</td>
              <td style="padding: 6px 0; font-size: 12px; font-weight: 900; text-align: right; color: #171717; text-transform: uppercase;">${escapeHtml(courierName)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #737373;">Tracking Number</td>
              <td style="padding: 6px 0; font-size: 12px; font-weight: 900; text-align: right; color: #ba1f3d; font-family: monospace;">${escapeHtml(trackingNo)}</td>
            </tr>
          </tbody>
        </table>
        ${trackingNo !== 'N/A' ? `
        <div style="text-align: center; margin-top: 10px;">
          <a href="${trackingUrl}" target="_blank"
             style="display: inline-block; background-color: #0d0d0d; color: #ffffff; padding: 12px 24px; font-size: 9px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; border-radius: 2px;">
            Track shipment with ${escapeHtml(courierName)} &rarr;
          </a>
        </div>` : ''}
      </div>
    `;
  }

  // 2. Review Links Card for Delivered
  let reviewPromptBlock = '';
  if (status === 'Delivered') {
    reviewPromptBlock = `
      <div style="background-color: #fcfcfc; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 30px; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 900; text-transform: uppercase; color: #0d0d0d; letter-spacing: 1px;">
          Loved your style upgrade?
        </p>
        <p style="margin: 0 0 16px; font-size: 12px; color: #525252; line-height: 1.5;">
          Share your thoughts on the products to help others choose. Leave a review for your items below:
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
          ${(order.items || []).map(item => `
            <a href="${makeAbsoluteUrl(`/product/${item.id}?write-review=true`)}" 
               style="display: inline-block; font-size: 11px; font-weight: bold; color: #ba1f3d; text-decoration: none; border-bottom: 1px solid rgba(186, 31, 61, 0.3); padding-bottom: 2px;">
               Review ${escapeHtml(item.name)} &rarr;
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 3. Item rows with images
  const itemRows = await generateItemRowsHtml(order.items || []);
  const subtotal = (order.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = Math.max(0, subtotal - order.total);
  
  let discountRow = '';
  if (discountAmount > 0) {
    discountRow = `
      <tr>
        <td style="padding: 6px 0; font-size: 11px; color: #ba1f3d; font-weight: bold;">DISCOUNT</td>
        <td style="padding: 6px 0; text-align: right; font-size: 11px; color: #ba1f3d; font-weight: bold;">- Rs. ${discountAmount.toLocaleString('en-PK')}</td>
      </tr>
    `;
  }

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
    "orderStatus": status === 'Shipped'
      ? "http://schema.org/OrderShipped"
      : status === 'Delivered'
        ? "http://schema.org/OrderDelivered"
        : "http://schema.org/OrderCancelled",
    "customer": {
      "@type": "Person",
      "name": order.customer?.name ?? 'Valued Customer'
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
    
    ${shippingInfoBlock}
    ${reviewPromptBlock}

    <div style="background-color: #fcfcfc; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 30px;">
      <p style="margin: 0 0 12px; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #737373;">
        Order Items
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

/**
 * Sends a branded status update notification email to the Admin.
 */
export const sendAdminOrderStatusNotification = async (order, status) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || getEnv('EMAIL_USER');
    if (!adminEmail) return;

    const subject = `🔔 Order ${order.orderID} Status Updated to ${status.toUpperCase()}`;
    
    // Generate items rows with images
    const itemRows = await generateItemRowsHtml(order.items || []);

    const content = `
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #404040;">
        Admin Alert: Order <strong>${order.orderID}</strong> status has been updated to <strong>${status.toUpperCase()}</strong>.
      </p>
      <div style="background-color: #fcfcfc; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #737373;">
          Order Details
        </p>
        <p style="margin: 0; font-size: 12px; color: #171717; line-height: 1.5;">
          <strong>Order ID:</strong> ${order.orderID}<br>
          <strong>Status:</strong> ${status.toUpperCase()}<br>
          <strong>Customer Name:</strong> ${escapeHtml(order.customer?.name)}<br>
          <strong>Customer Email:</strong> ${escapeHtml(order.customer?.email)}<br>
          <strong>Customer Phone:</strong> ${escapeHtml(order.customer?.phone)}<br>
          ${order.courier ? `<strong>Courier:</strong> ${escapeHtml(order.courier)}<br>` : ''}
          ${order.trackingNumber ? `<strong>Tracking Number:</strong> ${escapeHtml(order.trackingNumber)}<br>` : ''}
          <strong>Total Amount:</strong> Rs. ${order.total.toLocaleString('en-PK')}<br>
          <strong>Payment Method:</strong> ${order.paymentMethod} (${order.paymentDetails?.status || 'Pending'})
        </p>
      </div>

      <p style="margin: 20px 0 10px; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #737373;">
        Items in this Order
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div style="text-align: center;">
        <a href="https://stop-shop-gamma.vercel.app/admin/orders"
           style="display: inline-block; background-color: #ba1f3d; color: #ffffff; padding: 12px 28px; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; border-radius: 2px;">
          View in Admin Dashboard &rarr;
        </a>
      </div>
    `;

    const html = emailLayout(`Admin Alert: Order Updated`, content);
    await sendEmail({
      to: adminEmail,
      subject,
      html,
    });
    console.log(`📧 [AdminOrderStatus] Status email sent to admin: ${adminEmail}`);
  } catch (err) {
    console.error('[AdminOrderStatus] Email failed:', err.message);
  }
};

/**
 * Sends a notification summary to the Admin when a new order is placed successfully.
 */
export const sendAdminNewOrderNotification = async (order) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || getEnv('EMAIL_USER');
    if (!adminEmail) return;

    const subject = `🔔 New Order Placed — ${order.orderID}`;
    const content = `
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #404040;">
        A new order has been successfully placed on Stop & Shop.
      </p>
      <div style="background-color: #fcfcfc; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #737373;">
          Order Details Summary
        </p>
        <p style="margin: 0; font-size: 12px; color: #171717; line-height: 1.5;">
          <strong>Order ID:</strong> ${order.orderID}<br>
          <strong>Customer Name:</strong> ${escapeHtml(order.customer?.name)}<br>
          <strong>Customer Phone:</strong> ${escapeHtml(order.customer?.phone)}<br>
          <strong>Customer Email:</strong> ${escapeHtml(order.customer?.email)}<br>
          <strong>Total Amount:</strong> Rs. ${order.total.toLocaleString('en-PK')}<br>
          <strong>Payment Method:</strong> ${order.paymentMethod} (${order.paymentDetails?.status || 'Pending'})
        </p>
      </div>
      <div style="text-align: center;">
        <a href="https://stop-shop-gamma.vercel.app/admin/orders"
           style="display: inline-block; background-color: #ba1f3d; color: #ffffff; padding: 12px 28px; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; border-radius: 2px;">
          View in Admin Dashboard &rarr;
        </a>
      </div>
    `;
    const html = emailLayout(`New Order Alert: ${order.orderID}`, content);
    await sendEmail({
      to: adminEmail,
      subject,
      html,
    });
    console.log(`📧 [AdminNewOrder] Admin notification sent to ${adminEmail}`);
  } catch (err) {
    console.error('[AdminNewOrder] Failed:', err.message);
  }
};

/**
 * Sends a payment/authorization failure email alert to the Customer and Admin.
 */
export const sendOrderFailedEmail = async (order, reason = 'Payment declined by gateway') => {
  try {
    const customerEmail = order?.customer?.email;
    const adminEmail = process.env.ADMIN_EMAIL || getEnv('EMAIL_USER');

    // 1. Send to Customer
    if (customerEmail) {
      const subject = `❌ Payment Failed — Order ${order.orderID || 'Attempt'}`;
      const content = `
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #404040;">
          Hi <strong>${escapeHtml(order.customer?.name ?? 'Valued Customer')}</strong>,
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #404040;">
          We were unable to process your payment of <strong>Rs. ${(order.total ?? 0).toLocaleString('en-PK')}</strong>.
        </p>
        <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 24px; color: #991b1b; font-size: 13px;">
          <strong>Decline Reason:</strong> ${escapeHtml(reason)}
        </div>
        <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #404040;">
          Please return to the checkout to try again with a different payment card or method.
        </p>
        <div style="text-align: center;">
          <a href="https://stop-shop-gamma.vercel.app/checkout"
             style="display: inline-block; background-color: #0d0d0d; color: #ffffff; padding: 14px 32px; font-size: 10px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; text-decoration: none; border-radius: 2px;">
            Return to Checkout &rarr;
          </a>
        </div>
      `;
      const html = emailLayout(`Payment Failed — ${order.orderID || 'Checkout'}`, content);
      await sendEmail({
        to: customerEmail,
        subject,
        html,
      });
      console.log(`📧 [OrderFailed] Customer alert sent to ${customerEmail}`);
    }

    // 2. Send to Admin
    if (adminEmail) {
      const subject = `⚠️ Alert: Order Payment Failed — ${order.orderID || 'Attempt'}`;
      const content = `
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #404040;">
          An order payment attempt has failed.
        </p>
        <div style="background-color: #fcfcfc; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #737373;">
            Failed Transaction Details
          </p>
          <p style="margin: 0; font-size: 12px; color: #171717; line-height: 1.5;">
            <strong>Order ID:</strong> ${order.orderID || 'N/A'}<br>
            <strong>Customer:</strong> ${escapeHtml(order.customer?.name)} (${escapeHtml(order.customer?.email)})<br>
            <strong>Phone:</strong> ${escapeHtml(order.customer?.phone)}<br>
            <strong>Total Amount:</strong> Rs. ${(order.total ?? 0).toLocaleString('en-PK')}<br>
            <strong>Payment Method:</strong> ${order.paymentMethod}<br>
            <strong>Decline Reason:</strong> ${escapeHtml(reason)}
          </p>
        </div>
      `;
      const html = emailLayout(`Admin Alert: Payment Failed`, content);
      await sendEmail({
        to: adminEmail,
        subject,
        html,
      });
      console.log(`📧 [AdminOrderFailed] Admin alert sent to ${adminEmail}`);
    }
  } catch (err) {
    console.error('[OrderFailed] Email trigger failed:', err.message);
  }
};
