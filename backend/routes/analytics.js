const express = require('express');
const router = express.Router();

router.get('/summary', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const history = db.collection('query_history');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, todayCount, avgData, topQueries] = await Promise.all([
      history.countDocuments(),
      history.countDocuments({ timestamp: { $gte: today } }),
      history.aggregate([
        {
          $group: {
            _id: null,
            avgResults: { $avg: '$resultCount' },
            avgLatency: { $avg: '$latencyMs' }
          }
        }
      ]).toArray(),
      history.aggregate([
        { $group: { _id: '$query', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]).toArray()
    ]);

    res.json({
      totalSearches: total,
      todaySearches: todayCount,
      avgResultsPerSearch: avgData[0]?.avgResults?.toFixed(1) || '0',
      avgLatencyMs: Math.round(avgData[0]?.avgLatency || 0),
      topQueries: topQueries.map(q => ({ query: q._id, count: q.count }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const history = db.collection('query_history');
    const recent = await history
      .find({})
      .sort({ timestamp: -1 })
      .limit(25)
      .toArray();
    res.json({ history: recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Searches per day (last 7 days)
router.get('/trend', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const history = db.collection('query_history');
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trend = await history.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    res.json({ trend });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;