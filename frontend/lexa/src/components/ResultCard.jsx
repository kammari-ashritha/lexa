import { useState, useEffect } from 'react'

function useTheme() {
  const [isLight, setIsLight] = useState(() => document.body.classList.contains('light-mode'))
  useEffect(() => {
    const obs = new MutationObserver(() => setIsLight(document.body.classList.contains('light-mode')))
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isLight
}

function WhyTooltip({ vectorScore, lexicalScore }) {
  const isLight = useTheme()
  const [show, setShow] = useState(false)
  const explanation = vectorScore > lexicalScore
    ? `Found because the meaning of your query closely matches this document's content (${vectorScore}% semantic similarity). Even if you used different words, the concepts aligned.`
    : `Found because your query keywords directly appear in this document (${lexicalScore}% keyword match) and it's semantically relevant.`

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={e => { e.stopPropagation(); setShow(s => !s) }}
        style={{
          background: isLight ? '#EDE9FF' : 'rgba(124,58,237,0.15)',
          border: isLight ? '1px solid #C4BBDF' : '1px solid rgba(124,58,237,0.4)',
          borderRadius: '50%', width: 18, height: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: isLight ? '#6D28D9' : '#A78BFA',
          fontSize: 11, fontWeight: 700, flexShrink: 0
        }}
      >?</button>
      {show && (
        <div style={{
          position: 'absolute', bottom: '120%', left: '50%',
          transform: 'translateX(-50%)',
          background: isLight ? '#FFFFFF' : '#1A003A',
          border: isLight ? '1px solid #DDD8EF' : '1px solid rgba(124,58,237,0.5)',
          borderRadius: 10, padding: '10px 14px',
          width: 260, zIndex: 100,
          boxShadow: isLight ? '0 8px 32px rgba(0,0,0,0.12)' : '0 8px 32px rgba(0,0,0,0.5)',
          fontSize: 12, lineHeight: 1.5,
          color: isLight ? '#1C1530' : '#E2D9F3',
          pointerEvents: 'none'
        }}>
          <div style={{ color: '#7C3AED', fontWeight: 700, marginBottom: 6, fontSize: 11 }}>WHY THIS RESULT?</div>
          <div style={{ marginBottom: 8 }}>{explanation}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              background: isLight ? '#DCFCE7' : 'rgba(0,237,100,0.15)',
              color: isLight ? '#15803D' : '#00ED64',
              padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600
            }}>Vector {vectorScore}%</span>
            <span style={{
              background: isLight ? '#EDE9FF' : 'rgba(168,85,247,0.15)',
              color: isLight ? '#6D28D9' : '#A855F7',
              padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600
            }}>Lexical {lexicalScore}%</span>
          </div>
          <div style={{
            position: 'absolute', bottom: -6, left: '50%',
            width: 10, height: 10,
            background: isLight ? '#FFFFFF' : '#1A003A',
            border: isLight ? '1px solid #DDD8EF' : '1px solid rgba(124,58,237,0.5)',
            borderTop: 'none', borderLeft: 'none',
            transform: 'translateX(-50%) rotate(45deg)'
          }} />
        </div>
      )}
    </div>
  )
}

export default function ResultCard({ result, index }) {
  const isLight = useTheme()
  const [expanded, setExpanded] = useState(false)

  const vectorScore  = Math.min(100, Math.round((result.vectorScore  || 0) * 100))
  const lexicalScore = Math.min(100, Math.round((result.lexicalScore || 0) * 100))
  const rrfScore     = Math.min(100, Math.round((result.score        || 0) * 6000))
  const isHybrid     = lexicalScore > 20

  const t = {
    matchLabelColor: isHybrid
      ? (isLight ? '#15803D' : '#00ED64')
      : (isLight ? '#6D28D9' : '#A855F7'),
    explanationColor: isLight ? '#5A5275' : '#7C6FA0',
    hybridBadgeBg:    isLight ? '#DCFCE7' : 'rgba(0,237,100,0.1)',
    hybridBadgeBorder:isLight ? '1px solid #86EFAC' : '1px solid rgba(0,237,100,0.25)',
    hybridBadgeColor: isLight ? '#15803D' : '#00ED64',
    semanticBadgeBg:  isLight ? '#EDE9FF' : 'rgba(168,85,247,0.1)',
    semanticBadgeBorder:isLight?'1px solid #C4BBDF':'1px solid rgba(168,85,247,0.25)',
    semanticBadgeColor:isLight ? '#6D28D9' : '#A855F7',
    pillCatBg:        isLight ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : 'rgba(124,58,237,0.2)',
    pillCatBorder:    isLight ? 'transparent' : 'rgba(168,85,247,0.4)',
    pillCatColor:     '#FFFFFF',
    pillTagBg:        isLight ? '#DCFCE7' : 'rgba(0,237,100,0.12)',
    pillTagBorder:    isLight ? '#86EFAC' : 'rgba(0,237,100,0.35)',
    pillTagColor:     isLight ? '#15803D' : '#00ED64',
  }

  return (
    <div
      className={`result-card stagger-${Math.min(index+1,6)}`}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="result-inner">
        {/* Rank */}
        <div className="result-rank">
          <div className="rank-num">{index + 1}</div>
          <div className="rank-pct" style={{ color: rrfScore > 60 ? '#00ED64' : '#A855F7' }}>
            {rrfScore}%
          </div>
          <div style={{
            fontSize: 8, color: t.matchLabelColor,
            fontWeight: 700, letterSpacing: '0.05em',
            textAlign: 'center', lineHeight: 1.2, marginTop: 2
          }}>
            {isHybrid ? 'HYBRID' : 'SEMANTIC'}
          </div>
        </div>

        {/* Content */}
        <div className="result-content">
          <div className="result-header">
            <div className="result-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,color:'#A78BFA',flexShrink:0}}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              {result.title}
              {result.chunk_index !== undefined && (
                <span className="chunk-label">· chunk {result.chunk_index + 1}</span>
              )}
              <WhyTooltip vectorScore={vectorScore} lexicalScore={lexicalScore} title={result.title} />
            </div>

            {/* Pills — theme-aware */}
            <div className="pills-row">
              {result.category && (
                <span style={{
                  padding: '3px 12px', borderRadius: 9999,
                  background: t.pillCatBg,
                  border: `1px solid ${t.pillCatBorder}`,
                  color: t.pillCatColor,
                  fontSize: 11, fontWeight: 600
                }}>{result.category}</span>
              )}
              {result.tags?.[0] && (
                <span style={{
                  padding: '3px 12px', borderRadius: 9999,
                  background: t.pillTagBg,
                  border: `1px solid ${t.pillTagBorder}`,
                  color: t.pillTagColor,
                  fontSize: 11, fontWeight: 600
                }}>{result.tags[0]}</span>
              )}
            </div>
          </div>

          <div className="result-text">
            {expanded
              ? result.content
              : (result.content?.slice(0, 220) + (result.content?.length > 220 ? '...' : ''))}
          </div>

          {/* Score bars */}
          <div className="score-bars">
            <div className="score-row">
              <span className="score-label">Vector</span>
              <div className="score-track">
                <div className="score-fill green" style={{ width: `${vectorScore}%` }} />
              </div>
              <span className="score-val green">{vectorScore}%</span>
            </div>
            <div className="score-row">
              <span className="score-label">Lexical</span>
              <div className="score-track">
                <div className="score-fill purple" style={{ width: `${lexicalScore}%` }} />
              </div>
              <span className="score-val purple">{lexicalScore > 0 ? `${lexicalScore}%` : 'semantic'}</span>
            </div>
          </div>

          {/* Match type badge + explanation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{
              background: isHybrid ? t.hybridBadgeBg : t.semanticBadgeBg,
              border: isHybrid ? t.hybridBadgeBorder : t.semanticBadgeBorder,
              color: isHybrid ? t.hybridBadgeColor : t.semanticBadgeColor,
              borderRadius: 20, padding: '2px 10px',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.04em'
            }}>
              {isHybrid ? 'HYBRID MATCH' : 'SEMANTIC MATCH'}
            </span>
            <span style={{ fontSize: 11, color: t.explanationColor, fontStyle: 'italic' }}>
              {isHybrid
                ? `Matched via meaning (${vectorScore}%) and keywords (${lexicalScore}%)`
                : `Matched via semantic meaning — exact words may differ`}
            </span>
          </div>
        </div>

        <button className="result-expand-btn" onClick={e => { e.stopPropagation(); setExpanded(x => !x) }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16,transform:expanded?'rotate(180deg)':'none',transition:'transform 0.2s'}}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
    </div>
  )
}