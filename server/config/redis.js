const { createClient } = require("redis");

const configuredRedisUrl = (process.env.REDIS_URL || "redis://127.0.0.1:6379")
  .trim()
  .replace(/^redis-cli\s+-u\s+/i, "")
  .replace(/^['"]|['"]$/g, "");

const redisClient = createClient({
  url: configuredRedisUrl,
});

redisClient.on("error", (error) => {
  console.error("Redis Client Error:", error);
});

redisClient.on("ready", () => {
  console.log("Redis connected and ready");
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

module.exports = {
  redisClient,
  connectRedis,
};
