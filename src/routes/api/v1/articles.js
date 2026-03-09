const express = require('express');
const router = express.Router();
const articlesController = require('../../../controllers/articlesController');

/**
 * @route   GET /api/v1/articles
 * @desc    Get paginated list of articles with optional filters
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 10, max: 50)
 * @query   {string} category - Filter by category
 * @query   {string} sort - Sort order: recent, oldest, views, likes (default: recent)
 * @access  Public
 * @note    Articles now served from JSON files instead of database
 */
router.get('/', (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      sort = 'recent'
    } = req.query;

    const result = articlesController.listArticles({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 10, 50),
      category,
      sort
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/articles/featured
 * @desc    Get featured articles
 * @query   {number} limit - Number of articles (default: 5, max: 20)
 * @access  Public
 */
router.get('/featured', (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const result = articlesController.getFeaturedArticles(
      Math.min(parseInt(limit) || 5, 20)
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/articles/latest
 * @desc    Get latest published articles
 * @query   {number} limit - Number of articles (default: 10, max: 50)
 * @access  Public
 */
router.get('/latest', (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const result = articlesController.getLatestArticles(
      Math.min(parseInt(limit) || 10, 50)
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/articles/categories
 * @desc    Get all article categories with counts
 * @access  Public
 */
router.get('/categories', (req, res, next) => {
  try {
    const result = articlesController.getArticleCategories();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/articles/search
 * @desc    Search articles by query
 * @query   {string} q - Search query (required, min: 2 characters)
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 10, max: 50)
 * @access  Public
 */
router.get('/search', (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const result = articlesController.searchArticles(q, {
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 10, 50)
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/articles/tag/:tag
 * @desc    Get articles by tag
 * @param   {string} tag - Tag name
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 10, max: 50)
 * @access  Public
 */
router.get('/tag/:tag', (req, res, next) => {
  try {
    const { tag } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = articlesController.getArticlesByTag(tag, 
      parseInt(page) || 1,
      Math.min(parseInt(limit) || 10, 50)
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/articles/related/:slug
 * @desc    Get articles related to a specific article
 * @param   {string} slug - Article slug
 * @query   {number} limit - Number of related articles (default: 5, max: 10)
 * @access  Public
 */
router.get('/related/:slug', (req, res, next) => {
  try {
    const { slug } = req.params;
    const { limit = 5 } = req.query;

    const result = articlesController.getRelatedArticles(slug,
      Math.min(parseInt(limit) || 5, 10)
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/articles/stats
 * @desc    Get article statistics
 * @access  Public
 */
router.get('/stats', (req, res, next) => {
  try {
    const result = articlesController.getArticleStatistics();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/articles/:slug
 * @desc    Get article by slug
 * @param   {string} slug - Article slug
 * @access  Public
 */
router.get('/:slug', (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = articlesController.getArticleBySlug(slug);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const result = await articlesController.searchArticles(q, {
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 10, 50)
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/articles/:slug
 * @desc    Get single article by slug
 * @param   {string} slug - Article slug
 * @access  Public
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const result = await articlesController.getArticleBySlug(req.params.slug);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
