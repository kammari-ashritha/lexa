import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Analytics() {
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState([])
  const [trend, setTrend]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE}/analytics/summary`).catch(() => ({ data: null })),
      axios.get(`${API_BASE}/analytics/history`).catch(() => ({ data: { history: [] } })),
      axios.get(`${API_BASE}/analytics/trend`).catch(()   => ({ data: { trend: [] } })),
    ]).then(([s, h, t]) => {
      setSummary(s.data)
      setHistory(h.data?.history || [])
      setTrend(t.data?.trend || [])
    }).finally(() => setLoading(false))
  }, [])

  const maxTrend = Math.max(...trend.map(t => t.count), 1)

  if (loading) return (
    <main className="lexa-main-wide">
      <div style={{textAlign:'center',padding:'64px 0',color:'#C4B5FD'}}>Loading analytics...</div>
    </main>
  )

  const statCards = summary ? [
    { label: 'Total Searches', value: summary.totalSearches,       color: '#A855F7' },
    { label: 'Today',          value: summary.todaySearches,       color: '#00ED64' },
    { label: 'Avg Results',    value: summary.avgResultsPerSearch, color: '#A855F7' },
    { label: 'Avg Latency',    value: `${summary.avgLatencyMs}ms`, color: '#00ED64' },
  ] : []

  return (
    <main className="lexa-main-wide">
      <div className="section-header">
        <div className="section-title">Search Analytics</div>
        <div className="section-sub">MongoDB aggregation-powered query intelligence</div>
      </div>

      {statCards.length > 0 && (
        <div className="analytics-grid">
          {statCards.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-card-label" style={{marginBottom:12,color:'#C4B5FD'}}>{s.label}</div>
              <div className="stat-card-value" style={{color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="analytics-panels">
        {trend.length > 0 && (
          <div className="panel">
            <div className="panel-title" style={{color:'#00ED64'}}>Searches — Last 7 Days</div>
            <div className="bar-chart">
              {trend.map((t, i) => (
                <div key={i} className="bar-col">
                  <div className="bar-fill" style={{ height: `${Math.max(4, (t.count / maxTrend) * 72)}px` }} />
                  <span className="bar-label">{t._id?.slice(5) || ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary?.topQueries?.length > 0 && (
          <div className="panel">
            <div className="panel-title" style={{color:'#A855F7'}}>Top Queries</div>
            <div className="query-list">
              {summary.topQueries.map((q, i) => (
                <div key={i} className="query-row">
                  <span className="query-num">{i + 1}</span>
                  <span className="query-text">{q.query}</span>
                  <span className="query-count">{q.count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="panel" style={{marginTop:16}}>
          <div className="panel-title" style={{color:'#9CA3AF'}}>Recent Searches</div>
          {history.map((h, i) => (
            <div key={i} className="history-row">
              <div className="history-query">
                {h.query}
                {h.hadSummary && <span className="history-ai-badge">AI</span>}
              </div>
              <div className="history-meta">
                <span>{h.resultCount} results</span>
                <span>{h.latencyMs}ms</span>
                <span>{new Date(h.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!summary && !loading && (
        <div style={{textAlign:'center',padding:'40px',color:'#C4B5FD'}}>
          No analytics yet. Start searching to see data here!
        </div>
      )}
    </main>
  )
}
