const express = require('express')
const router = express.Router()
const axios = require('axios')
const { getChatResponse } = require('../utils/gemini')

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

router.post('/', async (req, res) => {
  const startTime = Date.now()
  try {
    const db = req.app.locals.db
    const { query, sessionId, history = [] } = req.body

    if (!query?.trim()) return res.status(400).json({ error: 'Query required' })
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' })

    let embedding
    try {
      const embedRes = await axios.post(`${AI_URL}/embed`, { text: query }, { timeout: 60000 })
      embedding = embedRes.data.embedding
    } catch(e) {
      return res.status(503).json({ error: 'AI service unavailable. Wake it up first.' })
    }

    const docs = await db.collection('documents').aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 50,
          limit: 5
        }
      },
      {
        $project: {
          _id: 1, title: 1, content: 1,
          vectorScore: { $meta: 'vectorSearchScore' }
        }
      }
    ]).toArray()

    if (docs.length === 0) {
      return res.json({
        answer: "I couldn't find relevant information in the uploaded documents. Please upload documents related to your question first.",
        sources: [], sessionId,
        latencyMs: Date.now() - startTime
      })
    }

    const context = docs
      .map((d, i) => `[Source ${i+1}] ${d.title}: ${d.content.slice(0, 500)}`)
      .join('\n\n')

    const answer = await getChatResponse(query, context, history)

    if (!answer) {
      return res.json({
        answer: "Found documents but couldn't generate response. Check Gemini API key.",
        sources: docs.map(d => ({ id: d._id, title: d.title, score: d.vectorScore })),
        sessionId
      })
    }

    try {
      await db.collection('chat_sessions').updateOne(
        { sessionId },
        {
          $push: {
            messages: {
              $each: [
                { role: 'user', content: query, timestamp: new Date() },
                { role: 'assistant', content: answer, sources: docs.map(d => d._id.toString()), timestamp: new Date() }
              ]
            }
          },
          $set: { updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      )
    } catch(e) { console.log('Session save error:', e.message) }

    res.json({
      answer,
      sources: docs.map(d => ({ id: d._id, title: d.title, score: Math.round(d.vectorScore * 100) })),
      sessionId,
      latencyMs: Date.now() - startTime
    })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: err.message })
  }
})

router.get('/history/:sessionId', async (req, res) => {
  try {
    const db = req.app.locals.db
    const session = await db.collection('chat_sessions').findOne({ sessionId: req.params.sessionId })
    res.json({ messages: session?.messages || [] })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

router.delete('/history/:sessionId', async (req, res) => {
  try {
    const db = req.app.locals.db
    await db.collection('chat_sessions').deleteOne({ sessionId: req.params.sessionId })
    res.json({ success: true })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

module.exports = router