const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Global test setup
beforeAll(async () => {
  // Set longer timeout for database operations
  jest.setTimeout(60000);

  // Connect to test database if different from production
  const MONGODB_URI = process.env.MONGODB_URI;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
  }
});

afterAll(async () => {
  // Clean up database connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

// Clean up after each test
afterEach(async () => {
  // Reset any mocks or global state if needed
});