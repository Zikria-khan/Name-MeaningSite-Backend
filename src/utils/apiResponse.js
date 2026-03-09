/**
 * API Response Utilities for Consistent Response Format
 * @module utils/apiResponse
 */

/**
 * Standard API Response Format
 */
class ApiResponse {
  /**
   * Success response
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {Object} meta - Additional metadata
   * @returns {Object} Formatted response
   */
  static success(data, message = 'Success', meta = {}) {
    return {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    };
  }

  /**
   * Paginated success response
   * @param {Array} data - Array of items
   * @param {Object} pagination - Pagination details
   * @param {string} message - Success message
   * @returns {Object} Formatted paginated response
   */
  static paginated(data, pagination, message = 'Success') {
    const { page, limit, total, totalPages } = pagination;
    
    return {
      success: true,
      message,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
        totalPages: Number(totalPages),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      },
      meta: {
        count: data.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Error response
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {number} statusCode - HTTP status code
   * @param {Array} details - Error details
   * @returns {Object} Formatted error response
   */
  static error(message, code = 'ERROR', statusCode = 500, details = []) {
    return {
      success: false,
      error: {
        code,
        message,
        statusCode,
        details: details.length > 0 ? details : undefined,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Created response (201)
   * @param {*} data - Created resource
   * @param {string} message - Success message
   * @returns {Object} Formatted response
   */
  static created(data, message = 'Resource created successfully') {
    return this.success(data, message, { statusCode: 201 });
  }

  /**
   * No content response (204)
   * @param {string} message - Success message
   * @returns {Object} Formatted response
   */
  static noContent(message = 'Operation completed successfully') {
    return {
      success: true,
      message,
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Cache response wrapper
   * @param {Object} response - Original response
   * @param {string} source - Data source (cache/database)
   * @param {number} ttl - Cache TTL in seconds
   * @returns {Object} Response with cache info
   */
  static withCacheInfo(response, source = 'database', ttl = null) {
    return {
      ...response,
      meta: {
        ...response.meta,
        source,
        cached: source === 'cache',
        cacheTTL: ttl
      }
    };
  }
}

/**
 * Response sender middleware helper
 */
class ResponseSender {
  constructor(res) {
    this.res = res;
  }

  /**
   * Send success response
   */
  success(data, message = 'Success', statusCode = 200) {
    return this.res.status(statusCode).json(ApiResponse.success(data, message));
  }

  /**
   * Send paginated response
   */
  paginated(data, pagination, message = 'Success') {
    return this.res.status(200).json(ApiResponse.paginated(data, pagination, message));
  }

  /**
   * Send created response
   */
  created(data, message = 'Resource created successfully') {
    return this.res.status(201).json(ApiResponse.created(data, message));
  }

  /**
   * Send no content response
   */
  noContent(message = 'Operation completed') {
    return this.res.status(204).json(ApiResponse.noContent(message));
  }

  /**
   * Send error response
   */
  error(message, code = 'ERROR', statusCode = 500, details = []) {
    return this.res.status(statusCode).json(ApiResponse.error(message, code, statusCode, details));
  }

  /**
   * Send not found response
   */
  notFound(resource = 'Resource', identifier = '') {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    return this.error(message, 'NOT_FOUND', 404);
  }

  /**
   * Send validation error
   */
  validationError(message, details = []) {
    return this.error(message, 'VALIDATION_ERROR', 400, details);
  }

  /**
   * Send with cache headers
   */
  cached(data, message, maxAge = 300, source = 'database') {
    this.res.set({
      'Cache-Control': `public, max-age=${maxAge}`,
      'X-Cache-Source': source
    });
    return this.res.status(200).json(ApiResponse.withCacheInfo(
      ApiResponse.success(data, message),
      source,
      maxAge
    ));
  }
}

/**
 * Express middleware to attach response sender
 */
const attachResponseSender = (req, res, next) => {
  res.api = new ResponseSender(res);
  next();
};

module.exports = {
  ApiResponse,
  ResponseSender,
  attachResponseSender
};
