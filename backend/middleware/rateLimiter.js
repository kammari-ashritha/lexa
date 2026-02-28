const rateLimit = require('express-rate-limit')

exports.searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many searches. Wait 1 minute.' }
})

exports.uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many uploads. Wait 1 minute.' }
})

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many auth attempts.' }
})