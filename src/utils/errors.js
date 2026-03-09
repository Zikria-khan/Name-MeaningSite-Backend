/**
 * Custom Error Classes for Professional Error Handling
 * @module utils/errors
 */

/**
 * Base Application Error
 * @extends Error
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Validation Error - 400 Bad Request
 */
class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      error: {
        ...super.toJSON().error,
        details: this.details
      }
    };
  }
}

/**
 * Not Found Error - 404
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource', identifier = '') {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.resource = resource;
    this.identifier = identifier;
  }
}

/**
 * Unauthorized Error - 401
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error - 403
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Conflict Error - 409
 */
class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Rate Limit Error - 429
 */
class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

/**
 * Database Error - 503
 */
class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 503, 'DATABASE_ERROR');
  }
}

/**
 * Cache Error - 503 (non-critical)
 */
class CacheError extends AppError {
  constructor(message = 'Cache operation failed') {
    super(message, 503, 'CACHE_ERROR');
    this.isOperational = true; // Cache errors shouldn't crash the app
  }
}

/**
 * Service Unavailable Error - 503
 */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * Invalid Religion Error - specific to this app
 */
class InvalidReligionError extends ValidationError {
  constructor(religion) {
    super(`Invalid religion: '${religion}'. Valid options are: islamic, christian, hindu`, [
      { field: 'religion', message: 'Must be one of: islamic, christian, hindu', value: religion }
    ]);
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Create error from unknown type
 * @param {*} error - Unknown error type
 * @returns {AppError} Normalized AppError
 */
const normalizeError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  // Mongoose validation error
  if (error.name === 'ValidationError' && error.errors) {
    const details = Object.values(error.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return new ValidationError('Validation failed', details);
  }

  // Mongoose CastError (invalid ObjectId)
  if (error.name === 'CastError') {
    return new ValidationError(`Invalid ${error.path}: ${error.value}`);
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return new ConflictError(`${field} already exists`);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid token');
  }
  if (error.name === 'TokenExpiredError') {
    return new UnauthorizedError('Token expired');
  }

  // Generic error
  return new AppError(error.message || 'An unexpected error occurred', 500);
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  CacheError,
  ServiceUnavailableError,
  InvalidReligionError,
  asyncHandler,
  normalizeError
};
