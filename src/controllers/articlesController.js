/**
 * Articles Controller
 * Serves articles from JSON files instead of database
 * Maintains same API interface for backward compatibility
 */

const logger = require('../utils/logger');
const articlesService = require('../services/articlesService');

/**
 * List articles with filtering and pagination
 * Reads from JSON file instead of database
 */
const listArticles = (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      category = null,
      sort = 'recent'
    } = options;

    const result = articlesService.getArticles({
      page,
      limit,
      category,
      status: 'published',
      sort
    });

    return {
      ...result,
      hasMore: (page * limit) < result.total
    };
  } catch (error) {
    logger.error('Error in listArticles:', error);
    return {
      success: true,
      page: options.page || 1,
      limit: options.limit || 10,
      total: 0,
      totalPages: 0,
      hasMore: false,
      data: [],
      message: 'Articles temporarily unavailable'
    };
  }
};

/**
 * Get single article by slug
 */
const getArticleBySlug = (slug) => {
  try {
    if (!slug) {
      return {
        success: false,
        error: 'Slug is required',
        data: null
      };
    }

    const result = articlesService.getArticleBySlug(slug);
    return result;
  } catch (error) {
    logger.error('Error in getArticleBySlug:', error);
    return {
      success: false,
      error: 'Article not found',
      data: null
    };
  }
};

/**
 * Get article categories
 */
const getArticleCategories = () => {
  try {
    const result = articlesService.getCategories();
    
    // Format for compatibility
    return {
      success: true,
      count: result.categories.length,
      data: result.categories.map(category => ({
        category,
        count: articlesService.getArticlesByCategory(category, 1, 1).total
      }))
    };
  } catch (error) {
    logger.error('Error in getArticleCategories:', error);
    return {
      success: true,
      count: 0,
      data: [],
      message: 'Article categories temporarily unavailable'
    };
  }
};

/**
 * Get latest articles
 */
const getLatestArticles = (limit = 10) => {
  try {
    const result = articlesService.getArticles({
      page: 1,
      limit,
      sort: 'recent'
    });

    return {
      success: true,
      count: result.items.length,
      data: result.items
    };
  } catch (error) {
    logger.error('Error in getLatestArticles:', error);
    return {
      success: true,
      count: 0,
      data: [],
      message: 'Latest articles temporarily unavailable'
    };
  }
};

/**
 * Search articles
 */
const searchArticles = (query, options = {}) => {
  try {
    const { page = 1, limit = 10 } = options;

    if (!query || query.trim() === '') {
      return {
        success: false,
        error: 'Search query is required',
        data: []
      };
    }

    const result = articlesService.searchArticles(query, page, limit);

    return {
      success: true,
      query,
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasMore: (page * limit) < result.total,
      data: result.items
    };
  } catch (error) {
    logger.error('Error in searchArticles:', error);
    return {
      success: true,
      query: options.query || '',
      page: options.page || 1,
      limit: options.limit || 10,
      total: 0,
      totalPages: 0,
      hasMore: false,
      data: [],
      message: 'Article search temporarily unavailable'
    };
  }
};

/**
 * Get articles by tag
 */
const getArticlesByTag = (tag, page = 1, limit = 10) => {
  try {
    if (!tag) {
      return {
        success: false,
        error: 'Tag is required',
        data: []
      };
    }

    const result = articlesService.getArticlesByTag(tag, page, limit);
    return {
      ...result,
      hasMore: (page * limit) < result.total
    };
  } catch (error) {
    logger.error('Error in getArticlesByTag:', error);
    return {
      success: false,
      error: 'Error fetching articles by tag',
      data: []
    };
  }
};

/**
 * Get related articles
 */
const getRelatedArticles = (slug, limit = 5) => {
  try {
    if (!slug) {
      return {
        success: false,
        error: 'Slug is required',
        data: []
      };
    }

    const result = articlesService.getRelatedArticles(slug, limit);
    return result;
  } catch (error) {
    logger.error('Error in getRelatedArticles:', error);
    return {
      success: false,
      error: 'Error fetching related articles',
      data: []
    };
  }
};

/**
 * Get featured articles
 */
const getFeaturedArticles = (limit = 5) => {
  try {
    const result = articlesService.getFeaturedArticles(limit);
    return {
      success: true,
      count: result.items.length,
      data: result.items
    };
  } catch (error) {
    logger.error('Error in getFeaturedArticles:', error);
    return {
      success: true,
      count: 0,
      data: []
    };
  }
};

/**
 * Get article statistics
 */
const getArticleStatistics = () => {
  try {
    const result = articlesService.getStatistics();
    return result;
  } catch (error) {
    logger.error('Error in getArticleStatistics:', error);
    return {
      success: false,
      error: 'Error fetching statistics'
    };
  }
};

module.exports = {
  listArticles,
  getArticleBySlug,
  getArticleCategories,
  getLatestArticles,
  searchArticles,
  getArticlesByTag,
  getRelatedArticles,
  getFeaturedArticles,
  getArticleStatistics
};
