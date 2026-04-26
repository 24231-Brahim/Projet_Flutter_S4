import {
  ROLES,
  BOOKING_STATUS,
  EVENT_STATUS,
  TICKET_TYPE,
  PAYMENT_STATUS,
  NOTIFICATION_TYPE,
  CANCELLATION_POLICY,
  CONFIG,
  getEnvironment,
  isProduction,
  isDevelopment,
} from '../constants';

describe('constants', () => {
  describe('ROLES', () => {
    it('should have all required roles', () => {
      expect(ROLES.USER).toBe('user');
      expect(ROLES.ORGANISATEUR).toBe('organisateur');
      expect(ROLES.ADMIN).toBe('admin');
    });

    it('should use const assertion', () => {
      expect(ROLES).toEqual({
        USER: 'user',
        ORGANISATEUR: 'organisateur',
        ADMIN: 'admin',
      });
    });
  });

  describe('BOOKING_STATUS', () => {
    it('should have all booking statuses', () => {
      expect(BOOKING_STATUS.PENDING).toBe('pending');
      expect(BOOKING_STATUS.CONFIRMED).toBe('confirmed');
      expect(BOOKING_STATUS.CANCELLED).toBe('cancelled');
      expect(BOOKING_STATUS.REFUNDED).toBe('refunded');
    });
  });

  describe('EVENT_STATUS', () => {
    it('should have all event statuses', () => {
      expect(EVENT_STATUS.DRAFT).toBe('draft');
      expect(EVENT_STATUS.PUBLISHED).toBe('published');
      expect(EVENT_STATUS.CANCELLED).toBe('cancelled');
      expect(EVENT_STATUS.COMPLETED).toBe('completed');
    });
  });

  describe('TICKET_TYPE', () => {
    it('should have all ticket types', () => {
      expect(TICKET_TYPE.STANDARD).toBe('standard');
      expect(TICKET_TYPE.VIP).toBe('vip');
      expect(TICKET_TYPE.EARLY_BIRD).toBe('early_bird');
    });
  });

  describe('PAYMENT_STATUS', () => {
    it('should have all payment statuses', () => {
      expect(PAYMENT_STATUS.PENDING).toBe('pending');
      expect(PAYMENT_STATUS.SUCCEEDED).toBe('succeeded');
      expect(PAYMENT_STATUS.FAILED).toBe('failed');
      expect(PAYMENT_STATUS.REFUNDED).toBe('refunded');
    });
  });

  describe('NOTIFICATION_TYPE', () => {
    it('should have all notification types', () => {
      expect(NOTIFICATION_TYPE.BOOKING_CONFIRMED).toBe('booking_confirmed');
      expect(NOTIFICATION_TYPE.EVENT_REMINDER).toBe('event_reminder');
      expect(NOTIFICATION_TYPE.TICKET_READY).toBe('ticket_ready');
      expect(NOTIFICATION_TYPE.CANCELLATION).toBe('cancellation');
      expect(NOTIFICATION_TYPE.PROMOTION).toBe('promotion');
    });
  });

  describe('CANCELLATION_POLICY', () => {
    it('should have correct minimum hours', () => {
      expect(CANCELLATION_POLICY.MIN_HOURS_BEFORE).toBe(24);
    });

    it('should have correct refund percentage', () => {
      expect(CANCELLATION_POLICY.REFUND_PERCENTAGE).toBe(100);
    });
  });

  describe('CONFIG', () => {
    it('should have correct max booking quantity', () => {
      expect(CONFIG.MAX_BOOKING_QUANTITY).toBe(10);
    });

    it('should have correct max event capacity', () => {
      expect(CONFIG.MAX_EVENT_CAPACITY).toBe(1000000);
    });

    it('should have correct limits', () => {
      expect(CONFIG.MAX_REVIEW_LENGTH).toBe(2000);
      expect(CONFIG.MAX_DESCRIPTION_LENGTH).toBe(10000);
      expect(CONFIG.MAX_TITLE_LENGTH).toBe(200);
    });

    it('should have correct page sizes', () => {
      expect(CONFIG.DEFAULT_PAGE_SIZE).toBe(20);
      expect(CONFIG.MAX_PAGE_SIZE).toBe(100);
    });

    it('should have correct ticket config', () => {
      expect(CONFIG.QR_CODE_SIZE).toBe(300);
      expect(CONFIG.PDF_PAGE_SIZE).toBe('A4');
    });

    it('should have correct currency', () => {
      expect(CONFIG.STRIPE_CURRENCY).toBe('usd');
    });

    it('should have notification retention days', () => {
      expect(CONFIG.NOTIFICATION_RETENTION_DAYS).toBe(30);
    });
  });

  describe('getEnvironment', () => {
    it('should return a string', () => {
      const env = getEnvironment();
      expect(typeof env).toBe('string');
    });
  });

  describe('isProduction', () => {
    it('should return boolean', () => {
      const result = isProduction();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isDevelopment', () => {
    it('should return opposite of isProduction', () => {
      expect(isDevelopment()).toBe(!isProduction());
    });
  });
});
