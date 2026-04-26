import * as admin from 'firebase-admin';

jest.mock('firebase-admin', () => {
  const mockFieldValue = {
    serverTimestamp: jest.fn(() => new Date()),
    increment: jest.fn((n: number) => n),
    arrayUnion: jest.fn(() => []),
    arrayRemove: jest.fn(() => []),
    delete: jest.fn(() => ({ _methodName: 'delete' })),
  };

  const mockData: Record<string, any> = {};

  const mockDoc = {
    set: jest.fn().mockImplementation((data) => {
      Object.assign(mockData, data);
      return Promise.resolve();
    }),
    get: jest.fn().mockImplementation(() => Promise.resolve({
      exists: true,
      data: () => mockData,
      id: 'user-123',
    })),
    update: jest.fn().mockImplementation(() => Promise.resolve()),
    delete: jest.fn().mockImplementation(() => Promise.resolve()),
  };

  const mockCollection = {
    doc: jest.fn().mockReturnValue(mockDoc),
    add: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'new-doc-id' })),
    get: jest.fn().mockImplementation(() => Promise.resolve({
      docs: [],
      forEach: jest.fn(),
      size: 0,
    })),
  };

  const mockBatch = {
    update: jest.fn().mockReturnThis(),
    commit: jest.fn().mockImplementation(() => Promise.resolve()),
  };

  return {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => ({
      FieldValue: mockFieldValue,
      Timestamp: {
        now: jest.fn(() => new Date()),
        fromDate: jest.fn((d: Date) => d),
      },
      GeoPoint: jest.fn((lat: number, lng: number) => ({ latitude: lat, longitude: lng })),
      collection: jest.fn(() => mockCollection),
      doc: jest.fn(() => mockDoc),
      batch: jest.fn(() => mockBatch),
      runTransaction: jest.fn((fn) => fn({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({}),
        }),
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
    FieldValue: mockFieldValue,
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
  auth: {
    user: jest.fn(() => ({
      onCreate: jest.fn((handler) => handler({ uid: 'test-uid', email: 'test@example.com', displayName: 'Test', photoURL: '' })),
      onDelete: jest.fn((handler) => handler({ uid: 'test-uid' })),
    })),
  },
}));

import { onUserCreated, onUserDeleted, updateUserProfile, getUserProfile } from '../auth';

describe('auth functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('onUserCreated', () => {
    it('should be defined as a function', () => {
      expect(typeof onUserCreated).toBe('function');
    });

    it('should have proper function signature', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };

      const result = await onUserCreated(mockUser as any);
      expect(result).toBeDefined();
    });
  });

  describe('onUserDeleted', () => {
    it('should be defined as a function', () => {
      expect(typeof onUserDeleted).toBe('function');
    });

    it('should handle user deletion', async () => {
      const mockUser = { uid: 'user-123' };
      const result = await onUserDeleted(mockUser as any);
      expect(result).toBeDefined();
    });
  });

  describe('updateUserProfile', () => {
    it('should throw unauthenticated error when no context', async () => {
      const mockContext = { auth: null };
      const mockData = { nom: 'New Name' };

      await expect(updateUserProfile(mockData, mockContext as any)).rejects.toThrow();
    });
  });

  describe('getUserProfile', () => {
    it('should throw unauthenticated error when no context', async () => {
      const mockContext = { auth: null };

      await expect(getUserProfile({}, mockContext as any)).rejects.toThrow();
    });
  });
});
