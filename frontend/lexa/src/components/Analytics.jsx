import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function useTheme() {
  const [isLight, setIsLight] = useState(() => document.body.classList.contains('light-mode'))
  useEffect(() => {
    const obs = new MutationObserver(() => setIsLight(document.body.classList.contains('light-mode')))
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isLight
}

export default function Analytics() {
  const isLight = useTheme()
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState([])
  const [trend,   setTrend]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE}/analytics/summary`).catch(() => ({ data: null })),
      axios.get(`${API_BASE}/analytics/history`).catch(() => ({ data: { history: [] } })),
      axios.get(`${API_BASE}/analytics/trend`).catch(()   => ({ data: { trend: [] } })),
    ]).then(([s, h, tr]) => {
      setSummary(s.data); setHistory(h.data?.history || []); setTrend(tr.data?.trend || [])
    }).finally(() => setLoading(false))
  }, [])

  const maxTrend = Math.max(...trend.map(t => t.count), 1)

  const t = {
    loadColor:    isLight ? '#6D28D9'           : '#C4B5FD',
    statCardBg:   isLight ? '#F7F6FB'           : 'rgba(255,255,255,0.03)',
    statCardBdr:  isLight ? '1px solid #DDD8EF' : '1px solid rgba(255,255,255,0.06)',
    statLabelClr: isLight ? '#475569'           : '#C4B5FD',
    panelBg:      isLight ? '#F7F6FB'           : 'rgba(255,255,255,0.03)',
    panelBdr:     isLight ? '1px solid #DDD8EF' : '1px solid rgba(255,255,255,0.06)',
    barBg:        isLight ? '#DDD8EF'           : 'rgba(255,255,255,0.08)',
    barFill:      isLight ? '#7C3AED'           : '#7C3AED',
    barLabel:     isLight ? '#475569'           : '#7C6FA0',
    queryNum:     isLight ? '#6D28D9'           : '#7C6FA0',
    queryText:    isLight ? '#0F172A'           : '#E2D9F3',
    queryCount:   isLight ? '#475569'           : '#7C6FA0',
    historyQuery: isLight ? '#0F172A'           : '#E2D9F3',
    historyMeta:  isLight ? '#475569'           : '#7C6FA0',
    historyBdr:   isLight ? '1px solid #F0EDF8' : '1px solid rgba(255,255,255,0.04)',
    emptyColor:   isLight ? '#6D28D9'           : '#C4B5FD',
    panelTitleSearches: isLight ? '#15803D'     : '#00ED64',
    panelTitleTop:      isLight ? '#6D28D9'     : '#A855F7',
    panelTitleRecent:   isLight ? '#475569'     : '#9CA3AF',
  }

  const STAT_COLORS_LIGHT = ['#6D28D9', '#15803D', '#6D28D9', '#15803D']
  const STAT_COLORS_DARK  = ['#A855F7', '#00ED64', '#A855F7', '#00ED64']

  if (loading) return (
    <main className="lexa-main-wide">
      <div style={{ textAlign: 'center', padding: '64px 0', color: t.loadColor }}>Loading analytics...</div>
    </main>
  )

  const statCards = summary ? [
    { label: 'Total Searches', value: summary.totalSearches },
    { label: 'Today',          value: summary.todaySearches },
    { label: 'Avg Results',    value: summary.avgResultsPerSearch },
    { label: 'Avg Latency',    value: `${summary.avgLatencyMs}ms` },
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
            <div key={i} style={{ background: t.statCardBg, border: t.statCardBdr, borderRadius: 12, padding: '20px 24px', boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.05)' : 'none' }}>
              <div style={{ color: t.statLabelClr, fontSize: 12, marginBottom: 12, fontWeight: 500 }}>{s.label}</div>
              <div style={{ color: isLight ? STAT_COLORS_LIGHT[i] : STAT_COLORS_DARK[i], fontSize: 28, fontWeight: 800 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="analytics-panels">
        {trend.length > 0 && (
          <div style={{ background: t.panelBg, border: t.panelBdr, borderRadius: 12, padding: 20, boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.05)' : 'none' }}>
            <div style={{ color: t.panelTitleSearches, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Searches — Last 7 Days</div>
            <div className="bar-chart">
              {trend.map((tr, i) => (
                <div key={i} className="bar-col">
                  <div className="bar-fill" style={{ height: `${Math.max(4, (tr.count / maxTrend) * 72)}px`, background: t.barFill }} />
                  <span className="bar-label" style={{ color: t.barLabel }}>{tr._id?.slice(5) || ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary?.topQueries?.length > 0 && (
          <div style={{ background: t.panelBg, border: t.panelBdr, borderRadius: 12, padding: 20, boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.05)' : 'none' }}>
            <div style={{ color: t.panelTitleTop, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Top Queries</div>
            <div className="query-list">
              {summary.topQueries.map((q, i) => (
                <div key={i} className="query-row">
                  <span style={{ color: t.queryNum, fontSize: 12, fontWeight: 700, width: 20 }}>{i + 1}</span>
                  <span style={{ color: t.queryText, fontSize: 13, flex: 1 }}>{q.query}</span>
                  <span style={{ color: t.queryCount, fontSize: 12 }}>{q.count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div style={{ background: t.panelBg, border: t.panelBdr, borderRadius: 12, padding: 20, marginTop: 16, boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.05)' : 'none' }}>
          <div style={{ color: t.panelTitleRecent, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Recent Searches</div>
          {history.map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: t.historyBdr }}>
              <div style={{ color: t.historyQuery, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                {h.query}
                {h.hadSummary && (
                  <span style={{ background: isLight ? '#EDE9FF' : 'rgba(0,237,100,0.1)', border: isLight ? '1px solid #C4BBDF' : '1px solid rgba(0,237,100,0.3)', color: isLight ? '#6D28D9' : '#00ED64', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>AI</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, color: t.historyMeta, fontSize: 12 }}>
                <span>{h.resultCount} results</span>
                <span style={{ fontWeight: 600 }}>{h.latencyMs}ms</span>
                <span>{new Date(h.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!summary && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: t.emptyColor }}>
          No analytics yet. Start searching to see data here!
        </div>
      )}
    </main>
  )
}