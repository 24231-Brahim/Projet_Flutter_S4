import * as functions from 'firebase-functions';

export const ROLES = {
  USER: 'user',
  ORGANISATEUR: 'organisateur',
  ADMIN: 'admin',
} as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export const TICKET_TYPE = {
  STANDARD: 'standard',
  VIP: 'vip',
  EARLY_BIRD: 'early_bird',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const NOTIFICATION_TYPE = {
  BOOKING_CONFIRMED: 'booking_confirmed',
  EVENT_REMINDER: 'event_reminder',
  TICKET_READY: 'ticket_ready',
  CANCELLATION: 'cancellation',
  PROMOTION: 'promotion',
} as const;

export const CANCELLATION_POLICY = {
  MIN_HOURS_BEFORE: 24,
  REFUND_PERCENTAGE: 100,
} as const;

export const CONFIG = {
  MAX_BOOKING_QUANTITY: 10,
  MAX_EVENT_CAPACITY: 1000000,
  MAX_REVIEW_LENGTH: 2000,
  MAX_DESCRIPTION_LENGTH: 10000,
  MAX_TITLE_LENGTH: 200,
  NOTIFICATION_RETENTION_DAYS: 30,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  QR_CODE_SIZE: 300,
  PDF_PAGE_SIZE: 'A4',
  STRIPE_CURRENCY: 'usd',
} as const;

export function getEnvironment(): string {
  return functions.config().env?.name || process.env.NODE_ENV || 'development';
}

export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

export function isDevelopment(): boolean {
  return !isProduction();
}
