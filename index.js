const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env if present
dotenv.config({ path: path.join(__dirname, '.env') });

const app = require('./api/index');

module.exports = app;

// Start server if run directly
if (require.main === module) {
  const { connectDB } = require('./src/config/database');
  const port = process.env.PORT || 3000;
  
  connectDB()
    .then(() => {
      app.listen(port, () => {
        console.log(`Nameverse API running on port ${port}`);
      });
    })
    .catch((error) => {
      console.error('Failed to connect to MongoDB:', error.message);
      process.exit(1);
    });
}
