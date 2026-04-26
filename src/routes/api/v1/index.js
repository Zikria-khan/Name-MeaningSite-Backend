const express = require('express');
const router = express.Router();

// Import route modules
const namesRoutes = require('./names');
const healthRoutes = require('./health');
const articlesRoutes = require('./articles');

// Mount routes
router.use('/names', namesRoutes);
router.use('/health', healthRoutes);
router.use('/articles', articlesRoutes);

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
      },
      articles: {
        list: 'GET /api/v1/articles?page=1&limit=10',
        featured: 'GET /api/v1/articles/featured?limit=5',
        latest: 'GET /api/v1/articles/latest?limit=10',
        categories: 'GET /api/v1/articles/categories',
        search: 'GET /api/v1/articles/search?q=query',
        byTag: 'GET /api/v1/articles/tag/:tag',
        related: 'GET /api/v1/articles/related/:slug',
        stats: 'GET /api/v1/articles/stats',
        single: 'GET /api/v1/articles/:slug'
      }
    },
    documentation: 'https://github.com/nameverse/api',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
