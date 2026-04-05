jest.mock('firebase-admin', () => {
  const mockData: Record<string, any> = {};
  const listeners: Map<string, Set<Function>> = new Map();

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

import { createEvent, publishEvent, cancelEvent, getUpcomingEvents, searchEvents } from '../events';

describe('events functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should be defined as a function', () => {
      expect(typeof createEvent).toBe('function');
    });

    it('should throw unauthenticated error when no context', async () => {
      const mockContext = { auth: null };
      const mockData = {
        titre: 'Test Event',
        description: 'Test',
        categorie: 'Music',
        lieu: 'NYC',
        dateDebut: Date.now() + 86400000,
        dateFin: Date.now() + 172800000,
        capaciteTotale: 100,
      };

      await expect(createEvent(mockData, mockContext as any)).rejects.toThrow();
    });
  });

  describe('publishEvent', () => {
    it('should be defined as a function', () => {
      expect(typeof publishEvent).toBe('function');
    });

    it('should throw unauthenticated error when no context', async () => {
      const mockContext = { auth: null };
      const mockData = { eventId: 'event-123' };

      await expect(publishEvent(mockData, mockContext as any)).rejects.toThrow();
    });
  });

  describe('cancelEvent', () => {
    it('should be defined as a function', () => {
      expect(typeof cancelEvent).toBe('function');
    });

    it('should throw unauthenticated error when no context', async () => {
      const mockContext = { auth: null };
      const mockData = { eventId: 'event-123' };

      await expect(cancelEvent(mockData, mockContext as any)).rejects.toThrow();
    });
  });

  describe('getUpcomingEvents', () => {
    it('should be defined as a function', () => {
      expect(typeof getUpcomingEvents).toBe('function');
    });

    it('should return events without authentication', async () => {
      const result = await getUpcomingEvents({});
      expect(result).toBeDefined();
    });
  });

  describe('searchEvents', () => {
    it('should be defined as a function', () => {
      expect(typeof searchEvents).toBe('function');
    });

    it('should return search results', async () => {
      const result = await searchEvents({ query: 'music' });
      expect(result).toBeDefined();
    });
  });
});
