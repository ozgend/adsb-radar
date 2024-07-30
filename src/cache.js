const _ttl = process.env.ICAO_CACHE ? parseInt(process.env.ICAO_CACHE) : 1000 * 60 * 10; // 10 minutes
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

const set = (key, value) => {
  _cache.set(key, { value, expire: Date.now() + _ttl });
};

module.exports = { get, set };



