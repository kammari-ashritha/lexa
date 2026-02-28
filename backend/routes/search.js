const express = require('express')
const router = express.Router()
const axios = require('axios')
const { getStructuredSummary } = require('../utils/gemini')
const dotenv = require('dotenv')
dotenv.config()

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

async function getEmbedding(text) {
  const res = await axios.post(`${AI_URL}/embed`, { text }, { timeout: 60000 })
  return res.data.embedding
}

router.post('/', async (req, res) => {
  const startTime = Date.now()
  try {
    const db = req.app.locals.db
    const documents = db.collection('documents')
    const history = db.collection('query_history')
    const { query, limit = 10, category = null, useRAG = true } = req.body

    if (!query?.trim()) return res.status(400).json({ error: 'Query is required' })

    // Step 1: Embedding
    let embedding
    try {
      embedding = await getEmbedding(query)
    } catch (err) {
      return res.status(503).json({ error: 'AI service unavailable. Try again in 30 seconds.' })
    }

    // Step 2: Vector Search
    const vectorPipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 200,
          limit: parseInt(limit) * 2,
          ...(category && { filter: { category: { $eq: category } } })
        }
      },
      {
        $project: {
          _id: 1, title: 1, content: 1, category: 1, tags: 1,
          chunk_index: 1, total_chunks: 1, word_count: 1,
          vectorScore: { $meta: 'vectorSearchScore' }
        }
      }
    ]
    const vectorResults = await documents.aggregate(vectorPipeline).toArray()
    console.log(`Vector: ${vectorResults.length} results`)

    // Step 3: Full-Text Search
    let textResults = []
    try {
      const textPipeline = [
        {
          $search: {
            index: 'text_index',
            compound: {
              should: [
                { text: { query, path: 'title', score: { boost: { value: 3 } } } },
                { text: { query, path: 'content', fuzzy: { maxEdits: 1 } } }
              ]
            }
          }
        },
        { $limit: parseInt(limit) * 2 },
        {
          $project: {
            _id: 1, title: 1, content: 1, category: 1, tags: 1,
            chunk_index: 1, total_chunks: 1, word_count: 1,
            textScore: { $meta: 'searchScore' }
          }
        }
      ]
      textResults = await documents.aggregate(textPipeline).toArray()
    } catch (e) {
      console.log('Text index not available')
    }

    // Step 4: RRF fusion
    const RRF_K = 60
    const scoreMap = {}
    const maxTextScore = Math.max(...textResults.map(d => d.textScore || 0), 1)

    vectorResults.forEach((doc, rank) => {
      const id = doc._id.toString()
      if (!scoreMap[id]) scoreMap[id] = { doc, rrfScore: 0, vectorScore: 0, lexicalScore: 0 }
      scoreMap[id].rrfScore += 1 / (RRF_K + rank + 1)
      scoreMap[id].vectorScore = doc.vectorScore || 0
    })

    textResults.forEach((doc, rank) => {
      const id = doc._id.toString()
      if (!scoreMap[id]) scoreMap[id] = { doc, rrfScore: 0, vectorScore: 0, lexicalScore: 0 }
      scoreMap[id].rrfScore += 1 / (RRF_K + rank + 1)
      scoreMap[id].lexicalScore = (doc.textScore || 0) / maxTextScore
    })

    let hybridResults = Object.values(scoreMap)
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, parseInt(limit))
      .map(item => ({
        ...item.doc,
        _id: item.doc._id.toString(),
        score: item.rrfScore,
        vectorScore: item.vectorScore,
        lexicalScore: item.lexicalScore,
      }))

    // Step 5: Re-ranking
    let rerankUsed = false
    try {
      const rerankRes = await axios.post(`${AI_URL}/rerank`, {
        query,
        docs: hybridResults.slice(0, 10).map(r => ({
          id: r._id, content: r.content,
          vectorScore: r.vectorScore, lexicalScore: r.lexicalScore
        }))
      }, { timeout: 15000 })

      if (rerankRes.data?.docs?.length > 0) {
        const rerankMap = {}
        rerankRes.data.docs.forEach(d => { rerankMap[d.id] = d })
        hybridResults = hybridResults
          .map(r => rerankMap[r._id] ? { ...r, ...rerankMap[r._id] } : r)
          .sort((a, b) => (b.finalScore || b.score) - (a.finalScore || a.score))
          .slice(0, 5)
        rerankUsed = true
      }
    } catch(e) {
      console.log('Rerank skipped:', e.message)
    }

    // Step 6: Structured Gemini Summary
    let summary = null
    if (useRAG && hybridResults.length > 0) {
      summary = await getStructuredSummary(query, hybridResults)
    }

    // Step 7: History
    const latencyMs = Date.now() - startTime
    try {
      await history.insertOne({
        query: query.trim(), resultCount: hybridResults.length,
        hadSummary: !!summary, latencyMs,
        category: category || null, rerankUsed,
        timestamp: new Date()
      })
    } catch(e) {}

    res.json({
      query, summary, results: hybridResults,
      meta: {
        total: hybridResults.length, latencyMs,
        vectorHits: vectorResults.length, textHits: textResults.length,
        searchMode: textResults.length > 0 ? 'HYBRID' : 'VECTOR-ONLY',
        rerankUsed
      }
    })

  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ error: err.message })
  }
})

router.get('/suggest', async (req, res) => {
  try {
    const db = req.app.locals.db
    const { q } = req.query
    if (!q || q.length < 2) return res.json({ suggestions: [] })
    const results = await db.collection('query_history').aggregate([
      { $match: { query: { $regex: q, $options: 'i' } } },
      { $group: { _id: '$query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]).toArray()
    res.json({ suggestions: results.map(r => r._id) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router