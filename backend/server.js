const express = require('express')
const cors = require('cors')
const { MongoClient } = require('mongodb')
const dotenv = require('dotenv')
dotenv.config()

const app = express()

app.use(cors({
  origin: ['http://localhost:5173','https://lexa-one.vercel.app', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

const { searchLimiter, uploadLimiter, authLimiter } = require('./middleware/rateLimiter')

const searchRoutes    = require('./routes/search')
const documentRoutes  = require('./routes/documents')
const analyticsRoutes = require('./routes/analytics')
const chatRoutes      = require('./routes/chat')
const authRoutes      = require('./routes/authRoute')

app.use('/api/auth',      authLimiter,   authRoutes)
app.use('/api/search',    searchLimiter, searchRoutes)
app.use('/api/documents', uploadLimiter, documentRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/chat',      chatRoutes)

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))
app.get('/',       (req, res) => res.json({ service: 'Lexa Backend v3', status: 'running' }))

const PORT = process.env.PORT || 5000

async function start() {
  try {
    const client = await MongoClient.connect(process.env.MONGO_URI)
    const db = client.db('lexa_db')
    app.locals.db = db
    console.log('MongoDB Atlas connected')
    try {
      await db.collection('query_cache').createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })
    } catch(e) {}
    app.listen(PORT, () => console.log(`Lexa Backend running on port ${PORT}`))
  } catch (err) {
    console.error('MongoDB connection failed:', err)
    process.exit(1)
  }
}

start()