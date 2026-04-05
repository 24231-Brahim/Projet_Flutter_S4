jest.mock('firebase-admin', () => {
  const mockData: Record<string, any> = {};

  const mockDoc = {
    set: jest.fn().mockImplementation((data) => {
      Object.assign(mockData, data);
      return Promise.resolve();
    }),
    get: jest.fn().mockImplementation(() => Promise.resolve({
      exists: true,
      data: () => mockData,
      id: 'doc-123',
      ref: mockDoc,
    })),
    update: jest.fn().mockImplementation((data) => {
      Object.assign(mockData, data);
      return Promise.resolve();
    }),
    delete: jest.fn().mockImplementation(() => Promise.resolve()),
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue(mockDoc),
      add: jest.fn().mockResolvedValue({ id: 'sub-doc-id' }),
      get: jest.fn().mockResolvedValue({ docs: [], empty: true }),
    }),
  };

  return {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => ({
      FieldValue: {
        serverTimestamp: jest.fn(() => new Date()),
        increment: jest.fn((n: number) => n),
      },
      Timestamp: {
        now: jest.fn(() => new Date()),
        fromDate: jest.fn((d: Date) => d),
      },
      GeoPoint: jest.fn((lat: number, lng: number) => ({ latitude: lat, longitude: lng })),
      collection: jest.fn(() => ({
        doc: jest.fn().mockReturnValue(mockDoc),
        add: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
        get: jest.fn().mockResolvedValue({ docs: [], empty: true, size: 0 }),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        startAfter: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
      })),
      doc: jest.fn(() => mockDoc),
      batch: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue([]),
      })),
      runTransaction: jest.fn((fn) => fn({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
        update: jest.fn(),
        set: jest.fn(),
      })),
    })),
    auth: jest.fn(() => ({
      updateUser: jest.fn().mockResolvedValue(undefined),
      deleteUser: jest.fn().mockResolvedValue(undefined),
    })),
    storage: jest.fn(() => ({
      bucket: jest.fn(() => ({
        file: jest.fn(() => ({
          save: jest.fn().mockResolvedValue(undefined),
          makePublic: jest.fn().mockResolvedValue(undefined),
        })),
      })),
    })),
    messaging: jest.fn(() => ({
      send: jest.fn().mockResolvedValue('message-id'),
      sendEachForMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 }),
    })),
  };
});

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

jest.mock('firebase-functions', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  config: jest.fn(() => ({
    stripe: { secret_key: 'sk_test_mock', webhook_secret: 'whsec_mock' },
    sendgrid: { api_key: 'SG.mock', from_email: 'test@test.com' },
    qr: { hmac_secret: 'test-secret-key-12345678901234567890' },
  })),
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(
        public code: string,
        public message: string
      ) {
        super(message);
        this.name = 'HttpsError';
      }
    },
  },
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_mock',
        client_secret: 'pi_mock_secret',
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_mock',
        client_secret: 'pi_mock_secret',
      }),
    },
    refunds: {
      create: jest.fn().mockResolvedValue({ id: 're_mock' }),
    },
  }));
});

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    const mockDoc = {
      on: jest.fn((event, callback) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockDoc;
      }),
      rect: jest.fn().mockReturnThis(),
      fill: jest.fn().mockReturnThis(),
      lineWidth: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      fillColor: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      image: jest.fn().mockReturnThis(),
      roundedRect: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };
    return mockDoc;
  });
});

import { createBooking, confirmBooking, cancelBooking, getUserBookings } from '../bookings';
import { validateTicket } from '../tickets';

describe('bookings functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should be defined as a function', () => {
      expect(typeof createBooking).toBe('function');
    });

    it('should throw unauthenticated error when no context', async () => {
      const mockContext = { auth: null };
      const mockData = {
        eventId: 'event-123',
        ticketId: 'ticket-456',
        quantite: 2,
      };

      await expect(createBooking(mockData, mockContext as any)).rejects.toThrow();
    });
  });

  describe('confirmBooking', () => {
    it('should be defined as a function', () => {
      expect(typeof confirmBooking).toBe('function');
    });

    it('should throw unauthenticated error when no context', async () => {
      const mockContext = { auth: null };
      const mockData = { bookingId: 'booking-123' };

      await expect(confirmBooking(mockData, mockContext as any)).rejects.toThrow();
    });
  });

  describe('cancelBooking', () => {
    it('should be defined as a function', () => {
      expect(typeof cancelBooking).toBe('function');
    });

    it('should throw unauthenticated error when no context', async () => {
      const mockContext = { auth: null };
      const mockData = { bookingId: 'booking-123' };

      await expect(cancelBooking(mockData, mockContext as any)).rejects.toThrow();
    });
  });

  describe('getUserBookings', () => {
    it('should be defined as a function', () => {
      expect(typeof getUserBookings).toBe('function');
    });

    it('should throw unauthenticated error when no context', async () => {
      const mockContext = { auth: null };

      await expect(getUserBookings({}, mockContext as any)).rejects.toThrow();
    });
  });
});

describe('tickets functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateTicket', () => {
    it('should be defined as a function', () => {
      expect(typeof validateTicket).toBe('function');
    });

    it('should throw unauthenticated error when no context', async () => {
      const mockContext = { auth: null };
      const mockData = { qrCodeToken: 'valid-token' };

      await expect(validateTicket(mockData, mockContext as any)).rejects.toThrow();
    });

    it('should throw invalid argument for missing token', async () => {
      const mockContext = { auth: { uid: 'user-123' } };

      await expect(validateTicket({}, mockContext as any)).rejects.toThrow();
    });
  });
});
