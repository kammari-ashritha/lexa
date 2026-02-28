const NodeCache = require('node-cache')
const cache = new NodeCache({ stdTTL: 3600 }) // 1 hour default

// Cache middleware for GET routes
exports.cacheMiddleware = (ttl = 300) => (req, res, next) => {
  const key = `cache_${req.originalUrl}`
  const cached = cache.get(key)
  if (cached) {
    return res.json(cached)
  }
  res.sendResponse = res.json.bind(res)
  res.json = (body) => {
    cache.set(key, body, ttl)
    res.sendResponse(body)
  }
  next()
}

exports.get    = (key) => cache.get(key)
exports.set    = (key, value, ttl) => cache.set(key, value, ttl)
exports.del    = (key) => cache.del(key)
exports.flush  = () => cache.flushAll()