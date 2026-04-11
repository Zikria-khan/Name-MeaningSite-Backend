const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nameverse', {
      // Connection options for better performance
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      autoIndex: process.env.NODE_ENV === 'development', // Don't build indexes in production
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Log connection events
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to DB');
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('Mongoose reconnected to DB');
    });
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err}`);  
  // In production, you might want to implement reconnection logic here
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = {
  connectDB,
  disconnectDB,
  mongoose
};
