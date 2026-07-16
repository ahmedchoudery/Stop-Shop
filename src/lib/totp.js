import crypto from 'crypto';

/**
 * Decodes a base32 string into a Buffer.
 * Supports standard base32 (RFC 4648).
 * @param {string} base32 
 * @returns {Buffer}
 */
export function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.replace(/=+$/, '').toUpperCase();
  const out = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < clean.length; i++) {
    const char = clean.charAt(i);
    const idx = alphabet.indexOf(char);
    if (idx === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/**
 * Generates a random base32 TOTP secret.
 * @returns {string}
 */
export function generateSecret() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = crypto.randomBytes(20);
  let secret = '';
  for (const byte of bytes) {
    secret += alphabet[byte % 32];
  }
  return secret;
}

/**
 * Verifies a 6-digit TOTP token against a base32 secret.
 * Supports a window parameter to account for network/clock latency.
 * @param {string} token 
 * @param {string} secret 
 * @param {number} [window=1] - Number of 30-second steps to check in past and future
 * @returns {boolean}
 */
export function verifyTotp(token, secret, window = 1) {
  if (!token || !secret) return false;

  const cleanToken = token.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanToken)) return false;

  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);

    for (let i = -window; i <= window; i++) {
      const countBuf = Buffer.alloc(8);
      const countVal = BigInt(counter + i);
      countBuf.writeBigInt64BE(countVal);

      const hmac = crypto.createHmac('sha1', key);
      hmac.update(countBuf);
      const hash = hmac.digest();

      const offset = hash.readUInt8(hash.length - 1) & 0xf;
      const binary = ((hash.readUInt8(offset) & 0x7f) << 24) |
                     ((hash.readUInt8(offset + 1) & 0xff) << 16) |
                     ((hash.readUInt8(offset + 2) & 0xff) << 8) |
                     (hash.readUInt8(offset + 3) & 0xff);

      const otp = (binary % 1000000).toString().padStart(6, '0');
      if (otp === cleanToken) return true;
    }
  } catch (err) {
    console.error('[TOTP] Verification failed:', err.message);
  }

  return false;
}

/**
 * Returns the provisioning URI for TOTP authentication.
 * @param {string} email 
 * @param {string} secret 
 * @returns {string}
 */
export function getOtpAuthUri(email, secret) {
  const issuer = encodeURIComponent('Stop & Shop');
  const account = encodeURIComponent(email);
  return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates 10 random alphanumeric backup codes.
 * @returns {string[]}
 */
export function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    // Generate 10-character code (e.g., 5 bytes hex = 10 chars)
    codes.push(crypto.randomBytes(5).toString('hex'));
  }
  return codes;
}
