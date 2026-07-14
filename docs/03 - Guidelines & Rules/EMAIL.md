# Email Provider & DNS Configuration (Resend + Brevo)

This document details the configuration requirements, verification steps, and failover mechanics for the transaction email systems.

---

## 1. Verified Sender Domain & DNS Configuration

All transactional emails are sent from the verified subdomain `notify.stopandshop.pk`. The following DNS records must be configured with the domain registrar to ensure high inbox delivery and pass DMARC alignment.

### 1.1 SPF (Sender Policy Framework)
Configure a TXT record at the root domain (`stopandshop.pk`) or subdomain (`notify.stopandshop.pk`) to authorize Resend and Brevo to send mail on behalf of the domain:
- **Host/Name**: `notify` (or `notify.stopandshop.pk`)
- **Type**: `TXT`
- **Value**: `v=spf1 include:resend.com include:spf.sendinblue.com ~all`

### 1.2 DKIM (DomainKeys Identified Mail)
Resend and Brevo generate three CNAME records for DKIM key rotation. Add these records exactly as shown in the provider dashboards:
- **DKIM 1**:
  - Name: `resend._domainkey.notify.stopandshop.pk`
  - Type: `CNAME`
  - Value: `feedback-smtp.us-east-1.amazonses.com` (or provider specific value)
- **DKIM 2**:
  - Name: `mail._domainkey.notify.stopandshop.pk`
  - Type: `CNAME`
  - Value: `dkim.brevo.com`

### 1.3 DMARC (Domain-based Message Authentication, Reporting, and Conformance)
Publish a DMARC policy to protect the domain from spoofing and phishing.
- **Host/Name**: `_dmarc.notify.stopandshop.pk`
- **Type**: `TXT`
- **Policy Schedule**:
  - **Initial 2 Weeks**:
    - `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@stopandshop.pk; ruf=mailto:dmarc-reports@stopandshop.pk`
    - *Action*: Emails failing SPF/DKIM will be routed to the spam/junk folder.
  - **After 2 Weeks (Hardened)**:
    - `v=DMARC1; p=reject; pct=100; rua=mailto:dmarc-reports@stopandshop.pk; ruf=mailto:dmarc-reports@stopandshop.pk`
    - *Action*: Emails failing SPF/DKIM will be rejected entirely by recipient servers.

---

## 2. Failover Provider Configuration (Brevo)

To guarantee deliverability during provider outages, **Brevo** is configured as a hot-standby provider behind the unified `EmailProvider` interface.

### 2.1 Failover Rule
- If the Resend API returns three `5xx` errors within a sliding window of `60 seconds`, the provider manager immediately triggers an automatic failover.
- Subsequent emails are dispatched via the Brevo API using `BREVO_API_KEY`.
- The manager checks errors dynamically in-memory and restores primary Resend dispatch once the 60-second error window clears without further `5xx` events.
