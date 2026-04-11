const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env if present
dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./src/config/database');
const app = require('./api/index');

connectDB().catch((error) => {
  console.error('Failed to connect to MongoDB:', error.message);
});

module.exports = app;
