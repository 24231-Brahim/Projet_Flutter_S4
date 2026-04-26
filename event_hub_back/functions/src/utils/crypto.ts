import * as crypto from 'crypto';
import * as functions from 'firebase-functions';

const HMAC_SECRET = functions.config().qr?.hmac_secret || process.env.QR_HMAC_SECRET || 'default-secret-change-me';

export interface QrTokenPayload {
  bookingId: string;
  timestamp: number;
  nonce: string;
}

export function generateQrToken(bookingId: string): string {
  const payload: QrTokenPayload = {
    bookingId,
    timestamp: Date.now(),
    nonce: crypto.randomUUID(),
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(payloadString)
    .digest('hex');

  const token = Buffer.from(JSON.stringify({
    payload: payloadString,
    signature,
  })).toString('base64url');

  return token;
}

export function verifyQrToken(token: string): QrTokenPayload | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    const { payload, signature } = decoded;

    const expectedSignature = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      functions.logger.warn('Invalid QR token signature');
      return null;
    }

    const parsedPayload: QrTokenPayload = JSON.parse(payload);
    return parsedPayload;
  } catch (error) {
    functions.logger.error('Error verifying QR token:', error);
    return null;
  }
}

export function generateSecureId(): string {
  return crypto.randomUUID();
}
