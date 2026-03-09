/**
 * Articles Service - Serves articles from JSON files instead of database
 * Provides same interface as database but reads from local JSON files
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ArticlesService {
  constructor() {
    this.articlesPath = path.join(__dirname, '../../seed-data/articles-from-db.json');
    this.fallbackPath = path.join(__dirname, '../../seed-data/articles-1500-complete.json');
    this.articles = [];
    this.loadArticles();
  }

  /**
   * Load articles from JSON file
   */
  loadArticles() {
    try {
      // Try primary file first
      let filePath = this.articlesPath;
      if (!fs.existsSync(filePath)) {
        // Fallback to alternative file
        filePath = this.fallbackPath;
      }

      if (!fs.existsSync(filePath)) {
        logger.warn(`No articles file found at ${filePath}`);
        this.articles = [];
        return;
      }

      const data = fs.readFileSync(filePath, 'utf8');
      this.articles = JSON.parse(data);
      logger.info(`✓ Loaded ${this.articles.length} articles from JSON`);
    } catch (error) {
      logger.error(`Error loading articles: ${error.message}`);
      this.articles = [];
    }
  }

  /**
   * Get all articles with filtering and pagination
   */
  getArticles(options = {}) {
    const {
      page = 1,
      limit = 10,
      category = null,
      status = 'published',
      sort = 'recent',
      search = null
    } = options;

    let results = [...this.articles];

    // Filter by status
    if (status) {
      results = results.filter(a => a.status === status);
    }

    // Filter by category
    if (category) {
      results = results.filter(a => a.category === category);
    }

    // Search in title, subtitle, content
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(a =>
        a.title?.toLowerCase().includes(searchLower) ||
        a.subtitle?.toLowerCase().includes(searchLower) ||
        a.content?.toLowerCase().includes(searchLower) ||
        a.tags?.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    switch (sort) {
      case 'views':
        results.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'likes':
        results.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'oldest':
        results.sort((a, b) => {
          const dateA = new Date(a.publishedAt || a.createdAt || 0);
          const dateB = new Date(b.publishedAt || b.createdAt || 0);
          return dateA - dateB;
        });
        break;
      case 'recent':
      default:
        results.sort((a, b) => {
          const dateA = new Date(b.publishedAt || b.createdAt || 0);
          const dateB = new Date(a.publishedAt || a.createdAt || 0);
          return dateA - dateB;
        });
        break;
    }

    // Get total count before pagination
    const total = results.length;

    // Pagination
    const skip = (page - 1) * limit;
    const paginated = results.slice(skip, skip + limit);

    return {
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items: paginated
    };
  }

  /**
   * Get single article by slug
   */
  getArticleBySlug(slug) {
    if (!slug) {
      return {
        success: false,
        error: 'Slug is required'
      };
    }

    const article = this.articles.find(a => a.slug === slug);

    if (!article) {
      return {
        success: false,
        error: 'Article not found',
        statusCode: 404
      };
    }

    // Increment views
    article.views = (article.views || 0) + 1;

    return {
      success: true,
      data: article
    };
  }

  /**
   * Get articles by category
   */
  getArticlesByCategory(category, page = 1, limit = 10) {
    return this.getArticles({
      category,
      page,
      limit,
      status: 'published'
    });
  }

  /**
   * Search articles
   */
  searchArticles(query, page = 1, limit = 10) {
    return this.getArticles({
      search: query,
      page,
      limit,
      status: 'published'
    });
  }

  /**
   * Get articles by tag
   */
  getArticlesByTag(tag, page = 1, limit = 10) {
    let results = this.articles.filter(a =>
      a.tags && a.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );

    const total = results.length;

    // Sort by recent
    results.sort((a, b) => {
      const dateA = new Date(b.publishedAt || b.createdAt || 0);
      const dateB = new Date(a.publishedAt || a.createdAt || 0);
      return dateA - dateB;
    });

    // Pagination
    const skip = (page - 1) * limit;
    const paginated = results.slice(skip, skip + limit);

    return {
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      tag,
      items: paginated
    };
  }

  /**
   * Get related articles
   */
  getRelatedArticles(slug, limit = 5) {
    const article = this.articles.find(a => a.slug === slug);
    if (!article) {
      return {
        success: false,
        error: 'Article not found'
      };
    }

    let related = this.articles.filter(a =>
      a.slug !== slug &&
      (
        a.category === article.category ||
        (a.tags && article.tags && a.tags.some(tag => article.tags.includes(tag)))
      )
    );

    // Sort by views
    related.sort((a, b) => (b.views || 0) - (a.views || 0));

    return {
      success: true,
      items: related.slice(0, limit)
    };
  }

  /**
   * Get all categories
   */
  getCategories() {
    const categories = [...new Set(this.articles.map(a => a.category))];
    return {
      success: true,
      categories: categories.sort()
    };
  }

  /**
   * Get all tags
   */
  getTags() {
    const tags = new Set();
    this.articles.forEach(a => {
      if (a.tags && Array.isArray(a.tags)) {
        a.tags.forEach(tag => tags.add(tag));
      }
    });
    return {
      success: true,
      tags: Array.from(tags).sort()
    };
  }

  /**
   * Get featured articles
   */
  getFeaturedArticles(limit = 5) {
    let featured = this.articles
      .filter(a => a.status === 'published')
      .sort((a, b) => {
        // Sort by views first, then by date
        const viewDiff = (b.views || 0) - (a.views || 0);
        if (viewDiff !== 0) return viewDiff;
        
        const dateA = new Date(b.publishedAt || b.createdAt || 0);
        const dateB = new Date(a.publishedAt || a.createdAt || 0);
        return dateA - dateB;
      });

    return {
      success: true,
      items: featured.slice(0, limit)
    };
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const published = this.articles.filter(a => a.status === 'published').length;
    const totalViews = this.articles.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalLikes = this.articles.reduce((sum, a) => sum + (a.likes || 0), 0);
    const categories = new Set(this.articles.map(a => a.category));

    return {
      success: true,
      data: {
        totalArticles: this.articles.length,
        publishedArticles: published,
        totalViews,
        totalLikes,
        totalCategories: categories.size,
        averageViews: (totalViews / published).toFixed(2),
        averageLikes: (totalLikes / published).toFixed(2)
      }
    };
  }

  /**
   * Reload articles from file (useful if file is updated)
   */
  reload() {
    this.loadArticles();
    return {
      success: true,
      message: `Reloaded ${this.articles.length} articles`
    };
  }
}

// Create singleton instance
const articlesService = new ArticlesService();

module.exports = articlesService;
