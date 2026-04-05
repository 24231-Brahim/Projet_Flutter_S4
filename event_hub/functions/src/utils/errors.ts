export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'INVALID_ARGUMENT', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHENTICATED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 'PERMISSION_DENIED', 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'ALREADY_EXISTS', 409);
    this.name = 'ConflictError';
  }
}

export class InsufficientSeatsError extends AppError {
  constructor(available: number, requested: number) {
    super(`Insufficient seats. Available: ${available}, Requested: ${requested}`, 'INSUFFICIENT_SEATS', 400);
    this.name = 'InsufficientSeatsError';
  }
}

export class EventNotAvailableError extends AppError {
  constructor(eventId: string) {
    super(`Event ${eventId} is not available for booking`, 'EVENT_NOT_AVAILABLE', 400);
    this.name = 'EventNotAvailableError';
  }
}

export class CancellationNotAllowedError extends AppError {
  constructor(reason: string) {
    super(`Cancellation not allowed: ${reason}`, 'CANCELLATION_NOT_ALLOWED', 400);
    this.name = 'CancellationNotAllowedError';
  }
}
