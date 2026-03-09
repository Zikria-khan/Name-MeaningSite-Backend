// utils/cache.js
const redis = require("../lib/redisClient");

const DEFAULT_EXPIRY = process.env.CACHE_TTL || 60 * 60 * 24; // 24 hours or from env

async function getCache(key) {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

async function setCache(key, value, expiry = DEFAULT_EXPIRY) {
  await redis.set(key, JSON.stringify(value), "EX", expiry);
}

async function deleteCache(key) {
  await redis.del(key);
}

module.exports = {
  getCache,
  setCache,
  deleteCache,
};
