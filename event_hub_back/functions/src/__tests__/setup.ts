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
  pubsub: {
    schedule: jest.fn(() => ({
      onRun: jest.fn(),
    })),
  },
  firestore: {
    document: jest.fn(),
    collection: jest.fn(),
  },
  auth: {
    user: jest.fn(() => ({
      onCreate: jest.fn(),
      onDelete: jest.fn(),
    })),
  },
}));

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    FieldValue: {
      serverTimestamp: jest.fn(() => new Date()),
      increment: jest.fn((n: number) => n),
      arrayUnion: jest.fn(),
      arrayRemove: jest.fn(),
      delete: jest.fn(),
    },
    Timestamp: {
      now: jest.fn(() => new Date()),
      fromDate: jest.fn((d: Date) => d),
    },
    GeoPoint: jest.fn((lat: number, lng: number) => ({ latitude: lat, longitude: lng })),
  })),
  auth: jest.fn(() => ({
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  })),
  storage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        save: jest.fn(),
        makePublic: jest.fn(),
      })),
    })),
  })),
  messaging: jest.fn(() => ({
    send: jest.fn(),
    sendEachForMulticast: jest.fn(),
  })),
}));

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      confirm: jest.fn(),
      cancel: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

beforeEach(() => {
  jest.clearAllMocks();
});
