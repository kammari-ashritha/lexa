const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Get all documents (grouped by title)
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const documents = db.collection('documents');

    const docs = await documents.aggregate([
      {
        $group: {
          _id: '$title',
          category: { $first: '$category' },
          tags: { $first: '$tags' },
          chunks: { $sum: 1 },
          preview: { $first: '$content' },
          totalWords: { $sum: '$word_count' },
          insertedAt: { $min: '$_id' }
        }
      },
      { $sort: { insertedAt: -1 } },
      { $limit: 100 }
    ]).toArray();

    res.json({ documents: docs, total: docs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload & ingest a document
router.post('/ingest', async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const response = await axios.post(`${AI_URL}/ingest`, {
      title, content,
      category: category || 'General',
      tags: tags || []
    }, { timeout: 60000 });

    res.json(response.data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Python AI service not running. Start it first.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete a document by title
router.delete('/:title', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const documents = db.collection('documents');
    const result = await documents.deleteMany({ title: decodeURIComponent(req.params.title) });
    res.json({ deleted: result.deletedCount, title: req.params.title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DB Stats
router.get('/stats', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const documents = db.collection('documents');

    const [totalChunks, uniqueTitles, categories] = await Promise.all([
      documents.countDocuments(),
      documents.distinct('title'),
      documents.distinct('category')
    ]);

    res.json({
      totalChunks,
      totalDocuments: uniqueTitles.length,
      categories: categories.filter(Boolean),
      categoriesCount: categories.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;