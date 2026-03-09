/**
 * Advanced Redis Cache Service with Fallback
 * @module config/redis
 * 
 * Features:
 * - Automatic connection management
 * - Graceful fallback when Redis unavailable
 * - Cache key prefixing
 * - TTL management
 * - Pattern-based cache invalidation
 * - Memory cache fallback (LRU)
 */

const Redis = require('ioredis');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');
require('dotenv').config();

/**
 * In-memory LRU cache for fallback
 */
class MemoryCache {
  constructor(options = {}) {
    this.cache = new NodeCache({
      stdTTL: options.stdTTL || 300,      // 5 minutes default
      checkperiod: options.checkperiod || 60,
      maxKeys: options.maxKeys || 1000,
      useClones: false                     // Better performance
    });
    this.hits = 0;
    this.misses = 0;
  }

  async get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.hits++;
      return value;
    }
    this.misses++;
    return null;
  }

  async set(key, value, ttl) {
    return this.cache.set(key, value, ttl);
  }

  async del(key) {
    return this.cache.del(key);
  }

  async delPattern(pattern) {
    const keys = this.cache.keys();
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let deleted = 0;
    keys.forEach(key => {
      if (regex.test(key)) {
        this.cache.del(key);
        deleted++;
      }
    });
    return deleted;
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
      keys: this.cache.keys().length
    };
  }

  async flush() {
    this.cache.flushAll();
    return true;
  }
}

/**
 * Redis Client with advanced features
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryCache = new MemoryCache();
    this.prefix = process.env.REDIS_PREFIX || 'nameverse:';
    this.enabled = process.env.REDIS_ENABLED !== 'false';
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
    
    // Default TTLs for different data types
    this.ttlConfig = {
      names: 3600,        // 1 hour
      filters: 7200,      // 2 hours
      search: 1800,       // 30 minutes
      trending: 900,      // 15 minutes
      static: 86400,      // 24 hours
      health: 60          // 1 minute
    };

    if (this.enabled && process.env.REDIS_URL) {
      this.initialize();
    } else {
      logger.info('Redis: Using in-memory cache (Redis disabled or no URL provided)');
    }
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      logger.warn('Redis: Max connection attempts reached, using memory cache');
      return;
    }

    try {
      this.connectionAttempts++;
      
      this.client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        retryDelayOnClusterDown: 100,
        enableReadyCheck: true,
        lazyConnect: true,
        connectTimeout: 5000,
        commandTimeout: 3000,
        keepAlive: 30000,
        family: 4
      });

      // Connection event handlers
      this.client.on('connect', () => {
        this.isConnected = true;
        this.connectionAttempts = 0;
        logger.info('Redis: Connected successfully');
      });

      this.client.on('ready', () => {
        logger.info('Redis: Ready to accept commands');
      });

      this.client.on('error', (error) => {
        logger.error('Redis: Connection error', { error: error.message });
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis: Connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis: Attempting to reconnect...');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Redis: Failed to connect', { error: error.message });
      this.isConnected = false;
    }
  }

  /**
   * Get prefixed key
   */
  _key(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Get cache implementation (Redis or Memory)
   */
  _getCache() {
    return this.isConnected && this.client ? this.client : this.memoryCache;
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  async get(key) {
    try {
      const prefixedKey = this._key(key);
      const cache = this._getCache();
      
      if (this.isConnected && this.client) {
        const value = await this.client.get(prefixedKey);
        return value ? JSON.parse(value) : null;
      }
      
      return await this.memoryCache.get(prefixedKey);
    } catch (error) {
      logger.error('Redis: Get error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {boolean} Success status
   */
  async set(key, value, ttl = 300) {
    try {
      const prefixedKey = this._key(key);
      
      if (this.isConnected && this.client) {
        await this.client.setex(prefixedKey, ttl, JSON.stringify(value));
      } else {
        await this.memoryCache.set(prefixedKey, value, ttl);
      }
      
      return true;
    } catch (error) {
      logger.error('Redis: Set error', { key, error: error.message });
      // Fallback to memory cache
      await this.memoryCache.set(this._key(key), value, ttl);
      return true;
    }
  }

  /**
   * Delete key from cache
   * @param {string} key - Cache key
   * @returns {boolean} Success status
   */
  async del(key) {
    try {
      const prefixedKey = this._key(key);
      
      if (this.isConnected && this.client) {
        await this.client.del(prefixedKey);
      }
      
      await this.memoryCache.del(prefixedKey);
      return true;
    } catch (error) {
      logger.error('Redis: Delete error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete keys matching pattern
   * @param {string} pattern - Pattern to match (e.g., 'names:*')
   * @returns {number} Number of keys deleted
   */
  async delPattern(pattern) {
    try {
      const prefixedPattern = this._key(pattern);
      let deleted = 0;

      if (this.isConnected && this.client) {
        const keys = await this.client.keys(prefixedPattern);
        if (keys.length > 0) {
          deleted = await this.client.del(...keys);
        }
      }

      // Also clear from memory cache
      deleted += await this.memoryCache.delPattern(prefixedPattern);
      
      logger.debug('Redis: Pattern delete', { pattern, deleted });
      return deleted;
    } catch (error) {
      logger.error('Redis: Pattern delete error', { pattern, error: error.message });
      return 0;
    }
  }

  /**
   * Get TTL for data type
   * @param {string} type - Data type
   * @returns {number} TTL in seconds
   */
  getTTL(type) {
    return this.ttlConfig[type] || 300;
  }

  /**
   * Cache-aside pattern implementation
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if not cached
   * @param {number} ttl - TTL in seconds
   * @returns {Object} { data, fromCache }
   */
  async getOrSet(key, fetchFn, ttl = 300) {
    try {
      // Try cache first
      const cached = await this.get(key);
      if (cached !== null) {
        return { data: cached, fromCache: true };
      }

      // Fetch fresh data
      const data = await fetchFn();
      
      // Cache the result
      if (data !== null && data !== undefined) {
        await this.set(key, data, ttl);
      }

      return { data, fromCache: false };
    } catch (error) {
      logger.error('Redis: getOrSet error', { key, error: error.message });
      // Try to fetch without caching
      const data = await fetchFn();
      return { data, fromCache: false };
    }
  }

  /**
   * Check if Redis is ready
   * @returns {boolean}
   */
  isReady() {
    return this.isConnected;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      redis: {
        connected: this.isConnected,
        enabled: this.enabled
      },
      memory: this.memoryCache.getStats()
    };
  }

  /**
   * Flush all cache
   * @returns {boolean} Success status
   */
  async flush() {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys(this._key('*'));
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      }
      await this.memoryCache.flush();
      logger.info('Redis: Cache flushed');
      return true;
    } catch (error) {
      logger.error('Redis: Flush error', { error: error.message });
      return false;
    }
  }

  /**
   * Graceful shutdown
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis: Disconnected');
    }
  }
}

// Export singleton instance
const redisClient = new RedisClient();

// Graceful shutdown
process.on('SIGINT', async () => {
  await redisClient.disconnect();
});

process.on('SIGTERM', async () => {
  await redisClient.disconnect();
});

module.exports = redisClient;