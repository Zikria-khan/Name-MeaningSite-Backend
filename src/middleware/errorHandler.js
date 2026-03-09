const { ValidationError } = require('joi');
const { JsonWebTokenError, TokenExpiredError } = require('jsonwebtoken');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // Handle Joi validation errors
  if (err instanceof ValidationError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
  } 
  // Handle JWT errors
  else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = 'Invalid token';
  } 
  else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = 'Token expired';
  }
  
  // Handle MongoDB duplicate key error
  else if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }
  
  // Handle Mongoose validation errors
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  
  // Handle Mongoose validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // Log the error with more context
  logger.error({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    status: statusCode,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.userId || 'anonymous'
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length ? errors : undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
