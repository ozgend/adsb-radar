const DEFAULT_CACHE_TTL = process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 60 * 10; // 10 minutes

const _cache = new Map();

const get = (key) => {
  const item = _cache.get(key);
  if (!item) return null;
  if (item.expire < Date.now()) {
    _cache.delete(key);
    return null;
  }
  return item.value;
};

const set = (key, value, ttlSeconds) => {
  ttlSeconds = ttlSeconds || DEFAULT_CACHE_TTL;
  _cache.set(key, { value, expire: Date.now() + (ttlSeconds * 1000) });
};

module.exports = { get, set };



