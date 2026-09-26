const { createClient } = require("redis");

let client;
let connectPromise;

function getClient() {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on("error", (error) => console.error("Redis error:", error.message));
  }
  if (!connectPromise) {
    connectPromise = client.connect().catch((error) => {
      connectPromise = undefined;
      console.error("Redis unavailable; continuing without cache:", error.message);
    });
  }
  return client;
}

async function getCachedPropertyList(key) {
  const redis = getClient();
  if (!redis || !connectPromise) return null;
  await connectPromise;
  if (!redis.isReady) return null;
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

async function cachePropertyList(key, value, ttlSeconds = 60) {
  const redis = getClient();
  if (!redis || !connectPromise) return;
  await connectPromise;
  if (redis.isReady) await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
}

async function clearPropertyListCache() {
  const redis = getClient();
  if (!redis || !connectPromise) return;
  await connectPromise;
  if (!redis.isReady) return;
  const keys = [];
  for await (const key of redis.scanIterator({ MATCH: "properties:list:*", COUNT: 100 })) keys.push(key);
  if (keys.length) await redis.del(keys);
}

function propertyListCacheKey(query) {
  const normalized = [...new URLSearchParams(query)].sort(([a], [b]) => a.localeCompare(b));
  return `properties:list:${new URLSearchParams(normalized).toString()}`;
}

module.exports = { getCachedPropertyList, cachePropertyList, clearPropertyListCache, propertyListCacheKey };