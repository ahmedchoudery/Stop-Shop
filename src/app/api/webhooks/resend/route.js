import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import SuppressedEmail from '@/models/SuppressedEmail';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const payload = await req.text();
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error('❌ [Resend Webhook] Missing Svix headers');
        return new Response('Missing signature headers', { status: 400 });
      }

      // Format secret
      let secretKey = webhookSecret;
      if (secretKey.startsWith('whsec_')) {
        secretKey = secretKey.substring(6);
      }
      const secretBuffer = Buffer.from(secretKey, 'base64');

      const toSign = `${svixId}.${svixTimestamp}.${payload}`;

      // Svix signatures are format: "v1,signature_hash" or multiple signatures separated by spaces
      const signatures = svixSignature.split(' ');
      let isValid = false;

      for (const sigEntry of signatures) {
        const parts = sigEntry.split(',');
        if (parts.length < 2) continue;
        const sig = parts[1];

        // Compute HMAC SHA256 signature
        const hmac = crypto.createHmac('sha256', secretBuffer);
        hmac.update(toSign);
        const computedHex = hmac.digest('hex');
        const computedBase64 = hmac.digest('base64');

        if (crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(computedHex, 'hex')) ||
            sig === computedBase64) {
          isValid = true;
          break;
        }
      }

      if (!isValid) {
        console.error('❌ [Resend Webhook] Signature verification failed');
        return new Response('Invalid webhook signature', { status: 401 });
      }
    }

    const event = JSON.parse(payload);
    console.info(`📧 [Resend Webhook] Received webhook event: ${event.type}`);

    await dbConnect();

    // Check bounce or complaint events
    if (event.type === 'email.bounced' || event.type === 'email.complained') {
      const recipientList = event.data?.to || [];
      const reason = event.type === 'email.bounced' ? 'bounce' : 'spam_complaint';

      for (const email of recipientList) {
        const lowercaseEmail = email.toLowerCase().trim();
        await SuppressedEmail.findOneAndUpdate(
          { email: lowercaseEmail },
          { email: lowercaseEmail, reason },
          { upsert: true, new: true }
        );
        console.info(`🚫 [Resend Webhook] Suppressed email added: ${lowercaseEmail} (Reason: ${reason})`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ [Resend Webhook] Failed to process webhook:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
