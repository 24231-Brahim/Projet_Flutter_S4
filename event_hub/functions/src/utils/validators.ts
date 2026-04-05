import { z } from 'zod';
import { ValidationError } from './errors';
import * as functions from 'firebase-functions';

const sanitizeString = (str: string): string => {
  return str
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 10000);
};

const sanitizeArray = <T extends string>(arr: T[]): T[] => {
  return arr.map(item => sanitizeString(item) as T);
};

export const createEventSchema = z.object({
  titre: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(10000),
  categorie: z.string().min(1, 'Category is required'),
  imageURL: z.string().url().optional(),
  lieu: z.string().min(1, 'Location is required').max(500),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  dateDebut: z.number(),
  dateFin: z.number(),
  capaciteTotale: z.number().int().positive('Capacity must be positive'),
  tags: z.array(z.string()).max(20).optional().default([]),
});

export const createTicketSchema = z.object({
  type: z.enum(['standard', 'vip', 'early_bird']),
  prix: z.number().min(0),
  quantiteDisponible: z.number().int().nonnegative(),
  description: z.string().max(500).optional(),
});

export const createBookingSchema = z.object({
  eventId: z.string().min(1),
  ticketId: z.string().min(1),
  quantite: z.number().int().positive().max(10),
});

export const createReviewSchema = z.object({
  eventId: z.string().min(1),
  note: z.number().int().min(1).max(5),
  commentaire: z.string().max(2000).optional().default(''),
});

export const validateTicketSchema = z.object({
  qrCodeToken: z.string().min(1),
});

export const updateFcmTokenSchema = z.object({
  fcmToken: z.string().min(1),
});

export const eventFiltersSchema = z.object({
  categorie: z.string().optional(),
  lieu: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  startDate: z.number().optional(),
  endDate: z.number().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().optional(),
});

export const searchEventsSchema = z.object({
  query: z.string().min(1).max(200),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().positive().max(500).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ValidateTicketInput = z.infer<typeof validateTicketSchema>;
export type UpdateFcmTokenInput = z.infer<typeof updateFcmTokenSchema>;
export type EventFiltersInput = z.infer<typeof eventFiltersSchema>;
export type SearchEventsInput = z.infer<typeof searchEventsSchema>;

export function validateAndSanitize<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    const validated = schema.parse(data);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      functions.logger.warn('Validation failed', { errors: error.errors });
      throw new ValidationError(message);
    }
    throw error;
  }
}

export function validateCreateEvent(data: unknown) {
  const validated = validateAndSanitize(createEventSchema, data);
  return {
    ...validated,
    titre: sanitizeString(validated.titre),
    description: sanitizeString(validated.description),
    categorie: sanitizeString(validated.categorie),
    lieu: sanitizeString(validated.lieu),
    tags: sanitizeArray(validated.tags || []),
  };
}

export function validateCreateTicket(data: unknown) {
  const validated = validateAndSanitize(createTicketSchema, data);
  return {
    ...validated,
    description: validated.description ? sanitizeString(validated.description) : undefined,
  };
}

export function validateCreateBooking(data: unknown) {
  return validateAndSanitize(createBookingSchema, data);
}

export function validateCreateReview(data: unknown) {
  const validated = validateAndSanitize(createReviewSchema, data);
  return {
    ...validated,
    commentaire: sanitizeString(validated.commentaire || ''),
  };
}

export function validateTicketToken(data: unknown) {
  return validateAndSanitize(validateTicketSchema, data);
}

export function validateFcmToken(data: unknown) {
  return validateAndSanitize(updateFcmTokenSchema, data);
}

export function validateEventFilters(data: unknown) {
  return validateAndSanitize(eventFiltersSchema, data);
}

export function validateSearchEvents(data: unknown) {
  const validated = validateAndSanitize(searchEventsSchema, data);
  return {
    ...validated,
    query: sanitizeString(validated.query),
  };
}
