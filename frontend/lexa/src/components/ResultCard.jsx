import { useState } from 'react'

const IconFile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13}}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)
const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IconChevronUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
    <polyline points="18 15 12 9 6 15"/>
  </svg>
)

export default function ResultCard({ result, index }) {
  const [expanded, setExpanded] = useState(false)

  const relevance = result.relevancePercent || Math.round((result.vectorScore || 0) * 100)
  const relevanceColor = relevance > 70 ? 'var(--green)' : relevance > 40 ? 'var(--purple-light)' : 'var(--text-muted)'

  const preview = (text, max = 200) => text.length > max ? text.slice(0, max) + '…' : text

  const staggerClass = index < 6 ? ` stagger-${index + 1}` : ''

  return (
    <div
      className={`result-card${staggerClass}`}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="result-inner">

        {/* Rank + relevance */}
        <div className="result-rank">
          <div className="rank-num">{index + 1}</div>
          <div className="rank-pct" style={{ color: relevanceColor }}>{relevance}%</div>
        </div>

        {/* Content */}
        <div className="result-content">
          {/* Header row */}
          <div className="result-header">
            <div className="result-title">
              <IconFile />
              <span>{result.title}</span>
              {result.chunk_index > 0 && (
                <span className="chunk-label">
                  chunk {result.chunk_index + 1}/{result.total_chunks}
                </span>
              )}
            </div>
            <div className="pills-row">
              {result.category && <span className="pill-cat">{result.category}</span>}
              {result.tags?.slice(0, 2).map(t => (
                <span key={t} className="pill-tag">{t}</span>
              ))}
            </div>
          </div>

          {/* Text */}
          <div className="result-text">
            {expanded ? result.content : preview(result.content)}
          </div>

          {/* Score bars */}
          <div className="score-bars">
            {result.vectorScore > 0 && (
              <div className="score-row">
                <span className="score-label">Vector</span>
                <div className="score-track">
                  <div
                    className="score-fill green"
                    style={{ width: `${Math.min(100, result.vectorScore * 100)}%` }}
                  />
                </div>
                <span className="score-val green">
                  {(result.vectorScore * 100).toFixed(0)}%
                </span>
              </div>
            )}
            {result.textScore > 0 && (
              <div className="score-row">
                <span className="score-label">Lexical</span>
                <div className="score-track">
                  <div
                    className="score-fill purple"
                    style={{ width: `${Math.min(100, result.textScore * 100)}%` }}
                  />
                </div>
                <span className="score-val purple">
                  {(result.textScore * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button className="result-expand-btn" onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}>
          {expanded ? <IconChevronUp /> : <IconChevronDown />}
        </button>

      </div>
    </div>
  )
}