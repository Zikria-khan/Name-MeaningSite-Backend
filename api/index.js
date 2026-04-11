const path = require('path');
const dotenv = require('dotenv');

// Load environment variables for Vercel local or serverless execution.
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../index');
const { connectDB } = require('../src/config/database');

let dbConnectPromise = null;

async function ensureDBConnection() {
  if (!dbConnectPromise) {
    dbConnectPromise = connectDB().catch((error) => {
      console.error('MongoDB connection failed:', error);
      dbConnectPromise = null;
      throw error;
    });
  }
  return dbConnectPromise;
}

ensureDBConnection();

module.exports = app;
