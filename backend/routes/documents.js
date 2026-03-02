const express      = require('express')
const router       = express.Router()
const axios        = require('axios')
const crypto       = require('crypto')
const dotenv       = require('dotenv')
const orgIsolation = require('../middleware/orgIsolation')
dotenv.config()

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

function chunkText(text, chunkSize = 500, overlap = 50) {
  const words  = text.split(/\s+/)
  const chunks = []
  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.split(/\s+/).length >= 20) chunks.push(chunk)
    i += chunkSize - overlap
  }
  return chunks.length ? chunks : [text]
}

router.use(orgIsolation)

// ── GET all documents (scoped) ─────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const db     = req.app.locals.db
    const filter = req.scope === 'organization' && req.orgId
      ? { organizationId: req.orgId }
      : { scope: 'sample' }

    const docs = await db.collection('documents').aggregate([
      { $match: filter },
      {
        $group: {
          _id:        '$title',
          category:   { $first: '$category' },
          tags:       { $first: '$tags' },
          chunks:     { $sum: 1 },
          preview:    { $first: '$content' },
          totalWords: { $sum: '$word_count' },
          insertedAt: { $min: '$_id' },
          model:      { $first: '$model' }
        }
      },
      { $sort: { insertedAt: -1 } },
      { $limit: 100 }
    ]).toArray()

    res.json({ documents: docs, total: docs.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /ingest (attaches scope + orgId) ─────────────────────
router.post('/ingest', async (req, res) => {
  try {
    const { title, content, category = 'General', tags = [] } = req.body
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'Title and content are required' })
    }

    const db         = req.app.locals.db
    const collection = db.collection('documents')
    const scope      = req.scope || 'sample'
    const orgId      = req.orgId || null

    // Dedup
    const checksum = crypto.createHash('md5').update(content).digest('hex')
    const existing = await collection.findOne({
      checksum,
      ...(orgId ? { organizationId: orgId } : { scope })
    })
    if (existing) {
      return res.json({ message: 'Document already exists', duplicate: true, title })
    }

    // Chunk
    const chunks = chunkText(content)

    // Embed via ai-service /embed-batch (or fallback one-by-one)
    let embeddings
    try {
      const batchRes = await axios.post(`${AI_URL}/embed-batch`,
        { texts: chunks }, { timeout: 120000 })
      embeddings = batchRes.data.embeddings
      if (!embeddings || embeddings.length !== chunks.length) throw new Error('mismatch')
    } catch {
      embeddings = []
      for (const chunk of chunks) {
        const r = await axios.post(`${AI_URL}/embed`, { text: chunk }, { timeout: 60000 })
        embeddings.push(r.data.embedding)
      }
    }

    const tagList = Array.isArray(tags)
      ? tags
      : String(tags).split(',').map(t => t.trim()).filter(Boolean)

    const docs = chunks.map((chunk, idx) => ({
      title,
      content:        chunk,
      category,
      tags:           tagList,
      embedding:      embeddings[idx],
      chunk_index:    idx,
      total_chunks:   chunks.length,
      word_count:     chunk.split(/\s+/).length,
      checksum:       idx === 0 ? checksum : null,
      scope,
      organizationId: orgId,
      model:          'voyage-3-lite',
      dimensions:     embeddings[idx].length,
      created_at:     new Date()
    }))

    await collection.insertMany(docs)

    res.json({
      message:    'Document ingested successfully',
      title,
      chunks:     chunks.length,
      dimensions: embeddings[0].length,
      model:      'voyage-3-lite',
      scope,
      duplicate:  false
    })

  } catch (err) {
    console.error('Ingest error:', err.message)
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'AI service not running. Please wait 30 seconds.' })
    }
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE (scoped) ────────────────────────────────────────────
router.delete('/:title', async (req, res) => {
  try {
    const db     = req.app.locals.db
    const filter = {
      title: decodeURIComponent(req.params.title),
      ...(req.orgId ? { organizationId: req.orgId } : { scope: 'sample' })
    }
    const result = await db.collection('documents').deleteMany(filter)
    res.json({ deleted: result.deletedCount })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Stats (scoped) ─────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const db     = req.app.locals.db
    const col    = db.collection('documents')
    const filter = req.scope === 'organization' && req.orgId
      ? { organizationId: req.orgId }
      : { scope: 'sample' }

    const [totalChunks, uniqueTitles, categories] = await Promise.all([
      col.countDocuments(filter),
      col.distinct('title', filter),
      col.distinct('category', filter)
    ])

    res.json({
      totalChunks,
      totalDocuments:  uniqueTitles.length,
      categories:      categories.filter(Boolean),
      categoriesCount: categories.length
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router