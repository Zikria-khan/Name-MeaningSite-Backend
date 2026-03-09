// lib/redisClient.js
const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  db: 0,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  reconnectOnError: (err) => {
    const reconnectErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
    return reconnectErrors.some((msg) => err.message.includes(msg));
  },
});

redis.on("connect", () => {
  console.log("🟢 Redis connected");
});

redis.on("error", (err) => {
  console.error("🔴 Redis error:", err);
});

module.exports = redis;
