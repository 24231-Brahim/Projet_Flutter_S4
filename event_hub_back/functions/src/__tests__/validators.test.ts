import {
  validateCreateEvent,
  validateCreateTicket,
  validateCreateBooking,
  validateCreateReview,
  validateEventFilters,
  validateSearchEvents,
  validateAndSanitize,
  createEventSchema,
  createBookingSchema,
  createReviewSchema,
} from '../validators';

describe('validators', () => {
  describe('validateAndSanitize', () => {
    it('should validate and return parsed data', () => {
      const data = { titre: 'Test Event', categorie: 'Music', lieu: 'NYC' };
      const result = validateAndSanitize(createEventSchema, data);
      expect(result.titre).toBe('Test Event');
    });

    it('should throw ValidationError for invalid data', () => {
      const data = { titre: '', categorie: '', lieu: '' };
      expect(() => validateAndSanitize(createEventSchema, data)).toThrow();
    });
  });

  describe('validateCreateEvent', () => {
    const validEventData = {
      titre: 'Test Event',
      description: 'A great event',
      categorie: 'Music',
      lieu: 'New York City',
      dateDebut: Date.now() + 86400000,
      dateFin: Date.now() + 172800000,
      capaciteTotale: 100,
      tags: ['music', 'festival'],
    };

    it('should validate a valid event', () => {
      const result = validateCreateEvent(validEventData);
      expect(result.titre).toBe('Test Event');
      expect(result.categorie).toBe('Music');
      expect(result.capaciteTotale).toBe(100);
    });

    it('should sanitize input strings', () => {
      const dataWithXSS = {
        ...validEventData,
        titre: '<script>alert("xss")</script>Test Event',
        description: 'Normal description',
      };
      const result = validateCreateEvent(dataWithXSS);
      expect(result.titre).not.toContain('<script>');
      expect(result.titre).toContain('Test Event');
    });

    it('should trim whitespace from strings', () => {
      const dataWithWhitespace = {
        ...validEventData,
        titre: '  Test Event  ',
        lieu: '  NYC  ',
      };
      const result = validateCreateEvent(dataWithWhitespace);
      expect(result.titre).toBe('Test Event');
      expect(result.lieu).toBe('NYC');
    });

    it('should reject missing required fields', () => {
      const invalidData = { titre: 'Test' };
      expect(() => validateCreateEvent(invalidData)).toThrow();
    });

    it('should reject title exceeding max length', () => {
      const longTitle = 'a'.repeat(201);
      expect(() => validateCreateEvent({ ...validEventData, titre: longTitle })).toThrow();
    });

    it('should reject negative capacity', () => {
      expect(() => validateCreateEvent({ ...validEventData, capaciteTotale: -1 })).toThrow();
    });

    it('should reject capacity of zero', () => {
      expect(() => validateCreateEvent({ ...validEventData, capaciteTotale: 0 })).toThrow();
    });

    it('should accept valid latitude and longitude', () => {
      const data = { ...validEventData, latitude: 40.7128, longitude: -74.006 };
      const result = validateCreateEvent(data);
      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.006);
    });

    it('should reject invalid latitude', () => {
      expect(() => validateCreateEvent({ ...validEventData, latitude: 100 })).toThrow();
      expect(() => validateCreateEvent({ ...validEventData, latitude: -100 })).toThrow();
    });

    it('should reject invalid longitude', () => {
      expect(() => validateCreateEvent({ ...validEventData, longitude: 200 })).toThrow();
      expect(() => validateCreateEvent({ ...validEventData, longitude: -200 })).toThrow();
    });

    it('should accept optional imageURL', () => {
      const data = { ...validEventData, imageURL: 'https://example.com/image.jpg' };
      const result = validateCreateEvent(data);
      expect(result.imageURL).toBe('https://example.com/image.jpg');
    });

    it('should reject invalid imageURL', () => {
      expect(() => validateCreateEvent({ ...validEventData, imageURL: 'not-a-url' })).toThrow();
    });

    it('should limit tags to 20 items', () => {
      const tooManyTags = { ...validEventData, tags: Array(21).fill('tag') };
      expect(() => validateCreateEvent(tooManyTags)).toThrow();
    });
  });

  describe('validateCreateTicket', () => {
    const validTicketData = {
      type: 'standard',
      prix: 50,
      quantiteDisponible: 100,
      description: 'Standard ticket',
    };

    it('should validate a valid ticket', () => {
      const result = validateCreateTicket(validTicketData);
      expect(result.type).toBe('standard');
      expect(result.prix).toBe(50);
    });

    it('should accept all valid ticket types', () => {
      const types = ['standard', 'vip', 'early_bird'];
      types.forEach((type) => {
        const result = validateCreateTicket({ ...validTicketData, type });
        expect(result.type).toBe(type);
      });
    });

    it('should reject invalid ticket type', () => {
      expect(() => validateCreateTicket({ ...validTicketData, type: 'premium' })).toThrow();
    });

    it('should accept free tickets (prix: 0)', () => {
      const result = validateCreateTicket({ ...validTicketData, prix: 0 });
      expect(result.prix).toBe(0);
    });

    it('should reject negative price', () => {
      expect(() => validateCreateTicket({ ...validTicketData, prix: -10 })).toThrow();
    });

    it('should reject negative quantity', () => {
      expect(() => validateCreateTicket({ ...validTicketData, quantiteDisponible: -1 })).toThrow();
    });
  });

  describe('validateCreateBooking', () => {
    it('should validate a valid booking', () => {
      const validBooking = {
        eventId: 'event-123',
        ticketId: 'ticket-456',
        quantite: 2,
      };
      const result = validateCreateBooking(validBooking);
      expect(result.eventId).toBe('event-123');
      expect(result.ticketId).toBe('ticket-456');
      expect(result.quantite).toBe(2);
    });

    it('should reject missing eventId', () => {
      const invalidBooking = { ticketId: 'ticket-456', quantite: 1 };
      expect(() => validateCreateBooking(invalidBooking)).toThrow();
    });

    it('should reject quantity exceeding 10', () => {
      const invalidBooking = {
        eventId: 'event-123',
        ticketId: 'ticket-456',
        quantite: 11,
      };
      expect(() => validateCreateBooking(invalidBooking)).toThrow();
    });

    it('should reject zero quantity', () => {
      const invalidBooking = {
        eventId: 'event-123',
        ticketId: 'ticket-456',
        quantite: 0,
      };
      expect(() => validateCreateBooking(invalidBooking)).toThrow();
    });

    it('should reject negative quantity', () => {
      const invalidBooking = {
        eventId: 'event-123',
        ticketId: 'ticket-456',
        quantite: -1,
      };
      expect(() => validateCreateBooking(invalidBooking)).toThrow();
    });
  });

  describe('validateCreateReview', () => {
    const validReviewData = {
      eventId: 'event-123',
      note: 5,
      commentaire: 'Great event!',
    };

    it('should validate a valid review', () => {
      const result = validateCreateReview(validReviewData);
      expect(result.eventId).toBe('event-123');
      expect(result.note).toBe(5);
    });

    it('should accept note from 1 to 5', () => {
      for (let note = 1; note <= 5; note++) {
        const result = validateCreateReview({ ...validReviewData, note });
        expect(result.note).toBe(note);
      }
    });

    it('should reject note below 1', () => {
      expect(() => validateCreateReview({ ...validReviewData, note: 0 })).toThrow();
    });

    it('should reject note above 5', () => {
      expect(() => validateCreateReview({ ...validReviewData, note: 6 })).toThrow();
    });

    it('should accept empty comment', () => {
      const result = validateCreateReview({ ...validReviewData, commentaire: '' });
      expect(result.commentaire).toBe('');
    });

    it('should reject comment exceeding 2000 chars', () => {
      const longComment = 'a'.repeat(2001);
      expect(() => validateCreateReview({ ...validReviewData, commentaire: longComment })).toThrow();
    });
  });

  describe('validateEventFilters', () => {
    it('should accept valid filters', () => {
      const filters = {
        categorie: 'Music',
        minPrice: 10,
        maxPrice: 100,
        startDate: Date.now(),
        endDate: Date.now() + 86400000,
        limit: 20,
      };
      const result = validateEventFilters(filters);
      expect(result.categorie).toBe('Music');
      expect(result.limit).toBe(20);
    });

    it('should use default limit of 20', () => {
      const result = validateEventFilters({});
      expect(result.limit).toBe(20);
    });

    it('should reject limit exceeding 100', () => {
      expect(() => validateEventFilters({ limit: 101 })).toThrow();
    });

    it('should reject limit below 1', () => {
      expect(() => validateEventFilters({ limit: 0 })).toThrow();
    });
  });

  describe('validateSearchEvents', () => {
    it('should validate search with query', () => {
      const result = validateSearchEvents({ query: 'music festival' });
      expect(result.query).toBe('music festival');
    });

    it('should sanitize search query', () => {
      const result = validateSearchEvents({ query: '  <script>test</script>  ' });
      expect(result.query).not.toContain('<script>');
      expect(result.query).toBe('<script>test</script>');
    });

    it('should accept valid geo coordinates', () => {
      const result = validateSearchEvents({
        query: 'concert',
        latitude: 40.7128,
        longitude: -74.006,
        radiusKm: 50,
      });
      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.006);
      expect(result.radiusKm).toBe(50);
    });

    it('should reject radius exceeding 500km', () => {
      expect(() => validateSearchEvents({
        query: 'test',
        latitude: 40,
        longitude: -74,
        radiusKm: 501,
      })).toThrow();
    });

    it('should reject empty query', () => {
      expect(() => validateSearchEvents({ query: '' })).toThrow();
    });
  });
});
