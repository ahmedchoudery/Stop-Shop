import SuppressedEmail from '../../models/SuppressedEmail.js';

// In-memory array to track Resend 5xx error timestamps
const resendFailures = [];

const cleanOldFailures = () => {
  const now = Date.now();
  // Filter out failures older than 60 seconds (60000ms)
  while (resendFailures.length > 0 && resendFailures[0] < now - 60000) {
    resendFailures.shift();
  }
};

export class ResendProvider {
  async send({ to, cc, subject, html, text }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const defaultFrom = process.env.RESEND_FROM_EMAIL || 'Stop & Shop <onboarding@resend.dev>';
    const payload = {
      from: defaultFrom,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };
    if (cc) {
      payload.cc = Array.isArray(cc) ? cc : [cc];
    }
    if (text) {
      payload.text = text;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      const status = response.status;
      if (status >= 500 && status < 600) {
        resendFailures.push(Date.now());
      }
      throw new Error(`Resend Error ${status}: ${errText}`);
    }

    return await response.json();
  }
}

export class BrevoProvider {
  async send({ to, cc, subject, html, text }) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const defaultFromEmail = process.env.BREVO_FROM_EMAIL || 'notify@stopandshop.pk';
    const payload = {
      sender: { name: 'Stop & Shop', email: defaultFromEmail },
      to: (Array.isArray(to) ? to : [to]).map(email => ({ email })),
      subject,
      htmlContent: html,
    };
    if (cc) {
      payload.cc = (Array.isArray(cc) ? cc : [cc]).map(email => ({ email }));
    }
    if (text) {
      payload.textContent = text;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Brevo Error ${response.status}: ${errText}`);
    }

    return await response.json();
  }
}

export class EmailProviderManager {
  constructor() {
    this.resend = new ResendProvider();
    this.brevo = new BrevoProvider();
  }

  async sendEmail(options) {
    const toEmail = (options.to || '').toLowerCase().trim();

    // Check Suppression List
    const isSuppressed = await SuppressedEmail.findOne({ email: toEmail }).lean();
    if (isSuppressed) {
      console.warn(`⚠️ [EmailProviderManager] Suppressing email send to ${toEmail} (Reason: ${isSuppressed.reason})`);
      return { skipped: true, reason: 'suppressed' };
    }

    // Clean up old failures
    cleanOldFailures();

    // Determine Provider: if 3 or more Resend 5xx in the last 60s, failover to Brevo
    if (resendFailures.length >= 3) {
      console.warn(`🚨 [EmailProviderManager] Failover active (Resend failed ${resendFailures.length} times in 60s). Using Brevo.`);
      try {
        const result = await this.brevo.send(options);
        return { provider: 'brevo', result };
      } catch (brevoErr) {
        console.error(`❌ [EmailProviderManager] Brevo fallback also failed:`, brevoErr.message);
        throw brevoErr;
      }
    }

    // Otherwise use Resend (with try-catch failover back to Brevo if Resend fails immediately)
    try {
      const result = await this.resend.send(options);
      return { provider: 'resend', result };
    } catch (resendErr) {
      console.error(`❌ [EmailProviderManager] Resend primary dispatch failed:`, resendErr.message);
      
      // Clean up old failures to check active count after this failure
      cleanOldFailures();
      
      // If we just reached >= 3 failures, failover immediately for this email itself!
      if (resendFailures.length >= 3) {
        console.warn(`🚨 [EmailProviderManager] Immediate failover triggered for active send. Trying Brevo.`);
        try {
          const result = await this.brevo.send(options);
          return { provider: 'brevo', result };
        } catch (brevoErr) {
          console.error(`❌ [EmailProviderManager] Brevo fallback also failed:`, brevoErr.message);
          throw brevoErr;
        }
      }
      throw resendErr;
    }
  }
}

const providerManager = new EmailProviderManager();
export default providerManager;
export { providerManager };
