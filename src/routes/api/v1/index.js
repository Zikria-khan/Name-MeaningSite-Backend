const express = require('express');
const router = express.Router();

// Import route modules
const healthRoutes = require('./health');
const namesRoutes = require('./names');

// Mount routes
router.use('/health', healthRoutes);
router.use('/names', namesRoutes);

// API v1 root endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    version: 'v1',
    name: 'Nameverse API',
    description: 'Professional REST API for name meanings',
    endpoints: {
      health: 'GET /api/v1/health',
      names: {
        list: 'GET /api/v1/names?religion=islamic&page=1&limit=50',
        single: 'GET /api/v1/names/:religion/:slug',
        byLetter: 'GET /api/v1/names/:religion/letter/:letter',
        related: 'GET /api/v1/names/:religion/:slug/related',
        similar: 'GET /api/v1/names/:religion/:slug/similar',
        filters: 'GET /api/v1/names/:religion/filters',
        search: 'GET /api/v1/names/search?q=query'
      }
    },
    documentation: 'https://github.com/nameverse/api',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
