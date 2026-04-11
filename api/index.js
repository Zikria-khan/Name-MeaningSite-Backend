const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables from .env if present
dotenv.config({ path: path.join(__dirname, '../.env') });

const { connectDB } = require('../src/config/database');
const apiV1Router = require('../src/routes/api/v1');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors({ origin: '*', credentials: false }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

app.use('/api/v1', apiV1Router);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Nameverse backend is running',
    version: '1.0.0'
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.use(errorHandler);

module.exports = app;

if (require.main === module) {
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
