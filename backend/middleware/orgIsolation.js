// middleware/orgIsolation.js
// Attaches scope/orgId to req for search & ingest filtering

const jwt = require('jsonwebtoken')

const orgIsolation = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lexa_jwt_secret')
      req.user      = decoded
      req.scope     = 'organization'
      req.orgId     = decoded.organizationId || decoded._id || decoded.id
    } else {
      req.user  = null
      req.scope = 'sample'
      req.orgId = null
    }
  } catch (e) {
    req.user  = null
    req.scope = 'sample'
    req.orgId = null
  }
  next()
}

module.exports = orgIsolation