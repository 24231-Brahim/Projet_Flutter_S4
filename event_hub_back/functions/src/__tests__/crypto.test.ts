import { generateQrToken, verifyQrToken, generateSecureId } from '../crypto';

describe('crypto utils', () => {
  describe('generateQrToken', () => {
    it('should generate a valid QR token', () => {
      const bookingId = 'booking-123';
      const token = generateQrToken(bookingId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens for same bookingId', () => {
      const bookingId = 'booking-123';
      const token1 = generateQrToken(bookingId);
      const token2 = generateQrToken(bookingId);
      
      expect(token1).not.toBe(token2);
    });

    it('should generate base64url encoded token', () => {
      const token = generateQrToken('booking-123');
      
      const base64urlRegex = /^[A-Za-z0-9_-]+$/;
      expect(token).toMatch(base64urlRegex);
    });

    it('should contain bookingId in token payload', () => {
      const bookingId = 'booking-123';
      const token = generateQrToken(bookingId);
      
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
      const payload = JSON.parse(decoded.payload);
      
      expect(payload.bookingId).toBe(bookingId);
    });

    it('should include timestamp in token payload', () => {
      const token = generateQrToken('booking-123');
      
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
      const payload = JSON.parse(decoded.payload);
      
      expect(payload.timestamp).toBeDefined();
      expect(typeof payload.timestamp).toBe('number');
      expect(payload.timestamp).toBeGreaterThan(0);
    });

    it('should include nonce in token payload', () => {
      const token = generateQrToken('booking-123');
      
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
      const payload = JSON.parse(decoded.payload);
      
      expect(payload.nonce).toBeDefined();
      expect(payload.nonce.length).toBeGreaterThan(0);
    });

    it('should include signature in token', () => {
      const token = generateQrToken('booking-123');
      
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
      
      expect(decoded.signature).toBeDefined();
      expect(decoded.signature.length).toBe(64);
    });
  });

  describe('verifyQrToken', () => {
    it('should verify a valid token', () => {
      const bookingId = 'booking-123';
      const token = generateQrToken(bookingId);
      
      const payload = verifyQrToken(token);
      
      expect(payload).not.toBeNull();
      expect(payload?.bookingId).toBe(bookingId);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      const payload = verifyQrToken(invalidToken);
      
      expect(payload).toBeNull();
    });

    it('should return null for tampered token', () => {
      const token = generateQrToken('booking-123');
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      
      const payload = verifyQrToken(tamperedToken);
      
      expect(payload).toBeNull();
    });

    it('should return null for empty token', () => {
      const payload = verifyQrToken('');
      expect(payload).toBeNull();
    });

    it('should return null for malformed base64', () => {
      const payload = verifyQrToken('not-valid-base64!!!');
      expect(payload).toBeNull();
    });

    it('should detect tampered signature', () => {
      const token = generateQrToken('booking-123');
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
      
      decoded.signature = 'a'.repeat(64);
      
      const tamperedToken = Buffer.from(JSON.stringify(decoded)).toString('base64url');
      const payload = verifyQrToken(tamperedToken);
      
      expect(payload).toBeNull();
    });

    it('should handle unicode characters in bookingId', () => {
      const bookingId = 'booking-123-événement';
      const token = generateQrToken(bookingId);
      
      const payload = verifyQrToken(token);
      
      expect(payload?.bookingId).toBe(bookingId);
    });
  });

  describe('generateSecureId', () => {
    it('should generate a UUID', () => {
      const id = generateSecureId();
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSecureId());
      }
      expect(ids.size).toBe(100);
    });
  });
});
