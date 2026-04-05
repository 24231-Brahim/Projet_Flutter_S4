import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InsufficientSeatsError,
  EventNotAvailableError,
  CancellationNotAllowedError,
} from '../errors';

describe('errors', () => {
  describe('AppError', () => {
    it('should create an error with code and message', () => {
      const error = new AppError('Something went wrong', 'INTERNAL_ERROR', 500);
      
      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AppError');
    });

    it('should default to status code 500', () => {
      const error = new AppError('Error', 'ERROR');
      expect(error.statusCode).toBe(500);
    });

    it('should be an instance of Error', () => {
      const error = new AppError('Error', 'ERROR');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with INVALID_ARGUMENT code', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('INVALID_ARGUMENT');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with NOT_FOUND code', () => {
      const error = new NotFoundError('User');
      
      expect(error.message).toBe('User not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should format resource name properly', () => {
      const error = new NotFoundError('Booking');
      expect(error.message).toBe('Booking not found');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with UNAUTHENTICATED code', () => {
      const error = new UnauthorizedError();
      
      expect(error.message).toBe('Unauthorized');
      expect(error.code).toBe('UNAUTHENTICATED');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Invalid token');
      expect(error.message).toBe('Invalid token');
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error with PERMISSION_DENIED code', () => {
      const error = new ForbiddenError();
      
      expect(error.message).toBe('Forbidden');
      expect(error.code).toBe('PERMISSION_DENIED');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });

    it('should accept custom message', () => {
      const error = new ForbiddenError('Access denied');
      expect(error.message).toBe('Access denied');
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error with ALREADY_EXISTS code', () => {
      const error = new ConflictError('User already exists');
      
      expect(error.message).toBe('User already exists');
      expect(error.code).toBe('ALREADY_EXISTS');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('InsufficientSeatsError', () => {
    it('should create insufficient seats error with details', () => {
      const error = new InsufficientSeatsError(10, 20);
      
      expect(error.message).toContain('10');
      expect(error.message).toContain('20');
      expect(error.code).toBe('INSUFFICIENT_SEATS');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('InsufficientSeatsError');
    });
  });

  describe('EventNotAvailableError', () => {
    it('should create event not available error with eventId', () => {
      const error = new EventNotAvailableError('event-123');
      
      expect(error.message).toContain('event-123');
      expect(error.code).toBe('EVENT_NOT_AVAILABLE');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('EventNotAvailableError');
    });
  });

  describe('CancellationNotAllowedError', () => {
    it('should create cancellation not allowed error with reason', () => {
      const error = new CancellationNotAllowedError('within 24 hours');
      
      expect(error.message).toContain('within 24 hours');
      expect(error.code).toBe('CANCELLATION_NOT_ALLOWED');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('CancellationNotAllowedError');
    });
  });
});
